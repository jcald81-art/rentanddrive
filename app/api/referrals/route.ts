import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/referrals - Get current user's referral info and history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile with referral info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('referral_code, referral_count, referral_rewards_earned, full_name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // Get referral history
    const { data: referrals, error: referralsError } = await supabase
      .from('referral_events')
      .select(`
        id,
        created_at,
        reward_amount,
        reward_issued,
        new_user_id
      `)
      .eq('referrer_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.com'
    const shareUrl = `${baseUrl}/signup?ref=${profile.referral_code}`

    return NextResponse.json({
      referralCode: profile.referral_code,
      referralCount: profile.referral_count || 0,
      rewardsEarned: profile.referral_rewards_earned || 0,
      shareUrl,
      referralHistory: referrals || []
    })
  } catch (error) {
    console.error('Referral fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/referrals/validate - Validate a referral code during signup
export async function POST(request: NextRequest) {
  try {
    const { code, newUserId } = await request.json()
    
    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    const supabase = await createClient()

    // Find the referrer by code
    const { data: referrer, error: referrerError } = await supabase
      .from('profiles')
      .select('id, full_name, referral_code')
      .eq('referral_code', code.toUpperCase())
      .single()

    if (referrerError || !referrer) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid referral code' 
      }, { status: 404 })
    }

    // If newUserId is provided, record the referral event
    if (newUserId) {
      // Check if this user was already referred
      const { data: existingReferral } = await supabase
        .from('referral_events')
        .select('id')
        .eq('new_user_id', newUserId)
        .single()

      if (!existingReferral) {
        // Record the referral
        await supabase.from('referral_events').insert({
          referrer_user_id: referrer.id,
          new_user_id: newUserId,
          promo_code_used: code.toUpperCase(),
          reward_amount: 25.00
        })

        // Update referrer's count
        await supabase
          .from('profiles')
          .update({ 
            referral_count: (referrer as any).referral_count ? (referrer as any).referral_count + 1 : 1 
          })
          .eq('id', referrer.id)

        // Update new user's referred_by
        await supabase
          .from('profiles')
          .update({ referred_by: referrer.id })
          .eq('id', newUserId)
      }
    }

    return NextResponse.json({
      valid: true,
      referrerName: referrer.full_name?.split(' ')[0] || 'A friend',
      message: `You were referred by ${referrer.full_name?.split(' ')[0] || 'a friend'}! You both get $25 credit.`
    })
  } catch (error) {
    console.error('Referral validation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
