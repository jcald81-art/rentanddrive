import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ connected: false }, { status: 401 })
    }

    // Check if user has a Stripe Connect account
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_payouts_enabled')
      .eq('id', user.id)
      .single()

    if (profile?.stripe_account_id) {
      return NextResponse.json({
        connected: profile.stripe_payouts_enabled === true,
        pending: !profile.stripe_payouts_enabled,
        accountId: profile.stripe_account_id,
      })
    }

    return NextResponse.json({ connected: false, pending: false })
  } catch (error) {
    console.error('Error checking Stripe status:', error)
    return NextResponse.json({ connected: false, error: 'Failed to check status' }, { status: 500 })
  }
}
