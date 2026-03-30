import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      bookingId, 
      vehicleId, 
      coverageType, 
      premiumCents,
      startDate,
      endDate,
      deductibleCents,
    } = await request.json()

    if (!bookingId || !vehicleId || !coverageType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify booking belongs to user
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('renter_id', user.id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 })
    }

    // Generate policy number
    const policyNumber = `RD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Create insurance policy
    const { data: policy, error: policyError } = await supabase
      .from('insurance_policies')
      .insert({
        booking_id: bookingId,
        vehicle_id: vehicleId,
        user_id: user.id,
        policy_number: policyNumber,
        coverage_type: coverageType,
        premium_cents: premiumCents,
        deductible_cents: deductibleCents,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        liability_limit_cents: coverageType === 'basic' ? 10000000 : coverageType === 'standard' ? 30000000 : 50000000,
        collision_coverage: coverageType !== 'basic',
        comprehensive_coverage: coverageType === 'premium' || coverageType === 'full',
      })
      .select()
      .single()

    if (policyError) throw policyError

    // Update booking with insurance info
    await supabase
      .from('bookings')
      .update({
        insurance_policy_id: policy.id,
        insurance_type: coverageType,
        insurance_premium_cents: premiumCents,
      })
      .eq('id', bookingId)

    return NextResponse.json({
      success: true,
      policy: {
        id: policy.id,
        policyNumber,
        coverageType,
        premiumCents,
        deductibleCents,
        startDate,
        endDate,
      },
    })
  } catch (error) {
    console.error('[Insurance Bind Error]:', error)
    return NextResponse.json(
      { error: 'Failed to bind insurance policy' },
      { status: 500 }
    )
  }
}
