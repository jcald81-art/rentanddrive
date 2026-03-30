import { NextRequest, NextResponse } from 'next/server'

// Stub data generators for demand signals
function getLocalEvents(location: { lat: number; lng: number }, targetDate: string) {
  const events = [
    { name: 'NASCAR Cup Series', distance: 15, demandMultiplier: 1.25, type: 'sports' },
    { name: 'Reno Air Races', distance: 8, demandMultiplier: 1.20, type: 'event' },
    { name: 'Hot August Nights', distance: 5, demandMultiplier: 1.30, type: 'festival' },
    { name: 'Lake Tahoe Marathon', distance: 25, demandMultiplier: 1.15, type: 'sports' },
  ]
  // Randomly return 0-2 events as "happening"
  const activeCount = Math.floor(Math.random() * 3)
  return events.slice(0, activeCount)
}

function getWeatherForecast(location: { lat: number; lng: number }, targetDate: string) {
  const conditions = ['sunny', 'partly_cloudy', 'cloudy', 'rain', 'snow']
  const condition = conditions[Math.floor(Math.random() * 3)] // Bias toward good weather
  const isWeekend = [0, 6].includes(new Date(targetDate).getDay())
  
  return {
    condition,
    tempHigh: 65 + Math.floor(Math.random() * 20),
    tempLow: 45 + Math.floor(Math.random() * 15),
    isWeekend,
    demandMultiplier: condition === 'sunny' && isWeekend ? 1.15 : condition === 'sunny' ? 1.08 : 1.0
  }
}

function getCompetitorRates(location: { lat: number; lng: number }, vehicleType: string) {
  // Simulate 3-5 competitor vehicles
  const count = 3 + Math.floor(Math.random() * 3)
  const baseRate = 75 + Math.floor(Math.random() * 40)
  
  return {
    count,
    avgRate: baseRate,
    minRate: baseRate - 15,
    maxRate: baseRate + 25,
    adjustment: Math.random() > 0.5 ? -0.10 : 0.10 // ±10%
  }
}

function getBookingVelocity(vehicleId: string) {
  // Simulate search/booking velocity
  const velocity = Math.random()
  if (velocity > 0.8) return { level: 'very_high', multiplier: 1.20 }
  if (velocity > 0.6) return { level: 'high', multiplier: 1.12 }
  if (velocity > 0.4) return { level: 'moderate', multiplier: 1.05 }
  return { level: 'low', multiplier: 1.0 }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicleId, targetDate, floorPrice, ceilingPrice, location, baseRate = 85 } = body

    if (!vehicleId || !floorPrice || !ceilingPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Gather all demand signals
    const events = getLocalEvents(location, targetDate)
    const weather = getWeatherForecast(location, targetDate)
    const competition = getCompetitorRates(location, 'suv')
    const velocity = getBookingVelocity(vehicleId)

    // Calculate adjustments
    let adjustedRate = baseRate
    const signals: any[] = []
    const adjustments: any[] = []

    // Event multiplier
    if (events.length > 0) {
      const topEvent = events[0]
      const eventAdjustment = (topEvent.demandMultiplier - 1) * 100
      adjustedRate *= topEvent.demandMultiplier
      signals.push({
        type: 'event',
        name: topEvent.name,
        impact: `+${eventAdjustment.toFixed(0)}%`,
        description: `${topEvent.name} within ${topEvent.distance} miles`
      })
      adjustments.push({ type: 'event', amount: eventAdjustment })
    }

    // Weather multiplier
    if (weather.demandMultiplier > 1) {
      const weatherAdjustment = (weather.demandMultiplier - 1) * 100
      adjustedRate *= weather.demandMultiplier
      signals.push({
        type: 'weather',
        name: weather.condition,
        impact: `+${weatherAdjustment.toFixed(0)}%`,
        description: `${weather.condition.replace('_', ' ')} forecast${weather.isWeekend ? ' on weekend' : ''}`
      })
      adjustments.push({ type: 'weather', amount: weatherAdjustment })
    }

    // Competition adjustment
    const competitionDiff = competition.avgRate - adjustedRate
    if (competitionDiff > 10) {
      // We're priced lower, can increase
      const compAdjustment = Math.min(competitionDiff * 0.5, 15)
      adjustedRate += compAdjustment
      signals.push({
        type: 'competition',
        name: `${competition.count} competitors`,
        impact: `+$${compAdjustment.toFixed(0)}`,
        description: `Avg competitor rate: $${competition.avgRate}/day`
      })
      adjustments.push({ type: 'competition', amount: (compAdjustment / baseRate) * 100 })
    }

    // Velocity multiplier
    if (velocity.multiplier > 1) {
      const velocityAdjustment = (velocity.multiplier - 1) * 100
      adjustedRate *= velocity.multiplier
      signals.push({
        type: 'velocity',
        name: velocity.level,
        impact: `+${velocityAdjustment.toFixed(0)}%`,
        description: `${velocity.level.replace('_', ' ')} booking demand`
      })
      adjustments.push({ type: 'velocity', amount: velocityAdjustment })
    }

    // Clamp to floor and ceiling
    const recommendedRate = Math.round(Math.min(Math.max(adjustedRate, floorPrice), ceilingPrice))
    
    // Generate reason string
    const reasons = signals.map(s => s.name).join(', ')
    const totalAdjustment = ((recommendedRate - baseRate) / baseRate) * 100

    return NextResponse.json({
      recommendedRate,
      currentRate: baseRate,
      floorPrice,
      ceilingPrice,
      signals,
      adjustment: totalAdjustment,
      reason: reasons || 'Base rate maintained',
      breakdown: {
        baseRate,
        adjustments,
        finalRate: recommendedRate
      }
    })
  } catch (error) {
    console.error('SmartRate calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate rate' },
      { status: 500 }
    )
  }
}
