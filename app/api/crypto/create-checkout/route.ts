import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
  })
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, currency, bookingId, vehicleId, hostId } = body

    if (!amount || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate currency
    const supportedCurrencies = ['usdc', 'usdt']
    if (!supportedCurrencies.includes(currency.toLowerCase())) {
      return NextResponse.json({ error: 'Unsupported currency' }, { status: 400 })
    }

    // Get host's crypto preferences to determine payout method
    let hostCryptoPrefs = null
    if (hostId) {
      const { data } = await supabase
        .from('host_crypto_preferences')
        .select('*')
        .eq('host_id', hostId)
        .single()
      hostCryptoPrefs = data
    }

    // Create Stripe checkout session with crypto payment method
    // Note: Stripe's USDC support uses their Link payment method
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'link'], // Link supports USDC
      line_items: [
        {
          price_data: {
            currency: 'usd', // Stripe processes in USD, converted from stablecoin
            product_data: {
              name: `Vehicle Rental Payment`,
              description: `Payment via ${currency.toUpperCase()} stablecoin`,
              metadata: {
                crypto_currency: currency,
                booking_id: bookingId || '',
                vehicle_id: vehicleId || '',
              },
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        booking_id: bookingId || '',
        payment_type: 'crypto',
        crypto_currency: currency,
        host_payout_method: hostCryptoPrefs?.payout_method || 'bank',
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rentanddrive.net'}/booking/success?session_id={CHECKOUT_SESSION_ID}&crypto=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rentanddrive.net'}/booking/cancelled`,
    })

    // Log the crypto payment initiation
    await supabase.from('payment_logs').insert({
      user_id: user.id,
      booking_id: bookingId,
      amount,
      currency: currency.toUpperCase(),
      payment_type: 'crypto',
      status: 'initiated',
      stripe_session_id: session.id,
      metadata: {
        host_payout_method: hostCryptoPrefs?.payout_method,
        wallet_address: hostCryptoPrefs?.wallet_address,
      },
    }).catch(() => {}) // Non-blocking log

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('Crypto checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
