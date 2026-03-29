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

    // Get all rewards for stats
    const { data: rewards, error } = await supabase
      .from('social_rewards')
      .select('status, platform, reward_amount_cents, estimated_reach')

    if (error) {
      console.error('Error fetching rewards stats:', error)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    // Calculate stats
    const stats = {
      total_submissions: rewards?.length || 0,
      pending_count: rewards?.filter(r => r.status === 'pending').length || 0,
      approved_count: rewards?.filter(r => r.status === 'approved').length || 0,
      rejected_count: rewards?.filter(r => r.status === 'rejected').length || 0,
      total_discount_given_cents: rewards
        ?.filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + (r.reward_amount_cents || 0), 0) || 0,
      total_estimated_reach: rewards
        ?.filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + (r.estimated_reach || 0), 0) || 0,
      posts_by_platform: {} as Record<string, number>,
    }

    // Count posts by platform
    rewards?.forEach(r => {
      if (!stats.posts_by_platform[r.platform]) {
        stats.posts_by_platform[r.platform] = 0
      }
      stats.posts_by_platform[r.platform]++
    })

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error in rewards stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
