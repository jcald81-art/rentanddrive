import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { vehicleId, durationDays, startDate } = await request.json()

    if (!vehicleId || !durationDays) {
      return NextResponse.json(
        { error: 'vehicleId and durationDays are required' },
        { status: 400 }
      )
    }

    // Validate duration
    if (![30, 60, 90].includes(durationDays)) {
      return NextResponse.json(
        { error: 'Duration must be 30, 60, or 90 days' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get vehicle details
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select(`
        id,
        daily_rate,
        host_id,
        monthly_settings:host_monthly_settings(
          discount_30_day,
          discount_60_day,
          discount_90_day,
          mileage_limit,
          overage_rate
        )
      `)
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // Get discount rates - use host settings or defaults
    const monthlySettings = vehicle.monthly_settings?.[0] || {}
    const discountRates = {
      30: (monthlySettings.discount_30_day ?? 7) / 100,
      60: (monthlySettings.discount_60_day ?? 15) / 100,
      90: (monthlySettings.discount_90_day ?? 25) / 100,
    }

    const mileageLimit = monthlySettings.mileage_limit ?? 1500
    const overageRate = monthlySettings.overage_rate ?? 0.25

    // Calculate pricing
    const dailyRate = vehicle.daily_rate || 50
    const baseTotal = dailyRate * durationDays
    const discountRate = discountRates[durationDays as 30 | 60 | 90]
    const discountAmount = baseTotal * discountRate
    const totalPrice = baseTotal - discountAmount

    // Calculate monthly equivalent (for display)
    const monthsInDuration = durationDays / 30
    const monthlyRate = Math.round(totalPrice / monthsInDuration)

    // Calculate mileage allowance based on duration
    const mileageAllowance = mileageLimit * Math.ceil(durationDays / 30)

    // Platform fee (15%)
    const platformFee = totalPrice * 0.15
    const hostPayout = totalPrice - platformFee

    return NextResponse.json({
      vehicleId,
      durationDays,
      dailyRate,
      baseTotal: Math.round(baseTotal),
      discountPercent: Math.round(discountRate * 100),
      discountAmount: Math.round(discountAmount),
      totalPrice: Math.round(totalPrice),
      monthlyRate,
      mileageAllowance,
      overageRate,
      platformFee: Math.round(platformFee),
      hostPayout: Math.round(hostPayout),
      // For comparison display
      leaseComparison: Math.round(monthlyRate * 1.57), // 57% more expensive
    })
  } catch (error) {
    console.error('DriveMonthly pricing error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate pricing' },
      { status: 500 }
    )
  }
}
