import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Build query
    let query = supabase
      .from('social_rewards')
      .select(`
        id,
        booking_id,
        user_id,
        platform,
        post_url,
        post_type,
        caption,
        reward_amount_cents,
        discount_code,
        status,
        rejection_reason,
        follower_count,
        estimated_impressions,
        estimated_reach,
        created_at,
        approved_at,
        user:users!social_rewards_user_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        ),
        booking:bookings (
          booking_number,
          vehicle:vehicles (
            make,
            model,
            year
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: rewards, error } = await query.limit(100)

    if (error) {
      console.error('Error fetching rewards:', error)
      return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 })
    }

    return NextResponse.json({ rewards })

  } catch (error) {
    console.error('Error in admin rewards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
