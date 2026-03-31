import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Check if Stripe key is configured
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('[create-payment-intent] STRIPE_SECRET_KEY is not configured')
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY.' },
        { status: 500 }
      )
    }

    const body = await req.json()
    // Support both camelCase (from client) and snake_case field names
    const amount = body.amount
    const vehicleId = body.vehicleId || body.vehicle_id
    const startDate = body.startDate || body.start_date
    const endDate = body.endDate || body.end_date

    if (!amount) {
      return NextResponse.json({ error: 'Amount required' }, { status: 400 })
    }

    // Client sends amount in cents already, don't multiply again
    const amountInCents = Math.round(Number(amount))

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        vehicle_id: String(vehicleId ?? ''),
        start_date: String(startDate ?? ''),
        end_date: String(endDate ?? ''),
      },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err: unknown) {
    console.error('[create-payment-intent]', err)
    return NextResponse.json(
      { error: (err as Error).message ?? 'Internal error' },
      { status: 500 }
    )
  }
}
