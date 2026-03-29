import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Vercel Cron: 7am daily
// AI pricing recommendations based on market data

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Cron] pricing-agent: Starting daily pricing analysis...')
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    // Get active vehicles with their current rates
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select(`
        id, make, model, year, daily_rate, category,
        host_id, location_city,
        bookings:bookings(id, total_price, start_date, end_date)
      `)
      .eq('status', 'active')

    if (error) throw error

    const recommendations: Array<{
      vehicle_id: string
      current_rate: number
      suggested_rate: number
      reason: string
    }> = []

    for (const vehicle of vehicles || []) {
      // Calculate occupancy rate (last 30 days)
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const recentBookings = (vehicle.bookings || []).filter((b: { start_date: string }) => 
        new Date(b.start_date) >= thirtyDaysAgo
      )
      
      const bookedDays = recentBookings.reduce((sum: number, b: { start_date: string; end_date: string }) => {
        const start = new Date(b.start_date)
        const end = new Date(b.end_date)
        return sum + Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
      }, 0)
      
      const occupancyRate = bookedDays / 30

      // Simple pricing logic (in production, use ML model or Claude)
      let suggestedRate = vehicle.daily_rate
      let reason = 'No change recommended'

      if (occupancyRate > 0.8) {
        // High demand - increase price
        suggestedRate = Math.round(vehicle.daily_rate * 1.15)
        reason = `High occupancy (${Math.round(occupancyRate * 100)}%) - increase rate by 15%`
      } else if (occupancyRate < 0.3) {
        // Low demand - decrease price
        suggestedRate = Math.round(vehicle.daily_rate * 0.9)
        reason = `Low occupancy (${Math.round(occupancyRate * 100)}%) - decrease rate by 10%`
      } else if (occupancyRate >= 0.5 && occupancyRate <= 0.7) {
        reason = `Optimal occupancy (${Math.round(occupancyRate * 100)}%) - maintain current rate`
      }

      if (suggestedRate !== vehicle.daily_rate) {
        recommendations.push({
          vehicle_id: vehicle.id,
          current_rate: vehicle.daily_rate,
          suggested_rate: suggestedRate,
          reason,
        })

        // Create notification for host
        await supabase.from('notifications').insert({
          user_id: vehicle.host_id,
          type: 'pricing_recommendation',
          title: 'Pricing Recommendation',
          message: `${vehicle.year} ${vehicle.make} ${vehicle.model}: ${reason}. Suggested: $${suggestedRate}/day`,
          data: { vehicle_id: vehicle.id, suggested_rate: suggestedRate },
        })
      }
    }

    // Log cron run
    await supabase.from('cron_logs').insert({
      job_name: 'pricing-agent',
      status: 'success',
      duration_ms: Date.now() - startTime,
      details: { 
        vehicles_analyzed: vehicles?.length || 0,
        recommendations: recommendations.length,
      },
    })

    console.log(`[Cron] pricing-agent: Completed in ${Date.now() - startTime}ms - ${recommendations.length} recommendations`)

    return NextResponse.json({
      success: true,
      vehicles_analyzed: vehicles?.length || 0,
      recommendations,
      duration_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('[Cron] pricing-agent: Error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
