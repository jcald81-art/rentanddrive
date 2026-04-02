import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { returnUrl, refreshUrl } = await request.json()

    // Check if Stripe is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ 
        error: 'Stripe is not configured. Please add your Stripe API keys.',
        message: 'Stripe integration not set up yet. Please contact support or add your Stripe keys in the settings.'
      }, { status: 503 })
    }

    // Dynamic import of Stripe to avoid build errors when not configured
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeSecretKey)

    // Check if user already has a Stripe Connect account
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', user.id)
      .single()

    let accountId = profile?.stripe_account_id

    if (!accountId) {
      // Create a new Connect account
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        metadata: {
          user_id: user.id,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })

      accountId = account.id

      // Save the account ID to the profile
      await supabase
        .from('profiles')
        .update({ 
          stripe_account_id: accountId,
          stripe_payouts_enabled: false
        })
        .eq('id', user.id)
    }

    // Create an account link for onboarding
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rentanddrive.net'
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl || `${baseUrl}/host/dashboard`,
      return_url: returnUrl || `${baseUrl}/host/dashboard?stripe_return=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error('Stripe Connect onboard error:', error)
    
    // Handle Stripe not installed
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      return NextResponse.json({ 
        error: 'Stripe SDK not installed',
        message: 'Stripe integration is not available yet. Please try again later.'
      }, { status: 503 })
    }

    return NextResponse.json({ 
      error: 'Failed to start Stripe onboarding',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
