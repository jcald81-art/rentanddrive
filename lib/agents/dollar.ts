import { routeAIRequest } from '@/lib/ai-router'
import { createClient } from '@/lib/supabase/server'

const AGENT_NAME = 'Dollar'

interface PricingRecommendation {
  vehicleId: string
  currentRate: number
  suggestedRate: number
  confidence: number // 0-100
  reason: string
  seasonFactor: number
  competitorAvg: number | null
  demandScore: number
  occupancyRate: number
}

interface PricingResult {
  recommendations: PricingRecommendation[]
  autoApplied: number
  totalVehicles: number
}

// Get competitor data from snapshots
async function getCompetitorData(make: string, model: string, year: number): Promise<{
  avgRate: number | null
  minRate: number | null
  maxRate: number | null
  listingCount: number
}> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('competitor_snapshots')
    .select('avg_daily_rate, vehicle_count')
    .eq('vehicle_make', make)
    .eq('vehicle_model', model)
    .gte('vehicle_year', year - 1)
    .lte('vehicle_year', year + 1)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return { avgRate: null, minRate: null, maxRate: null, listingCount: 0 }

  return {
    avgRate: data.avg_daily_rate,
    minRate: data.avg_daily_rate * 0.8,
    maxRate: data.avg_daily_rate * 1.3,
    listingCount: data.vehicle_count || 0,
  }
}

// Calculate vehicle occupancy rate
async function getOccupancyRate(vehicleId: string, days: number = 30): Promise<number> {
  const supabase = await createClient()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: bookings } = await supabase
    .from('bookings')
    .select('start_date, end_date')
    .eq('vehicle_id', vehicleId)
    .gte('start_date', startDate.toISOString())
    .in('status', ['completed', 'active', 'confirmed'])

  if (!bookings || bookings.length === 0) return 0

  let bookedDays = 0
  for (const booking of bookings) {
    const start = new Date(booking.start_date)
    const end = new Date(booking.end_date)
    bookedDays += Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  return Math.min(100, Math.round((bookedDays / days) * 100))
}

// Get seasonal factor for Reno/Tahoe market
function getSeasonalFactor(): { factor: number; season: string } {
  const month = new Date().getMonth() + 1 // 1-12
  
  // Reno/Tahoe seasonal patterns
  if (month >= 12 || month <= 3) {
    return { factor: 1.35, season: 'ski_season' } // Ski season premium
  } else if (month >= 6 && month <= 8) {
    return { factor: 1.25, season: 'summer' } // Summer tourism
  } else if (month === 9 || month === 10) {
    return { factor: 1.15, season: 'fall_events' } // Hot August Nights, Rib Cook-off
  } else {
    return { factor: 1.0, season: 'off_peak' }
  }
}

// Get upcoming events that affect demand
async function getUpcomingEvents(): Promise<Array<{ name: string; date: string; demandMultiplier: number }>> {
  const supabase = await createClient()
  const now = new Date()
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const { data } = await supabase
    .from('competitor_snapshots')
    .select('upcoming_events')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data?.upcoming_events) return []
  
  return (data.upcoming_events as any[]).filter(e => {
    const eventDate = new Date(e.date)
    return eventDate >= now && eventDate <= twoWeeks
  })
}

// Analyze pricing with AI
async function analyzePricing(
  vehicle: {
    id: string
    make: string
    model: string
    year: number
    dailyRate: number
    isAwd: boolean
    category: string
  },
  context: {
    occupancy: number
    competitorAvg: number | null
    seasonFactor: number
    season: string
    upcomingEvents: Array<{ name: string; demandMultiplier: number }>
  }
): Promise<{ suggestedRate: number; confidence: number; reason: string }> {
  const systemPrompt = `You are Dollar, the pricing AI for Rent and Drive car rental in Reno/Tahoe, Nevada.
Analyze vehicle pricing considering:
1. Current occupancy rate (higher occupancy = can raise prices)
2. Competitor rates on Turo (aim to be 10% lower for competitive advantage)
3. Seasonal demand (ski season Dec-Mar, summer Jun-Aug)
4. Upcoming local events
5. Vehicle features (AWD commands premium in winter)

Return JSON only: {"suggestedRate": number, "confidence": 0-100, "reason": "brief explanation"}`

  const prompt = `Analyze pricing for:
Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.category})
Current daily rate: $${vehicle.dailyRate}
AWD: ${vehicle.isAwd ? 'Yes' : 'No'}

Market data:
- 30-day occupancy: ${context.occupancy}%
- Competitor avg rate: ${context.competitorAvg ? `$${context.competitorAvg}` : 'Unknown'}
- Season: ${context.season} (factor: ${context.seasonFactor}x)
- Upcoming events: ${context.upcomingEvents.length > 0 ? context.upcomingEvents.map(e => e.name).join(', ') : 'None'}

What should the daily rate be?`

  const result = await routeAIRequest({
    taskType: 'pricing',
    agentName: AGENT_NAME,
    actionType: 'analyze_pricing',
    system: systemPrompt,
    prompt,
    maxTokens: 256,
    enableCrossValidation: true, // Cross-validate significant changes
  })

  try {
    const parsed = JSON.parse(result.text.replace(/```json\n?|\n?```/g, ''))
    return {
      suggestedRate: Math.round(parsed.suggestedRate),
      confidence: Math.min(100, Math.max(0, parsed.confidence)),
      reason: parsed.reason || 'AI analysis',
    }
  } catch {
    // Fallback to rule-based if AI fails
    let suggestedRate = vehicle.dailyRate
    
    if (context.competitorAvg) {
      suggestedRate = context.competitorAvg * 0.9 // 10% below Turo
    }
    
    suggestedRate *= context.seasonFactor
    
    if (context.occupancy > 80) suggestedRate *= 1.1
    else if (context.occupancy < 30) suggestedRate *= 0.9
    
    return {
      suggestedRate: Math.round(suggestedRate),
      confidence: 60,
      reason: 'Rule-based fallback',
    }
  }
}

// Main pricing function (called by cron)
export async function analyzeAllVehiclePricing(): Promise<PricingResult> {
  const supabase = await createClient()
  const recommendations: PricingRecommendation[] = []
  let autoApplied = 0

  // Get all active vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, make, model, year, daily_rate, is_awd, category, host_id')
    .eq('status', 'active')
    .eq('is_approved', true)

  if (!vehicles) return { recommendations: [], autoApplied: 0, totalVehicles: 0 }

  const { factor: seasonFactor, season } = getSeasonalFactor()
  const upcomingEvents = await getUpcomingEvents()

  for (const vehicle of vehicles) {
    const occupancy = await getOccupancyRate(vehicle.id)
    const competitor = await getCompetitorData(vehicle.make, vehicle.model, vehicle.year)

    const analysis = await analyzePricing(
      {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        dailyRate: vehicle.daily_rate,
        isAwd: vehicle.is_awd || false,
        category: vehicle.category || 'car',
      },
      {
        occupancy,
        competitorAvg: competitor.avgRate,
        seasonFactor,
        season,
        upcomingEvents,
      }
    )

    const recommendation: PricingRecommendation = {
      vehicleId: vehicle.id,
      currentRate: vehicle.daily_rate,
      suggestedRate: analysis.suggestedRate,
      confidence: analysis.confidence,
      reason: analysis.reason,
      seasonFactor,
      competitorAvg: competitor.avgRate,
      demandScore: Math.round((occupancy + (upcomingEvents.length * 10)) / 2),
      occupancyRate: occupancy,
    }

    recommendations.push(recommendation)

    // Auto-apply if confidence > 80 and change is within 20%
    const changePercent = Math.abs(analysis.suggestedRate - vehicle.daily_rate) / vehicle.daily_rate * 100
    
    if (analysis.confidence >= 80 && changePercent <= 20) {
      await supabase
        .from('vehicles')
        .update({ daily_rate: analysis.suggestedRate })
        .eq('id', vehicle.id)

      // Log to pricing_history
      await supabase.from('pricing_history').insert({
        vehicle_id: vehicle.id,
        old_rate: vehicle.daily_rate,
        new_rate: analysis.suggestedRate,
        change_reason: analysis.reason,
        triggered_by: 'dollar_agent',
        confidence: analysis.confidence,
        season_factor: seasonFactor,
        competitor_avg: competitor.avgRate,
        occupancy_rate: occupancy,
      })

      autoApplied++
    } else if (changePercent > 20) {
      // High-impact change - needs cross-validation and host notification
      await supabase.from('notifications').insert({
        user_id: vehicle.host_id,
        type: 'pricing_suggestion',
        title: 'Pricing Recommendation',
        message: `Dollar suggests changing ${vehicle.year} ${vehicle.make} ${vehicle.model} from $${vehicle.daily_rate}/day to $${analysis.suggestedRate}/day. Reason: ${analysis.reason}`,
        data: { vehicleId: vehicle.id, recommendation },
      })
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 100))
  }

  return {
    recommendations,
    autoApplied,
    totalVehicles: vehicles.length,
  }
}

// Get pricing recommendation for single vehicle
export async function getVehiclePricingRecommendation(vehicleId: string): Promise<PricingRecommendation | null> {
  const supabase = await createClient()

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, make, model, year, daily_rate, is_awd, category')
    .eq('id', vehicleId)
    .single()

  if (!vehicle) return null

  const occupancy = await getOccupancyRate(vehicleId)
  const competitor = await getCompetitorData(vehicle.make, vehicle.model, vehicle.year)
  const { factor: seasonFactor, season } = getSeasonalFactor()
  const upcomingEvents = await getUpcomingEvents()

  const analysis = await analyzePricing(
    {
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      dailyRate: vehicle.daily_rate,
      isAwd: vehicle.is_awd || false,
      category: vehicle.category || 'car',
    },
    {
      occupancy,
      competitorAvg: competitor.avgRate,
      seasonFactor,
      season,
      upcomingEvents,
    }
  )

  return {
    vehicleId: vehicle.id,
    currentRate: vehicle.daily_rate,
    suggestedRate: analysis.suggestedRate,
    confidence: analysis.confidence,
    reason: analysis.reason,
    seasonFactor,
    competitorAvg: competitor.avgRate,
    demandScore: Math.round((occupancy + (upcomingEvents.length * 10)) / 2),
    occupancyRate: occupancy,
  }
}
