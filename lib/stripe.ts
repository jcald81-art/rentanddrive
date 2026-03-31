import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'
import type { Stripe as StripeClient } from '@stripe/stripe-js'

// ── Server-side Stripe instance (used in API routes) ──────────────
// Initialized as a function to avoid module-level env var access at build time
export function getStripeServer(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
  })
}

// Named export that all 6 broken routes expect
// This is a getter — initializes only when called, not at build time
export const stripe = {
  paymentIntents: {
    create: (params: Stripe.PaymentIntentCreateParams) => 
      getStripeServer().paymentIntents.create(params),
    retrieve: (id: string) => 
      getStripeServer().paymentIntents.retrieve(id),
    cancel: (id: string) => 
      getStripeServer().paymentIntents.cancel(id),
  },
  refunds: {
    create: (params: Stripe.RefundCreateParams) => 
      getStripeServer().refunds.create(params),
  },
  checkout: {
    sessions: {
      create: (params: Stripe.Checkout.SessionCreateParams) => 
        getStripeServer().checkout.sessions.create(params),
      retrieve: (id: string) => 
        getStripeServer().checkout.sessions.retrieve(id),
    },
  },
  accounts: {
    create: (params: Stripe.AccountCreateParams) => 
      getStripeServer().accounts.create(params),
    retrieve: (id: string) => 
      getStripeServer().accounts.retrieve(id),
    createLoginLink: (id: string) => 
      getStripeServer().accounts.createLoginLink(id),
  },
  accountLinks: {
    create: (params: Stripe.AccountLinkCreateParams) => 
      getStripeServer().accountLinks.create(params),
  },
  transfers: {
    create: (params: Stripe.TransferCreateParams) => 
      getStripeServer().transfers.create(params),
  },
  webhooks: {
    constructEvent: (body: string, sig: string, secret: string) => 
      getStripeServer().webhooks.constructEvent(body, sig, secret),
  },
  customers: {
    create: (params: Stripe.CustomerCreateParams) => 
      getStripeServer().customers.create(params),
    retrieve: (id: string) => 
      getStripeServer().customers.retrieve(id),
  },
}

// ── Client-side Stripe loader (used in payment components) ────────
let stripeClientPromise: Promise<StripeClient | null>

export function getStripe() {
  if (!stripeClientPromise) {
    stripeClientPromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    )
  }
  return stripeClientPromise
}
