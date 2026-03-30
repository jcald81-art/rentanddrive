import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

export const maxDuration = 300 // 5 minutes for processing all vehicles
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const headersList = await headers()
  const authHeader = headersList.get('authorization')
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const results: Array<{
    vehicle_id: string
    make: string
    model: string
    status: 'success' | 'error' | 'skipped'
    old_rate?: number
    new_rate?: number
    confidence?: number
    error?: string
  }> = []

  try {
    // Fetch all active vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, make, model, year, daily_rate, host_id')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (vehiclesError) {
      throw new Error(`Failed to fetch vehicles: ${vehiclesError.message}`)
    }

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active vehicles to analyze',
        processed: 0,
      })
    }

    // Get host URL for internal API calls
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`

    // Process each vehicle with rate limiting (avoid overwhelming the API)
    for (const vehicle of vehicles) {
      try {
        // Check if we already analyzed this vehicle today
        const today = new Date().toISOString().split('T')[0]
        const { data: existingAnalysis } = await supabase
          .from('pricing_history')
          .select('id')
          .eq('vehicle_id', vehicle.id)
          .gte('created_at', `${today}T00:00:00`)
          .limit(1)

        if (existingAnalysis && existingAnalysis.length > 0) {
          results.push({
            vehicle_id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            status: 'skipped',
            error: 'Already analyzed today',
          })
          continue
        }

        // Call the pricing agent API
        const response = await fetch(`${baseUrl}/api/agents/pricing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vehicle_id: vehicle.id,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const result = await response.json()

        results.push({
          vehicle_id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          status: 'success',
          old_rate: vehicle.daily_rate,
          new_rate: result.suggested_rate,
          confidence: result.confidence,
        })

        // Small delay between vehicles to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (vehicleError) {
        results.push({
          vehicle_id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          status: 'error',
          error: vehicleError instanceof Error ? vehicleError.message : 'Unknown error',
        })
      }
    }

    // Log summary to agent_logs
    const successCount = results.filter(r => r.status === 'success').length
    const errorCount = results.filter(r => r.status === 'error').length
    const skippedCount = results.filter(r => r.status === 'skipped').length
    const autoUpdatedCount = results.filter(r => r.status === 'success' && r.confidence && r.confidence > 80).length

    await supabase.from('agent_logs').insert({
      agent_name: 'R&D Pricing Agent (Cron)',
      action_type: 'daily_pricing_optimization',
      input_data: {
        total_vehicles: vehicles.length,
        run_time: new Date().toISOString(),
      },
      output_data: {
        processed: successCount,
        errors: errorCount,
        skipped: skippedCount,
        auto_updated: autoUpdatedCount,
        results: results.map(r => ({
          vehicle_id: r.vehicle_id,
          status: r.status,
          rate_change: r.status === 'success' && r.old_rate && r.new_rate 
            ? r.new_rate - r.old_rate 
            : null,
        })),
      },
      model_used: 'claude-sonnet-4-6',
      status: errorCount === vehicles.length ? 'error' : 'success',
    })

    return NextResponse.json({
      success: true,
      summary: {
        total_vehicles: vehicles.length,
        processed: successCount,
        errors: errorCount,
        skipped: skippedCount,
        auto_updated: autoUpdatedCount,
      },
      results,
    })

  } catch (error) {
    console.error('Pricing optimizer cron error:', error)

    // Log error
    await supabase.from('agent_logs').insert({
      agent_name: 'R&D Pricing Agent (Cron)',
      action_type: 'daily_pricing_optimization',
      input_data: { trigger: 'cron_2am' },
      output_data: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      model_used: 'claude-sonnet-4-6',
      status: 'error',
    })

    return NextResponse.json(
      { error: 'Pricing optimization cron failed' },
      { status: 500 }
    )
  }
}
