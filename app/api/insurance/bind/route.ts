import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { roamly } from '@/integrations/roamly'

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
      quoteId,
      planId,
      planName,
      provider,
      premiumCents,
      deductibleCents,
      liabilityLimitCents,
      collision,
      comprehensive,
      roadsideAssistance,
      personalEffects,
      uninsuredMotorist,
      startDate,
      endDate,
    } = await request.json()

    if (!bookingId || !vehicleId || !planName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the booking belongs to this user
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, renter_id, start_date, end_date')
      .eq('id', bookingId)
      .eq('renter_id', user.id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 })
    }

    const policyNumber = `RD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    let roamlyPolicyId: string | null = null
    let roamlyBindResponse: Record<string, unknown> | null = null

    // Attempt to bind via Roamly if configured and this is a Roamly quote
    if (provider === 'roamly' && quoteId && planId && process.env.ROAMLY_API_KEY) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        const nameParts = (profile?.full_name ?? '').split(' ')
        const policy = await roamly.bindPolicy({
          quote_id: quoteId,
          plan_id: planId,
          booking_reference: bookingId,
          driver: {
            first_name: nameParts[0] ?? '',
            last_name: nameParts.slice(1).join(' ') || 'Guest',
            email: user.email ?? '',
          },
        })
        roamlyPolicyId = policy.policy_id
        roamlyBindResponse = policy as unknown as Record<string, unknown>
      } catch (roamlyErr) {
        console.error('[Roamly bind error]:', roamlyErr)
        // Fall through to internal policy — do not block the booking
      }
    }

    // Upsert into booking_insurance (our source of truth)
    const { data: insuranceRecord, error: insertError } = await supabase
      .from('booking_insurance')
      .upsert({
        booking_id: bookingId,
        user_id: user.id,
        vehicle_id: vehicleId,
        provider: roamlyPolicyId ? 'roamly' : 'rad_internal',
        coverage_type: planName,
        premium_cents: premiumCents,
        deductible_cents: deductibleCents,
        liability_limit_cents: liabilityLimitCents,
        collision_coverage: collision,
        comprehensive_coverage: comprehensive,
        roadside_assistance: roadsideAssistance,
        personal_effects: personalEffects,
        uninsured_motorist: uninsuredMotorist,
        policy_number: policyNumber,
        policy_status: 'active',
        roamly_quote_id: quoteId ?? null,
        roamly_policy_id: roamlyPolicyId,
        roamly_bind_response: roamlyBindResponse,
        coverage_start: startDate ?? booking.start_date,
        coverage_end: endDate ?? booking.end_date,
      }, { onConflict: 'booking_id' })
      .select()
      .single()

    if (insertError) throw insertError

    // Stamp the booking row for quick joins
    await supabase
      .from('bookings')
      .update({
        insurance_type: planName,
        insurance_premium_cents: premiumCents,
      })
      .eq('id', bookingId)

    return NextResponse.json({
      success: true,
      policy: {
        id: insuranceRecord.id,
        policyNumber,
        coverageType: planName,
        provider: insuranceRecord.provider,
        premiumCents,
        deductibleCents,
        roamlyPolicyId,
      },
    })
  } catch (error) {
    console.error('[Insurance Bind Error]:', error)
    return NextResponse.json({ error: 'Failed to bind insurance policy' }, { status: 500 })
  }
}
