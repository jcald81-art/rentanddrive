import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Use service role to bypass RLS for webhook updates
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('[Stripe Webhook] Missing stripe-signature header')
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Stripe Webhook] Signature verification failed: ${message}`)
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    )
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`)

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Handle successful payment - activate the booking
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.booking_id

  if (!bookingId) {
    console.error('[Stripe Webhook] No booking_id in payment metadata')
    return
  }

  console.log(`[Stripe Webhook] Payment succeeded for booking: ${bookingId}`)

  // Update booking status to confirmed
  const { error: bookingError } = await supabaseAdmin
    .from('bookings')
    .update({
      status: 'confirmed',
      payment_status: 'paid',
      payment_intent_id: paymentIntent.id,
      paid_at: new Date().toISOString(),
    })
    .eq('id', bookingId)

  if (bookingError) {
    console.error('[Stripe Webhook] Failed to update booking:', bookingError)
    throw bookingError
  }

  // Create a payment record
  const { error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      booking_id: bookingId,
      stripe_payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'succeeded',
      payment_method: paymentIntent.payment_method_types?.[0] || 'card',
    })

  if (paymentError) {
    console.error('[Stripe Webhook] Failed to create payment record:', paymentError)
    // Don't throw - booking is already confirmed
  }

  // Get booking details for notification
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select(`
      id,
      renter_id,
      host_id,
      vehicles (make, model, year)
    `)
    .eq('id', bookingId)
    .single()

  if (booking) {
    // Notify renter
    await supabaseAdmin.from('notifications').insert({
      user_id: booking.renter_id,
      type: 'booking_confirmed',
      title: 'Booking Confirmed!',
      message: `Your booking for the ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model} has been confirmed.`,
      data: { booking_id: bookingId },
    })

    // Notify host
    await supabaseAdmin.from('notifications').insert({
      user_id: booking.host_id,
      type: 'new_booking',
      title: 'New Booking Received',
      message: `You have a new confirmed booking for your ${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model}.`,
      data: { booking_id: bookingId },
    })
  }

  console.log(`[Stripe Webhook] Booking ${bookingId} activated successfully`)
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.booking_id

  if (!bookingId) {
    console.error('[Stripe Webhook] No booking_id in payment metadata')
    return
  }

  console.log(`[Stripe Webhook] Payment failed for booking: ${bookingId}`)

  // Update booking status
  const { error } = await supabaseAdmin
    .from('bookings')
    .update({
      status: 'payment_failed',
      payment_status: 'failed',
    })
    .eq('id', bookingId)

  if (error) {
    console.error('[Stripe Webhook] Failed to update booking:', error)
    throw error
  }

  // Get booking for notification
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('renter_id, vehicles (make, model)')
    .eq('id', bookingId)
    .single()

  if (booking) {
    await supabaseAdmin.from('notifications').insert({
      user_id: booking.renter_id,
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Your payment for the ${booking.vehicles?.make} ${booking.vehicles?.model} booking failed. Please try again.`,
      data: { booking_id: bookingId },
    })
  }

  console.log(`[Stripe Webhook] Booking ${bookingId} marked as payment_failed`)
}

// Handle refunds
async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string

  if (!paymentIntentId) {
    console.log('[Stripe Webhook] No payment_intent on charge')
    return
  }

  console.log(`[Stripe Webhook] Refund processed for payment: ${paymentIntentId}`)

  // Find booking by payment intent
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, renter_id')
    .eq('payment_intent_id', paymentIntentId)
    .single()

  if (!booking) {
    console.log('[Stripe Webhook] No booking found for refunded payment')
    return
  }

  // Determine if full or partial refund
  const refundAmount = charge.amount_refunded
  const totalAmount = charge.amount
  const isFullRefund = refundAmount >= totalAmount

  // Update booking status
  const { error } = await supabaseAdmin
    .from('bookings')
    .update({
      status: isFullRefund ? 'refunded' : 'partially_refunded',
      payment_status: isFullRefund ? 'refunded' : 'partially_refunded',
      refund_amount: refundAmount,
      refunded_at: new Date().toISOString(),
    })
    .eq('id', booking.id)

  if (error) {
    console.error('[Stripe Webhook] Failed to update booking:', error)
    throw error
  }

  // Notify renter
  await supabaseAdmin.from('notifications').insert({
    user_id: booking.renter_id,
    type: 'refund_processed',
    title: isFullRefund ? 'Full Refund Processed' : 'Partial Refund Processed',
    message: `A refund of $${(refundAmount / 100).toFixed(2)} has been processed for your booking.`,
    data: { booking_id: booking.id, amount: refundAmount },
  })

  console.log(`[Stripe Webhook] Booking ${booking.id} refund processed`)
}

// Handle connected account updates (for host payouts)
async function handleAccountUpdated(account: Stripe.Account) {
  console.log(`[Stripe Webhook] Account updated: ${account.id}`)

  // Find host by Stripe account ID
  const { data: host } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_account_id', account.id)
    .single()

  if (!host) {
    console.log('[Stripe Webhook] No host found for Stripe account')
    return
  }

  // Update host's payout status
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      stripe_payouts_enabled: account.payouts_enabled,
      stripe_charges_enabled: account.charges_enabled,
      stripe_details_submitted: account.details_submitted,
    })
    .eq('id', host.id)

  if (error) {
    console.error('[Stripe Webhook] Failed to update host profile:', error)
    throw error
  }

  console.log(`[Stripe Webhook] Host ${host.id} Stripe status updated`)
}
