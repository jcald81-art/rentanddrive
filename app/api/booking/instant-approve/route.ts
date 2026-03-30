import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { bookingId, vehicleId, renterId } = await request.json()

    if (!bookingId || !vehicleId || !renterId) {
      return NextResponse.json(
        { error: 'bookingId, vehicleId, and renterId are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch renter's trust score
    const trustScoreRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/renter/trust-score?renterId=${renterId}`
    )
    const trustScoreData = await trustScoreRes.json()

    if (!trustScoreRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch trust score' }, { status: 500 })
    }

    const { score, breakdown } = trustScoreData

    // Fetch vehicle's instant book settings
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, host_id, instant_book_enabled, instant_book_threshold')
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Fetch host's default threshold if vehicle doesn't have override
    const { data: hostSettings } = await supabase
      .from('host_settings')
      .select('instant_book_threshold')
      .eq('host_id', vehicle.host_id)
      .single()

    const threshold = vehicle.instant_book_threshold || hostSettings?.instant_book_threshold || 50

    // Determine if auto-approval is possible
    const approved = vehicle.instant_book_enabled && score >= threshold

    if (approved) {
      // Auto-approve the booking
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          approved_at: new Date().toISOString(),
          approval_method: 'instant_book',
          trust_score_at_booking: score,
        })
        .eq('id', bookingId)

      if (updateError) {
        console.error('[Instant Approve] Update error:', updateError)
        return NextResponse.json({ error: 'Failed to approve booking' }, { status: 500 })
      }

      // Create notification for host
      await supabase.from('notifications').insert({
        user_id: vehicle.host_id,
        type: 'booking_auto_approved',
        title: 'Booking Auto-Approved',
        message: `A booking was automatically approved via Instant Book. Trust Score: ${score}`,
        data: { booking_id: bookingId, renter_id: renterId, trust_score: score },
      })

      // Create notification for renter
      await supabase.from('notifications').insert({
        user_id: renterId,
        type: 'booking_confirmed',
        title: 'Booking Confirmed!',
        message: 'Your booking has been confirmed. You can now view your trip details.',
        data: { booking_id: bookingId },
      })

      return NextResponse.json({
        approved: true,
        reason: 'Trust score meets Instant Book threshold',
        score,
        threshold,
        breakdown,
        bookingStatus: 'confirmed',
      })
    } else {
      // Set to pending for manual host approval
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'pending_host_approval',
          trust_score_at_booking: score,
        })
        .eq('id', bookingId)

      if (updateError) {
        console.error('[Instant Approve] Update error:', updateError)
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
      }

      // Notify host about pending approval
      await supabase.from('notifications').insert({
        user_id: vehicle.host_id,
        type: 'booking_pending_approval',
        title: 'New Booking Request',
        message: `A renter wants to book your vehicle. Trust Score: ${score}. Please review and approve.`,
        data: { booking_id: bookingId, renter_id: renterId, trust_score: score },
      })

      const reason = !vehicle.instant_book_enabled
        ? 'Instant Book is not enabled for this vehicle'
        : `Trust score ${score} is below threshold ${threshold}`

      return NextResponse.json({
        approved: false,
        reason,
        score,
        threshold,
        breakdown,
        bookingStatus: 'pending_host_approval',
      })
    }
  } catch (error) {
    console.error('[Instant Approve API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
