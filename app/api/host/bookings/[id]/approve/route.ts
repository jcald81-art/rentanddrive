import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

// POST /api/host/bookings/[id]/approve - Approve a pending booking
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
    .select('*, vehicle:vehicles(owner_id)')
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

  // Capture the payment if there's a payment intent
  if (booking.payment_intent_id) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(booking.payment_intent_id)
      if (paymentIntent.status === 'requires_capture') {
        await stripe.paymentIntents.capture(booking.payment_intent_id)
      }
    } catch (stripeError) {
      console.error('Failed to capture payment:', stripeError)
      return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
    }
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to approve booking' }, { status: 500 })
  }

  // Notify renter
  await supabase.from('notifications').insert({
    user_id: booking.renter_id,
    type: 'booking_approved',
    title: 'Booking Approved!',
    message: 'Your booking has been approved by the host.',
    data: { booking_id: id },
  })

  // Trigger confirmation SMS
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agents/communications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: id,
        trigger_event: 'booking_confirmed',
      }),
    })
  } catch (commError) {
    console.error('Failed to trigger communications agent:', commError)
  }

  return NextResponse.json({ success: true })
}
