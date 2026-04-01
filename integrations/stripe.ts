/**
 * Stripe Integration — Payments, Deposits, and Payouts
 *
 * Handles rental payments, security deposits, damage fee charges,
 * host payouts via Stripe Connect, and identity verification.
 *
 * Docs: https://stripe.com/docs
 */

import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set')
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      appInfo: { name: 'RentAndDrive', version: '2.0', url: 'https://rentanddrive.com' },
    })
  }
  return _stripe
}

/**
 * Create a booking checkout session
 */
export async function createBookingCheckout(params: {
  bookingId: string
  vehicleId: string
  vehicleName: string
  totalAmount: number // in cents
  depositAmount: number // in cents
  rentalDays: number
  dailyRate: number
  hostStripeAccountId: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  addons?: Array<{ name: string; amount: number }>
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe()

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${params.vehicleName} Rental`,
          description: `${params.rentalDays} day${params.rentalDays > 1 ? 's' : ''} @ $${(params.dailyRate / 100).toFixed(2)}/day`,
          metadata: { vehicle_id: params.vehicleId },
        },
        unit_amount: params.dailyRate,
      },
      quantity: params.rentalDays,
    },
  ]

  // Add addons if present
  if (params.addons) {
    for (const addon of params.addons) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: addon.name },
          unit_amount: addon.amount,
        },
        quantity: 1,
      })
    }
  }

  return stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: params.customerEmail,
    line_items: lineItems,
    payment_intent_data: {
      application_fee_amount: Math.round(params.totalAmount * 0.1), // 10% platform fee
      transfer_data: { destination: params.hostStripeAccountId },
      metadata: { booking_id: params.bookingId, vehicle_id: params.vehicleId },
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { booking_id: params.bookingId },
  })
}

/**
 * Hold a security deposit (authorize without capturing)
 */
export async function holdSecurityDeposit(params: {
  bookingId: string
  amount: number // in cents
  paymentMethodId: string
  customerId?: string
}): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe()
  return stripe.paymentIntents.create({
    amount: params.amount,
    currency: 'usd',
    payment_method: params.paymentMethodId,
    customer: params.customerId,
    capture_method: 'manual',
    confirm: true,
    metadata: { booking_id: params.bookingId, type: 'security_deposit' },
    description: `Security deposit hold — Booking ${params.bookingId}`,
  })
}

/**
 * Capture (charge) a security deposit for damage
 */
export async function captureDamageDeposit(
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe()
  return stripe.paymentIntents.capture(paymentIntentId, {
    amount_to_capture: amount,
  })
}

/**
 * Release (cancel) a security deposit hold
 */
export async function releaseSecurityDeposit(paymentIntentId: string): Promise<void> {
  const stripe = getStripe()
  await stripe.paymentIntents.cancel(paymentIntentId)
}

/**
 * Charge a damage fee to a customer
 */
export async function chargeDamageFee(params: {
  bookingId: string
  customerId: string
  amount: number
  description: string
}): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe()
  return stripe.paymentIntents.create({
    amount: params.amount,
    currency: 'usd',
    customer: params.customerId,
    payment_method_types: ['card'],
    confirm: true,
    description: params.description,
    metadata: { booking_id: params.bookingId, type: 'damage_fee' },
  })
}

/**
 * Create or retrieve a Stripe Connect account for a host
 */
export async function createHostConnectAccount(params: {
  email: string
  userId: string
}): Promise<{ accountId: string; onboardingUrl: string }> {
  const stripe = getStripe()

  const account = await stripe.accounts.create({
    type: 'express',
    email: params.email,
    metadata: { user_id: params.userId },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/hostslab/vault?stripe=refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/hostslab/vault?stripe=success`,
    type: 'account_onboarding',
  })

  return { accountId: account.id, onboardingUrl: accountLink.url }
}

/**
 * Issue a refund for a booking
 */
export async function refundBooking(
  paymentIntentId: string,
  amount?: number,
  reason?: Stripe.RefundCreateParams.Reason
): Promise<Stripe.Refund> {
  const stripe = getStripe()
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount,
    reason: reason ?? 'requested_by_customer',
  })
}

/**
 * Construct and verify a Stripe webhook event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return getStripe().webhooks.constructEvent(payload, signature, secret)
}
