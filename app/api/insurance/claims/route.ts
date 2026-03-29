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
      policyId,
      claimType,
      description,
      incidentDate,
      incidentLocation,
      estimatedDamageCents,
      photoUrls,
    } = await request.json()

    if (!bookingId || !claimType || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get booking and policy
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, insurance_policies(*)')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify user is involved in booking
    if (booking.renter_id !== user.id && booking.host_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Generate claim number
    const claimNumber = `CLM-${Date.now().toString(36).toUpperCase()}`

    // Create claim
    const { data: claim, error: claimError } = await supabase
      .from('insurance_claims')
      .insert({
        booking_id: bookingId,
        policy_id: policyId || booking.insurance_policy_id,
        claim_number: claimNumber,
        claimant_id: user.id,
        claim_type: claimType,
        description,
        incident_date: incidentDate || new Date().toISOString(),
        incident_location: incidentLocation,
        estimated_damage_cents: estimatedDamageCents,
        status: 'submitted',
      })
      .select()
      .single()

    if (claimError) throw claimError

    // Add photos if provided
    if (photoUrls && photoUrls.length > 0) {
      await supabase.from('insurance_claim_photos').insert(
        photoUrls.map((url: string, index: number) => ({
          claim_id: claim.id,
          photo_url: url,
          photo_type: 'damage',
          order_index: index,
        }))
      )
    }

    // Notify admin
    await supabase.from('notifications').insert({
      user_id: null, // System notification
      type: 'insurance_claim',
      title: `New Insurance Claim: ${claimNumber}`,
      message: `${claimType} claim submitted for booking ${bookingId.slice(0, 8)}`,
      data: { claim_id: claim.id, booking_id: bookingId },
      priority: 'high',
    })

    return NextResponse.json({
      success: true,
      claim: {
        id: claim.id,
        claimNumber,
        status: 'submitted',
      },
    })
  } catch (error) {
    console.error('[Insurance Claims Error]:', error)
    return NextResponse.json(
      { error: 'Failed to submit claim' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const claimId = searchParams.get('claimId')

    if (claimId) {
      const { data: claim } = await supabase
        .from('insurance_claims')
        .select(`
          *,
          insurance_claim_photos(*),
          bookings(*, vehicles(make, model, year)),
          insurance_policies(*)
        `)
        .eq('id', claimId)
        .single()

      if (!claim) {
        return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
      }

      // Verify access
      if (claim.claimant_id !== user.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role !== 'admin') {
          return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
        }
      }

      return NextResponse.json({ claim })
    }

    // Get user's claims
    const { data: claims } = await supabase
      .from('insurance_claims')
      .select(`
        *,
        bookings(vehicles(make, model, year))
      `)
      .eq('claimant_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ claims })
  } catch (error) {
    console.error('[Insurance Claims GET Error]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    )
  }
}
