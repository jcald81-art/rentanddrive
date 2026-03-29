import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's reward submissions
    const { data: rewards, error } = await supabase
      .from('social_rewards')
      .select(`
        id,
        booking_id,
        platform,
        post_url,
        post_type,
        reward_amount_cents,
        discount_code,
        discount_code_used,
        status,
        rejection_reason,
        created_at,
        approved_at,
        booking:bookings (
          booking_number,
          vehicle:vehicles (
            make,
            model,
            year
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching rewards:', error)
      return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 })
    }

    return NextResponse.json({ rewards })

  } catch (error) {
    console.error('Error in my-submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
