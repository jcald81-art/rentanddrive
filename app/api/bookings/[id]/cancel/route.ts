import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

// POST /api/bookings/[id]/cancel - Cancel a booking
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get booking details
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .eq('renter_id', user.id)
    .single()

  if (fetchError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Check if booking can be cancelled
  if (!['pending', 'confirmed'].includes(booking.status)) {
    return NextResponse.json({ error: 'Booking cannot be cancelled' }, { status: 400 })
  }

  // Check 48-hour policy
  const hoursUntilStart = (new Date(booking.start_date).getTime() - Date.now()) / (1000 * 60 * 60)
  if (hoursUntilStart < 48) {
    return NextResponse.json({ 
      error: 'Bookings can only be cancelled 48+ hours before start date' 
    }, { status: 400 })
  }

  // Process refund if payment was made
  if (booking.payment_intent_id) {
    try {
      await stripe.refunds.create({
        payment_intent: booking.payment_intent_id,
        reason: 'requested_by_customer',
      })
    } catch (refundError) {
      console.error('Failed to process refund:', refundError)
      return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 })
    }
  }

  // Cancel security deposit auth if exists
  if (booking.deposit_intent_id) {
    try {
      await stripe.paymentIntents.cancel(booking.deposit_intent_id)
    } catch (depositError) {
      console.error('Failed to cancel deposit auth:', depositError)
    }
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'renter_requested',
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
  }

  // Notify host
  await supabase.from('notifications').insert({
    user_id: booking.host_id,
    type: 'booking_cancelled',
    title: 'Booking Cancelled',
    message: 'A booking for your vehicle has been cancelled by the renter.',
    data: { booking_id: id },
  })

  return NextResponse.json({ success: true })
}
