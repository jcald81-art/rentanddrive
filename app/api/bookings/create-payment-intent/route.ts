import { NextRequest, NextResponse } from 'next/server'
import { getStripeServer } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {

    const body = await req.json()
    const { amount, vehicle_id, start_date, end_date } = body

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        vehicle_id: String(vehicle_id ?? ''),
        start_date: String(start_date ?? ''),
        end_date: String(end_date ?? ''),
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (err: unknown) {
    console.error('[create-payment-intent]', err)
    return NextResponse.json(
      { error: (err as Error).message ?? 'Internal error' },
      { status: 500 }
    )
  }
}
