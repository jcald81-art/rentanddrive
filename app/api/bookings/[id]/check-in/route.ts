import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params
    const { code } = await request.json()

    const supabase = await createClient()

    // Fetch booking and verify code
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, booking_number, status, start_date, renter_id')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify booking code
    if (booking.booking_number !== code) {
      return NextResponse.json(
        { error: 'Invalid check-in code' },
        { status: 400 }
      )
    }

    // Check if booking is in valid state for check-in
    if (!['confirmed', 'pending_pickup'].includes(booking.status)) {
      return NextResponse.json(
        { error: `Cannot check in: booking is ${booking.status}` },
        { status: 400 }
      )
    }

    // Check if it's within check-in window (same day or day before start)
    const startDate = new Date(booking.start_date)
    const now = new Date()
    const daysBefore = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysBefore > 1) {
      return NextResponse.json(
        { error: 'Check-in is only available within 24 hours of your trip start' },
        { status: 400 }
      )
    }

    // Update booking status to active/checked_in
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'active',
        checked_in_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Check-in update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to complete check-in' },
        { status: 500 }
      )
    }

    // Log the check-in event
    await supabase.from('booking_events').insert({
      booking_id: bookingId,
      event_type: 'checked_in',
      event_data: {
        checked_in_at: new Date().toISOString(),
        method: 'mobile_qr',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Check-in complete',
    })
  } catch (error) {
    console.error('Check-in API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
