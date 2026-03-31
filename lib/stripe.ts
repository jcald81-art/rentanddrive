import 'server-only'

import Stripe from 'stripe'

// Lazy initialization to avoid build-time errors
export function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
  })
}
