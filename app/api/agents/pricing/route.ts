import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

const PRICING_SYSTEM_PROMPT = `You are the pricing agent for Rent and Drive LLC. Analyze occupancy, competitor rates, and seasonal demand for Reno/Lake Tahoe Nevada. Ski season peaks Nov-Mar, summer peaks Jun-Aug. Suggest a daily rate with confidence score 0-100 and explain your reasoning in under 50 words. Return JSON only: {suggested_rate, confidence, reason, season_factor}.`

interface PricingRequest {
  vehicle_id: string
  date_range?: {
    start: string
    end: string
  }
}

interface PricingResult {
  suggested_rate: number
  confidence: number
  reason: string
  season_factor: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body: PricingRequest = await request.json()
    const { vehicle_id, date_range } = body

    if (!vehicle_id) {
      return NextResponse.json(
        { error: 'vehicle_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Fetch current vehicle data
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicle_id)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // 2. Fetch booking history for this vehicle (last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: bookingHistory, error: bookingError } = await supabase
      .from('bookings')
      .select('id, start_date, end_date, total_price, status')
      .eq('vehicle_id', vehicle_id)
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    // 3. Calculate occupancy rate (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const today = new Date()

    const recentBookings = bookingHistory?.filter(b => 
      new Date(b.start_date) >= thirtyDaysAgo && 
      (b.status === 'confirmed' || b.status === 'completed')
    ) || []

    let bookedDays = 0
    recentBookings.forEach(booking => {
      const start = new Date(booking.start_date)
      const end = new Date(booking.end_date)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      bookedDays += days
    })

    const occupancyRate = Math.min(100, Math.round((bookedDays / 30) * 100))

    // 4. Fetch competitor data
    const { data: competitors } = await supabase
      .from('competitor_snapshots')
      .select('*')
      .ilike('vehicle_make', `%${vehicle.make}%`)
      .order('captured_at', { ascending: false })
      .limit(20)

    // Calculate average competitor rate
    const competitorRates = competitors?.map(c => c.daily_rate).filter(r => r > 0) || []
    const avgCompetitorRate = competitorRates.length > 0
      ? Math.round(competitorRates.reduce((a, b) => a + b, 0) / competitorRates.length)
      : null

    // 5. Determine current season
    const currentMonth = new Date().getMonth() + 1
    let season = 'shoulder'
    if (currentMonth >= 11 || currentMonth <= 3) {
      season = 'ski_season'
    } else if (currentMonth >= 6 && currentMonth <= 8) {
      season = 'summer_peak'
    }

    // 6. Build context for Claude
    const pricingContext = {
      vehicle: {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        category: vehicle.category,
        current_rate: vehicle.daily_rate,
        is_awd: vehicle.is_awd,
        has_ski_rack: vehicle.has_ski_rack,
        rating: vehicle.rating,
        trip_count: vehicle.trip_count,
      },
      performance: {
        occupancy_rate_30_days: occupancyRate,
        total_bookings_90_days: bookingHistory?.length || 0,
        booked_days_30_days: bookedDays,
      },
      market: {
        avg_competitor_rate: avgCompetitorRate,
        competitor_count: competitorRates.length,
        competitor_rates: competitorRates.slice(0, 5),
      },
      timing: {
        current_season: season,
        current_month: currentMonth,
        analysis_date: new Date().toISOString().split('T')[0],
        date_range: date_range || null,
      },
    }

    // 7. Call Claude for pricing recommendation
    const { text: responseText, usage } = await generateText({
      model: 'anthropic/claude-sonnet-4-6',
      system: PRICING_SYSTEM_PROMPT,
      prompt: `Analyze this vehicle and recommend optimal daily rate:\n\n${JSON.stringify(pricingContext, null, 2)}`,
    })

    // 8. Parse Claude's response
    let pricingResult: PricingResult
    try {
      // Extract JSON from response (Claude might wrap it in markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      pricingResult = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText)
      return NextResponse.json(
        { error: 'Failed to parse pricing recommendation' },
        { status: 500 }
      )
    }

    // 9. Save to pricing_history
    const { data: pricingRecord, error: historyError } = await supabase
      .from('pricing_history')
      .insert({
        vehicle_id,
        suggested_rate: pricingResult.suggested_rate,
        current_rate: vehicle.daily_rate,
        reason: pricingResult.reason,
        market_data: {
          ...pricingContext,
          season_factor: pricingResult.season_factor,
        },
        agent_confidence: pricingResult.confidence,
      })
      .select()
      .single()

    // 10. Auto-update if confidence > 80
    let autoUpdated = false
    if (pricingResult.confidence > 80) {
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ 
          daily_rate: pricingResult.suggested_rate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vehicle_id)

      if (!updateError) {
        autoUpdated = true
      }
    }

    // 11. Log to agent_logs
    const processingTime = Date.now() - startTime
    const estimatedCost = usage ? Math.round((usage.promptTokens * 0.003 + usage.completionTokens * 0.015) * 100) : 0

    await supabase.from('agent_logs').insert({
      agent_name: 'R&D Pricing Agent',
      action_type: 'pricing_analysis',
      input_data: {
        vehicle_id,
        date_range,
        context: pricingContext,
      },
      output_data: {
        ...pricingResult,
        auto_updated: autoUpdated,
        pricing_history_id: pricingRecord?.id,
      },
      model_used: 'claude-sonnet-4-6',
      tokens_used: usage ? usage.promptTokens + usage.completionTokens : null,
      cost_cents: estimatedCost,
      status: 'success',
    })

    return NextResponse.json({
      success: true,
      vehicle_id,
      current_rate: vehicle.daily_rate,
      suggested_rate: pricingResult.suggested_rate,
      confidence: pricingResult.confidence,
      reason: pricingResult.reason,
      season_factor: pricingResult.season_factor,
      auto_updated: autoUpdated,
      market_context: {
        occupancy_rate: occupancyRate,
        avg_competitor_rate: avgCompetitorRate,
        season,
      },
      processing_time_ms: processingTime,
    })

  } catch (error) {
    console.error('Pricing agent error:', error)

    // Log error to agent_logs
    const supabase = await createClient()
    await supabase.from('agent_logs').insert({
      agent_name: 'R&D Pricing Agent',
      action_type: 'pricing_analysis',
      input_data: { error: 'See output_data' },
      output_data: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null,
      },
      model_used: 'claude-sonnet-4-6',
      status: 'error',
    })

    return NextResponse.json(
      { error: 'Pricing analysis failed' },
      { status: 500 }
    )
  }
}

// GET endpoint to check pricing history for a vehicle
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const vehicleId = searchParams.get('vehicle_id')

  if (!vehicleId) {
    return NextResponse.json(
      { error: 'vehicle_id query param required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data: history, error } = await supabase
    .from('pricing_history')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ vehicle_id: vehicleId, history })
}
