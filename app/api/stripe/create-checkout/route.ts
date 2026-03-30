import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

// Platform fee: 15% of rental
const PLATFORM_FEE_PERCENT = 0.15

interface CheckoutRequest {
  rentalId: string
  renterId: string
  hostId: string
  vehicleId: string
  startDate: string
  endDate: string
  totalAmount: number // in cents
  vehicleLabel: string // "Year Make Model"
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const body: CheckoutRequest = await request.json()
    const {
      rentalId,
      renterId,
      hostId,
      vehicleId,
      startDate,
      endDate,
      totalAmount,
      vehicleLabel,
    } = body

    // Validate required fields
    if (!rentalId || !renterId || !hostId || !vehicleId || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate platform fee (15%)
    const platformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENT)
    const hostPayout = totalAmount - platformFee

    // Calculate rental duration
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    // Get host's Stripe Connect account ID
    const { data: hostProfile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', hostId)
      .single()

    const stripeAccountId = hostProfile?.stripe_account_id

    // TODO: Uncomment when ready for production
    // const session = await stripe.checkout.sessions.create({
    //   mode: 'payment',
    //   payment_method_types: ['card'],
    //   line_items: [
    //     {
    //       price_data: {
    //         currency: 'usd',
    //         product_data: {
    //           name: `Vehicle Rental — ${vehicleLabel}`,
    //           description: `${days} day${days > 1 ? 's' : ''} rental (${startDate} to ${endDate})`,
    //         },
    //         unit_amount: totalAmount - platformFee,
    //       },
    //       quantity: 1,
    //     },
    //     {
    //       price_data: {
    //         currency: 'usd',
    //         product_data: {
    //           name: 'Platform Fee',
    //           description: 'Rent and Drive service fee',
    //         },
    //         unit_amount: platformFee,
    //       },
    //       quantity: 1,
    //     },
    //   ],
    //   payment_intent_data: {
    //     application_fee_amount: platformFee,
    //     transfer_data: stripeAccountId ? {
    //       destination: stripeAccountId,
    //     } : undefined,
    //     metadata: {
    //       booking_id: rentalId,
    //       renter_id: renterId,
    //       host_id: hostId,
    //       vehicle_id: vehicleId,
    //     },
    //   },
    //   metadata: {
    //     booking_id: rentalId,
    //     renter_id: renterId,
    //     host_id: hostId,
    //     vehicle_id: vehicleId,
    //   },
    //   success_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/cancel`,
    // })

    // Stub response for development
    const stubSessionId = `cs_test_${Date.now()}_${rentalId.slice(0, 8)}`
    const stubCheckoutUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'}/booking/success?session_id=${stubSessionId}&stub=true`

    // Log the checkout attempt
    console.log('[Stripe Checkout] Creating session:', {
      rentalId,
      totalAmount: totalAmount / 100,
      platformFee: platformFee / 100,
      hostPayout: hostPayout / 100,
      days,
      hasConnectAccount: !!stripeAccountId,
    })

    return NextResponse.json({
      sessionId: stubSessionId,
      url: stubCheckoutUrl,
      breakdown: {
        subtotal: totalAmount,
        platformFee,
        hostPayout,
        days,
      },
    })
  } catch (error) {
    console.error('[Stripe Checkout] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
