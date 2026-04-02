import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    // Verify Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[Stripe Connect] STRIPE_SECRET_KEY not configured')
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 503 }
      )
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get host profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, stripe_account_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'

    // Check if already has Stripe account
    if (profile.stripe_account_id) {
      try {
        // Create new account link for existing account
        const accountLink = await stripe.accountLinks.create({
          account: profile.stripe_account_id,
          refresh_url: `${appUrl}/host/vault?refresh=true`,
          return_url: `${appUrl}/host/vault?connected=true`,
          type: 'account_onboarding',
        })

        return NextResponse.json({
          url: accountLink.url,
          accountId: profile.stripe_account_id,
          isExisting: true,
        })
      } catch (stripeError: unknown) {
        console.error('[Stripe Connect] Error creating account link:', stripeError)
        // If the account link fails, the account may be invalid - create a new one
        if ((stripeError as { code?: string })?.code === 'account_invalid') {
          // Clear the invalid account and create a new one below
          await supabase
            .from('profiles')
            .update({ stripe_account_id: null })
            .eq('id', profile.id)
        } else {
          throw stripeError
        }
      }
    }

    // Create new Stripe Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: profile.email || user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        host_id: profile.id,
        platform: 'rentanddrive',
      },
    })

    // Store Stripe account ID to host profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stripe_account_id: account.id })
      .eq('id', profile.id)

    if (updateError) {
      console.error('[Stripe Connect] Failed to update profile:', updateError)
      // Don't fail the request - the account was created successfully
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${appUrl}/host/vault?refresh=true`,
      return_url: `${appUrl}/host/vault?connected=true`,
      type: 'account_onboarding',
    })

    console.log('[Stripe Connect] Created account for host:', {
      hostId: profile.id,
      accountId: account.id,
    })

    return NextResponse.json({
      url: accountLink.url,
      accountId: account.id,
      isExisting: false,
    })
  } catch (error) {
    console.error('[Stripe Connect] Error:', error)
    
    // Provide specific error messages for common Stripe errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid API Key')) {
        return NextResponse.json(
          { error: 'Payment system configuration error. Please contact support.' },
          { status: 503 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect account. Please try again.' },
      { status: 500 }
    )
  }
}
