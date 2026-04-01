import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface PricingInsight {
  recommendation: 'good_deal' | 'fair_price' | 'premium_rate'
  message: string
  demandLevel: 'low' | 'medium' | 'high'
  suggestedAction?: string
}

export async function POST(request: NextRequest) {
  try {
    const { vehicleId, dailyRate, startDate, endDate } = await request.json()

    if (!vehicleId || !dailyRate || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const start = new Date(startDate)
    const end = new Date(endDate)

    // Check if dates include weekend or holiday
    const isWeekend = [0, 6].includes(start.getDay()) || [0, 6].includes(end.getDay())
    const isHolidayPeriod = checkHolidayPeriod(start, end)

    // Fetch vehicle category and market data
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('category, make, model, year')
      .eq('id', vehicleId)
      .single()

    // Fetch comparable vehicles in the same area
    const { data: comparableVehicles } = await supabase
      .from('vehicles')
      .select('daily_rate')
      .eq('category', vehicle?.category || 'sedan')
      .eq('is_active', true)
      .eq('is_approved', true)

    // Calculate market average
    const avgRate = comparableVehicles && comparableVehicles.length > 0
      ? comparableVehicles.reduce((sum, v) => sum + (v.daily_rate || 0), 0) / comparableVehicles.length
      : dailyRate

    // Count bookings in the date range (demand indicator)
    const { count: bookingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('start_date', startDate)
      .lte('start_date', endDate)

    // Determine demand level
    let demandLevel: 'low' | 'medium' | 'high' = 'medium'
    if (isHolidayPeriod || (isWeekend && (bookingCount || 0) > 5)) {
      demandLevel = 'high'
    } else if ((bookingCount || 0) < 2) {
      demandLevel = 'low'
    }

    // Calculate recommendation
    const rateRatio = dailyRate / avgRate
    let insight: PricingInsight

    if (rateRatio < 0.85) {
      // Rate is below market
      insight = {
        recommendation: 'good_deal',
        message: `This ${vehicle?.year} ${vehicle?.make} ${vehicle?.model} is priced ${Math.round((1 - rateRatio) * 100)}% below similar vehicles in the area.`,
        demandLevel,
        suggestedAction: demandLevel === 'high' 
          ? 'Great price! Book now before it\'s gone.'
          : 'Excellent value — lock in this rate.',
      }
    } else if (rateRatio <= 1.15) {
      // Rate is around market average
      insight = {
        recommendation: 'fair_price',
        message: `This rate is in line with market prices for ${vehicle?.category || 'similar'} vehicles in the Reno-Tahoe area.`,
        demandLevel,
        suggestedAction: demandLevel === 'high'
          ? 'Fair price for a high-demand period.'
          : undefined,
      }
    } else {
      // Rate is above market
      insight = {
        recommendation: 'premium_rate',
        message: `Premium vehicle priced ${Math.round((rateRatio - 1) * 100)}% above average for this category.`,
        demandLevel,
        suggestedAction: demandLevel === 'high'
          ? 'Premium pricing reflects high demand — still a quality choice.'
          : 'Consider comparing with similar vehicles.',
      }
    }

    // Add demand-specific messaging
    if (demandLevel === 'high') {
      insight.message += isHolidayPeriod
        ? ' High demand expected during this holiday period.'
        : isWeekend
        ? ' Weekends see higher booking activity.'
        : ' This time period has elevated demand.'
    }

    return NextResponse.json(insight)
  } catch (error) {
    console.error('RAD pricing insight error:', error)
    // Return a default insight on error
    return NextResponse.json({
      recommendation: 'fair_price',
      message: 'RAD recommends this rate based on current market conditions.',
      demandLevel: 'medium',
    })
  }
}

function checkHolidayPeriod(start: Date, end: Date): boolean {
  // Major US holidays and peak travel periods
  const holidays = [
    { month: 0, days: [1, 2, 15, 16, 17] }, // New Year, MLK
    { month: 1, days: [14, 15, 16, 17, 18, 19, 20] }, // Presidents Day
    { month: 4, days: [24, 25, 26, 27, 28, 29, 30, 31] }, // Memorial Day
    { month: 6, days: [1, 2, 3, 4, 5, 6, 7] }, // July 4th
    { month: 8, days: [1, 2, 3, 4, 5, 6, 7] }, // Labor Day
    { month: 10, days: [22, 23, 24, 25, 26, 27, 28] }, // Thanksgiving
    { month: 11, days: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31] }, // Christmas/New Year
  ]

  const current = new Date(start)
  while (current <= end) {
    const month = current.getMonth()
    const day = current.getDate()
    
    for (const holiday of holidays) {
      if (holiday.month === month && holiday.days.includes(day)) {
        return true
      }
    }
    current.setDate(current.getDate() + 1)
  }

  return false
}
