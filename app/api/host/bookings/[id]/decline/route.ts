import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

// POST /api/host/bookings/[id]/decline - Decline a pending booking
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

  // Get booking and verify host ownership
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (booking.host_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (booking.status !== 'pending') {
    return NextResponse.json({ error: 'Booking is not pending' }, { status: 400 })
  }

  // Cancel the payment intent if exists
  if (booking.payment_intent_id) {
    try {
      await stripe.paymentIntents.cancel(booking.payment_intent_id)
    } catch (stripeError) {
      console.error('Failed to cancel payment intent:', stripeError)
    }
  }

  // Cancel deposit auth if exists
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
      cancellation_reason: 'host_declined',
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to decline booking' }, { status: 500 })
  }

  // Notify renter
  await supabase.from('notifications').insert({
    user_id: booking.renter_id,
    type: 'booking_declined',
    title: 'Booking Declined',
    message: 'Unfortunately, the host was unable to accept your booking. Please try another vehicle.',
    data: { booking_id: id },
  })

  return NextResponse.json({ success: true })
}
