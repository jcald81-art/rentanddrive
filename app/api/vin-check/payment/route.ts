import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

const REPORT_PRICES: Record<string, { amount: number; name: string; description: string }> = {
  basic: {
    amount: 999,
    name: 'Basic Vehicle History',
    description: 'Accident history, title check, theft records',
  },
  premium: {
    amount: 1999,
    name: 'Premium Vehicle Report',
    description: 'Basic + market value, ownership history, odometer verification',
  },
  bundle: {
    amount: 2999,
    name: 'Full Vehicle Bundle',
    description: 'Everything + open recalls, detailed specs, lien check',
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vin, report_type, vehicle_id, user_id, return_url } = body

    if (!vin || vin.length !== 17) {
      return NextResponse.json(
        { error: 'Invalid VIN. Must be exactly 17 characters.' },
        { status: 400 }
      )
    }

    if (!report_type || !REPORT_PRICES[report_type]) {
      return NextResponse.json(
        { error: 'Invalid report type.' },
        { status: 400 }
      )
    }

    const priceInfo = REPORT_PRICES[report_type]

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: priceInfo.amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: 'vin_check',
        vin,
        report_type,
        vehicle_id: vehicle_id || '',
        user_id: user_id || '',
      },
      description: `${priceInfo.name} - VIN: ${vin}`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: priceInfo.amount,
      reportType: report_type,
      reportName: priceInfo.name,
    })

  } catch (error) {
    console.error('Stripe payment intent error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment.' },
      { status: 500 }
    )
  }
}

// Webhook handler for successful payments - triggers VIN check
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { payment_intent_id } = body

    if (!payment_intent_id) {
      return NextResponse.json(
        { error: 'Payment intent ID required.' },
        { status: 400 }
      )
    }

    // Retrieve payment intent to verify it succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed.' },
        { status: 400 }
      )
    }

    const { vin, report_type, vehicle_id, user_id } = paymentIntent.metadata

    // Call the VIN check API
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const vinCheckResponse = await fetch(`${baseUrl}/api/vin-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vin,
        report_type,
        vehicle_id: vehicle_id || null,
        user_id: user_id || null,
        payment_intent_id,
      }),
    })

    const vinCheckResult = await vinCheckResponse.json()

    if (!vinCheckResponse.ok) {
      return NextResponse.json(
        { error: 'VIN check failed after payment.', details: vinCheckResult },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ...vinCheckResult,
    })

  } catch (error) {
    console.error('VIN check after payment error:', error)
    return NextResponse.json(
      { error: 'Failed to process VIN check after payment.' },
      { status: 500 }
    )
  }
}
