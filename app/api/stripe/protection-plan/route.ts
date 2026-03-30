import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

// Vehicle Protection Plan: $15/month
const PROTECTION_PLAN_AMOUNT = 1500 // cents

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const body = await request.json()
    const { vehicleId } = body

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify vehicle ownership
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id, host_id, make, model, year')
      .eq('id', vehicleId)
      .eq('host_id', user.id)
      .single()

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or unauthorized' },
        { status: 404 }
      )
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single()

    // TODO: Uncomment when ready for production
    // let customerId = profile?.stripe_customer_id
    // 
    // if (!customerId) {
    //   const customer = await stripe.customers.create({
    //     email: profile?.email,
    //     name: profile?.full_name,
    //     metadata: {
    //       user_id: user.id,
    //       platform: 'rentanddrive',
    //     },
    //   })
    //   customerId = customer.id
    //   
    //   await supabase
    //     .from('profiles')
    //     .update({ stripe_customer_id: customerId })
    //     .eq('id', user.id)
    // }

    // Create subscription
    // TODO: Uncomment when ready for production
    // const subscription = await stripe.subscriptions.create({
    //   customer: customerId,
    //   items: [
    //     {
    //       price: process.env.STRIPE_PROTECTION_PLAN_PRICE_ID,
    //     },
    //   ],
    //   payment_behavior: 'default_incomplete',
    //   payment_settings: {
    //     payment_method_types: ['card'],
    //     save_default_payment_method: 'on_subscription',
    //   },
    //   expand: ['latest_invoice.payment_intent'],
    //   metadata: {
    //     vehicle_id: vehicleId,
    //     host_id: user.id,
    //     vehicle_label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    //   },
    // })

    // Stub data for development
    const stubSubscriptionId = `sub_stub_${Date.now()}_${vehicleId.slice(0, 8)}`
    const stubClientSecret = `pi_stub_secret_${Date.now()}`

    // TODO: Link subscription to vehicle listing
    // await supabase
    //   .from('vehicles')
    //   .update({
    //     protection_plan_subscription_id: subscription.id,
    //     protection_plan_status: 'pending',
    //   })
    //   .eq('id', vehicleId)

    console.log('[Protection Plan] Created subscription:', {
      vehicleId,
      hostId: user.id,
      subscriptionId: stubSubscriptionId,
      amount: PROTECTION_PLAN_AMOUNT / 100,
    })

    return NextResponse.json({
      subscriptionId: stubSubscriptionId,
      clientSecret: stubClientSecret,
      amount: PROTECTION_PLAN_AMOUNT,
      vehicle: {
        id: vehicle.id,
        label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      },
    })
  } catch (error) {
    console.error('[Protection Plan] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create protection plan subscription' },
      { status: 500 }
    )
  }
}

// GET handler to check protection plan status
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const vehicleId = searchParams.get('vehicleId')

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Vehicle ID required' },
        { status: 400 }
      )
    }

    // Get vehicle protection plan status
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id, protection_plan_subscription_id, protection_plan_status')
      .eq('id', vehicleId)
      .eq('host_id', user.id)
      .single()

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // TODO: Fetch actual subscription status from Stripe
    // if (vehicle.protection_plan_subscription_id) {
    //   const subscription = await stripe.subscriptions.retrieve(
    //     vehicle.protection_plan_subscription_id
    //   )
    //   return NextResponse.json({
    //     active: subscription.status === 'active',
    //     status: subscription.status,
    //     currentPeriodEnd: subscription.current_period_end,
    //   })
    // }

    return NextResponse.json({
      active: vehicle.protection_plan_status === 'active',
      status: vehicle.protection_plan_status || 'none',
      subscriptionId: vehicle.protection_plan_subscription_id,
    })
  } catch (error) {
    console.error('[Protection Plan] Status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check protection plan status' },
      { status: 500 }
    )
  }
}
