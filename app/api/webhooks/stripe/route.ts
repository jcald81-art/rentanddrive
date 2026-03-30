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

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
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

    // Trigger Communications Agent for booking_confirmed SMS
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agents/communications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          trigger_event: 'booking_confirmed',
        }),
      })
      console.log(`[Stripe Webhook] Communications agent triggered for booking ${bookingId}`)
    } catch (commError) {
      console.error('[Stripe Webhook] Failed to trigger communications agent:', commError)
    }
  }

  // Capture security deposit authorization
  const depositIntentId = paymentIntent.metadata?.deposit_intent_id
  if (depositIntentId) {
    try {
      await stripe.paymentIntents.capture(depositIntentId)
      console.log(`[Stripe Webhook] Security deposit captured for booking ${bookingId}`)
    } catch (depositError) {
      console.error('[Stripe Webhook] Failed to capture security deposit:', depositError)
    }
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

// Handle dispute created - flag booking and alert admin
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const paymentIntentId = dispute.payment_intent as string

  console.log(`[Stripe Webhook] Dispute created for payment: ${paymentIntentId}`)

  if (!paymentIntentId) {
    console.log('[Stripe Webhook] No payment_intent on dispute')
    return
  }

  // Find booking by payment intent
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, renter_id, host_id')
    .eq('payment_intent_id', paymentIntentId)
    .single()

  if (!booking) {
    console.log('[Stripe Webhook] No booking found for disputed payment')
    return
  }

  // Update booking status to disputed and flag it
  const { error } = await supabaseAdmin
    .from('bookings')
    .update({
      status: 'disputed',
      is_flagged: true,
      admin_notes: `Dispute created: ${dispute.reason} - Amount: $${(dispute.amount / 100).toFixed(2)}`,
    })
    .eq('id', booking.id)

  if (error) {
    console.error('[Stripe Webhook] Failed to update booking:', error)
    throw error
  }

  // Alert admin via SendGrid
  if (process.env.SENDGRID_API_KEY && process.env.ADMIN_EMAIL) {
    try {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: process.env.ADMIN_EMAIL }] }],
          from: { email: process.env.SENDGRID_FROM_EMAIL || 'support@rentanddrive.net' },
          subject: `[URGENT] Payment Dispute - Booking ${booking.id.slice(0, 8)}`,
          content: [{
            type: 'text/html',
            value: `
              <h2>Payment Dispute Alert</h2>
              <p><strong>Booking ID:</strong> ${booking.id}</p>
              <p><strong>Dispute Reason:</strong> ${dispute.reason}</p>
              <p><strong>Amount:</strong> $${(dispute.amount / 100).toFixed(2)}</p>
              <p><strong>Status:</strong> ${dispute.status}</p>
              <p>Please review this dispute immediately in the <a href="https://dashboard.stripe.com/disputes/${dispute.id}">Stripe Dashboard</a>.</p>
            `,
          }],
        }),
      })
      console.log(`[Stripe Webhook] Admin alerted about dispute for booking ${booking.id}`)
    } catch (emailError) {
      console.error('[Stripe Webhook] Failed to send dispute alert email:', emailError)
    }
  }

  console.log(`[Stripe Webhook] Booking ${booking.id} marked as disputed`)
}

// Handle checkout session completed (same as payment succeeded)
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.booking_id

  if (!bookingId) {
    console.log('[Stripe Webhook] No booking_id in checkout session metadata')
    return
  }

  console.log(`[Stripe Webhook] Checkout completed for booking: ${bookingId}`)

  // Update booking status to confirmed
  const { error } = await supabaseAdmin
    .from('bookings')
    .update({
      status: 'confirmed',
      payment_status: 'paid',
      checkout_session_id: session.id,
      paid_at: new Date().toISOString(),
    })
    .eq('id', bookingId)

  if (error) {
    console.error('[Stripe Webhook] Failed to update booking:', error)
    throw error
  }

  // Get booking details and trigger communications
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, renter_id')
    .eq('id', bookingId)
    .single()

  if (booking) {
    // Trigger booking_confirmed SMS
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agents/communications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          trigger_event: 'booking_confirmed',
        }),
      })
    } catch (commError) {
      console.error('[Stripe Webhook] Failed to trigger communications agent:', commError)
    }
  }

  console.log(`[Stripe Webhook] Checkout booking ${bookingId} confirmed`)
}

// Handle transfer created (host payout)
async function handleTransferCreated(transfer: Stripe.Transfer) {
  console.log(`[Stripe Webhook] Transfer created: ${transfer.id}`)

  const hostAccountId = transfer.destination as string
  const amount = transfer.amount

  // Find host by Stripe account ID
  const { data: host } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name')
    .eq('stripe_account_id', hostAccountId)
    .single()

  if (!host) {
    console.log('[Stripe Webhook] No host found for transfer destination')
    return
  }

  // Log the payout
  await supabaseAdmin.from('host_payouts').insert({
    host_id: host.id,
    stripe_transfer_id: transfer.id,
    amount: amount,
    currency: transfer.currency,
    status: 'completed',
  })

  // Notify host
  await supabaseAdmin.from('notifications').insert({
    user_id: host.id,
    type: 'payout_sent',
    title: 'Payout Sent!',
    message: `$${(amount / 100).toFixed(2)} has been transferred to your bank account.`,
    data: { transfer_id: transfer.id, amount },
  })

  console.log(`[Stripe Webhook] Payout logged for host ${host.id}: $${(amount / 100).toFixed(2)}`)
}

// Handle Vehicle Protection Plan subscription created
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const vehicleId = subscription.metadata?.vehicle_id
  const hostId = subscription.metadata?.host_id

  if (!vehicleId) {
    console.log('[Stripe Webhook] No vehicle_id in subscription metadata')
    return
  }

  console.log(`[Stripe Webhook] Protection Plan activated for vehicle: ${vehicleId}`)

  // Update vehicle protection plan status
  const { error } = await supabaseAdmin
    .from('vehicles')
    .update({
      protection_plan_subscription_id: subscription.id,
      protection_plan_status: 'active',
      protection_plan_started_at: new Date().toISOString(),
    })
    .eq('id', vehicleId)

  if (error) {
    console.error('[Stripe Webhook] Failed to update vehicle:', error)
    return
  }

  // Notify host
  if (hostId) {
    await supabaseAdmin.from('notifications').insert({
      user_id: hostId,
      type: 'protection_plan_active',
      title: 'Vehicle Protection Plan Active',
      message: `Your Vehicle Protection Plan is now active. Your vehicle is protected with $1M coverage.`,
      data: { vehicle_id: vehicleId, subscription_id: subscription.id },
    })
  }

  console.log(`[Stripe Webhook] Vehicle ${vehicleId} protection plan activated`)
}

// Handle Vehicle Protection Plan subscription deleted/cancelled
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const vehicleId = subscription.metadata?.vehicle_id
  const hostId = subscription.metadata?.host_id

  if (!vehicleId) {
    console.log('[Stripe Webhook] No vehicle_id in subscription metadata')
    return
  }

  console.log(`[Stripe Webhook] Protection Plan deactivated for vehicle: ${vehicleId}`)

  // Update vehicle protection plan status
  const { error } = await supabaseAdmin
    .from('vehicles')
    .update({
      protection_plan_status: 'cancelled',
      protection_plan_ended_at: new Date().toISOString(),
    })
    .eq('id', vehicleId)

  if (error) {
    console.error('[Stripe Webhook] Failed to update vehicle:', error)
    return
  }

  // Notify host
  if (hostId) {
    await supabaseAdmin.from('notifications').insert({
      user_id: hostId,
      type: 'protection_plan_cancelled',
      title: 'Vehicle Protection Plan Cancelled',
      message: `Your Vehicle Protection Plan has been cancelled. Consider re-subscribing for continued coverage.`,
      data: { vehicle_id: vehicleId },
    })
  }

  console.log(`[Stripe Webhook] Vehicle ${vehicleId} protection plan deactivated`)
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
