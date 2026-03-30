import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
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

    // Check if already has Stripe account
    if (profile.stripe_account_id) {
      // Create new account link for existing account
      // TODO: Uncomment when ready for production
      // const accountLink = await stripe.accountLinks.create({
      //   account: profile.stripe_account_id,
      //   refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/hostslab/vault?refresh=true`,
      //   return_url: `${process.env.NEXT_PUBLIC_APP_URL}/hostslab/vault?connected=true`,
      //   type: 'account_onboarding',
      // })

      const stubUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'}/hostslab/vault?connected=true&stub=true`

      return NextResponse.json({
        url: stubUrl,
        accountId: profile.stripe_account_id,
        isExisting: true,
      })
    }

    // Create new Stripe Express account
    // TODO: Uncomment when ready for production
    // const account = await stripe.accounts.create({
    //   type: 'express',
    //   country: 'US',
    //   email: profile.email,
    //   capabilities: {
    //     card_payments: { requested: true },
    //     transfers: { requested: true },
    //   },
    //   business_type: 'individual',
    //   metadata: {
    //     host_id: profile.id,
    //     platform: 'rentanddrive',
    //   },
    // })

    // Stub account ID for development
    const stubAccountId = `acct_stub_${Date.now()}_${profile.id.slice(0, 8)}`

    // TODO: Uncomment when ready for production
    // Store Stripe account ID to host profile
    // const { error: updateError } = await supabase
    //   .from('profiles')
    //   .update({ stripe_account_id: account.id })
    //   .eq('id', profile.id)

    // if (updateError) {
    //   console.error('[Stripe Connect] Failed to update profile:', updateError)
    // }

    // Create account link for onboarding
    // TODO: Uncomment when ready for production
    // const accountLink = await stripe.accountLinks.create({
    //   account: account.id,
    //   refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/hostslab/vault?refresh=true`,
    //   return_url: `${process.env.NEXT_PUBLIC_APP_URL}/hostslab/vault?connected=true`,
    //   type: 'account_onboarding',
    // })

    const stubUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'}/hostslab/vault?connected=true&stub=true`

    console.log('[Stripe Connect] Created account for host:', {
      hostId: profile.id,
      accountId: stubAccountId,
    })

    return NextResponse.json({
      url: stubUrl,
      accountId: stubAccountId,
      isExisting: false,
    })
  } catch (error) {
    console.error('[Stripe Connect] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect account' },
      { status: 500 }
    )
  }
}
