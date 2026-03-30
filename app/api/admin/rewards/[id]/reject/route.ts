import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { rejection_reason } = body

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

    if (!rejection_reason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    // Get the reward
    const { data: reward, error: fetchError } = await supabase
      .from('social_rewards')
      .select('id, user_id, platform, post_type, status')
      .eq('id', id)
      .single()

    if (fetchError || !reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    if (reward.status !== 'pending') {
      return NextResponse.json({ error: 'Reward has already been processed' }, { status: 400 })
    }

    // Update reward as rejected
    const { error: updateError } = await supabase
      .from('social_rewards')
      .update({
        status: 'rejected',
        rejection_reason,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error rejecting reward:', updateError)
      return NextResponse.json({ error: 'Failed to reject reward' }, { status: 500 })
    }

    // Create notification for user
    await supabase.from('notifications').insert({
      user_id: reward.user_id,
      type: 'reward_rejected',
      title: 'Social Reward Update',
      message: `Your ${reward.platform} post could not be approved. Reason: ${rejection_reason}`,
      data: { reward_id: id },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Reward rejected and user notified'
    })

  } catch (error) {
    console.error('Error rejecting reward:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
