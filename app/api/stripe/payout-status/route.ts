import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

    // Get host profile with Stripe info
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        id,
        stripe_account_id,
        stripe_payouts_enabled,
        stripe_charges_enabled,
        stripe_details_submitted
      `)
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // No Stripe account connected
    if (!profile.stripe_account_id) {
      return NextResponse.json({
        connected: false,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        requirements: null,
        balance: null,
        nextPayout: null,
      })
    }

    // TODO: Uncomment when ready for production
    // Fetch account details from Stripe
    // const account = await stripe.accounts.retrieve(profile.stripe_account_id)
    // const balance = await stripe.balance.retrieve({
    //   stripeAccount: profile.stripe_account_id,
    // })

    // Stub data for development
    const stubBalance = {
      available: [{ amount: 245000, currency: 'usd' }], // $2,450.00
      pending: [{ amount: 85000, currency: 'usd' }],    // $850.00
    }

    // Calculate next payout date (next Friday)
    const today = new Date()
    const daysUntilFriday = (5 - today.getDay() + 7) % 7 || 7
    const nextFriday = new Date(today)
    nextFriday.setDate(today.getDate() + daysUntilFriday)

    return NextResponse.json({
      connected: true,
      charges_enabled: profile.stripe_charges_enabled ?? true,
      payouts_enabled: profile.stripe_payouts_enabled ?? true,
      details_submitted: profile.stripe_details_submitted ?? true,
      requirements: {
        currently_due: [],
        eventually_due: [],
        past_due: [],
        pending_verification: [],
      },
      balance: {
        available: stubBalance.available[0].amount,
        pending: stubBalance.pending[0].amount,
        currency: 'usd',
      },
      nextPayout: {
        date: nextFriday.toISOString().split('T')[0],
        amount: stubBalance.available[0].amount,
      },
    })
  } catch (error) {
    console.error('[Stripe Payout Status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payout status' },
      { status: 500 }
    )
  }
}
