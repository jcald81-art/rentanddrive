import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const rewardOptions: Record<string, { points: number; discountAmount: number; type: string }> = {
  discount_5: { points: 500, discountAmount: 5, type: 'discount' },
  discount_15: { points: 1400, discountAmount: 15, type: 'discount' },
  discount_25: { points: 2200, discountAmount: 25, type: 'discount' },
  free_day: { points: 5000, discountAmount: 80, type: 'free_day' },
  drivemonthly_upgrade: { points: 3000, discountAmount: 0, type: 'upgrade' },
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rewardId, bookingId } = await req.json()

    if (!rewardId || !rewardOptions[rewardId]) {
      return NextResponse.json({ error: 'Invalid reward' }, { status: 400 })
    }

    const reward = rewardOptions[rewardId]

    // Get current balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('drive_points')
      .eq('id', user.id)
      .single()

    const currentPoints = profile?.drive_points || 0

    // Validate sufficient balance
    if (currentPoints < reward.points) {
      return NextResponse.json({ 
        error: 'Insufficient points', 
        required: reward.points,
        available: currentPoints,
      }, { status: 400 })
    }

    // Deduct points
    const newBalance = currentPoints - reward.points
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ drive_points: newBalance })
      .eq('id', user.id)

    if (updateError) {
      console.error('[Rewards Redeem] Update error:', updateError)
    }

    // Create redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from('drive_points_redemptions')
      .insert({
        user_id: user.id,
        reward_id: rewardId,
        points_spent: reward.points,
        discount_amount: reward.discountAmount,
        reward_type: reward.type,
        booking_id: bookingId || null,
        status: 'active',
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      })
      .select()
      .single()

    // Log points transaction
    await supabase.from('drive_points_history').insert({
      user_id: user.id,
      event_type: 'redemption',
      reference_id: redemption?.id || null,
      points_earned: -reward.points,
      balance_after: newBalance,
      description: `Redeemed: ${getRewardDescription(rewardId)}`,
    })

    // If applying to a booking, update the booking
    if (bookingId && reward.discountAmount > 0) {
      await supabase
        .from('bookings')
        .update({
          drivepoints_discount: reward.discountAmount,
          drivepoints_redemption_id: redemption?.id,
        })
        .eq('id', bookingId)
        .eq('renter_id', user.id)
    }

    // Send notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'reward_redeemed',
      title: 'Reward Redeemed!',
      message: `You've redeemed ${reward.points.toLocaleString()} points for ${getRewardDescription(rewardId)}.`,
      data: { rewardId, discountAmount: reward.discountAmount, redemptionId: redemption?.id },
    })

    return NextResponse.json({
      success: true,
      discountAmount: reward.discountAmount,
      newBalance,
      redemptionId: redemption?.id,
      expiresAt: redemption?.expires_at,
    })
  } catch (error) {
    console.error('[Rewards Redeem] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getRewardDescription(rewardId: string): string {
  const descriptions: Record<string, string> = {
    discount_5: '$5 off next rental',
    discount_15: '$15 off next rental',
    discount_25: '$25 off next rental',
    free_day: '1 Free Day (up to $80 value)',
    drivemonthly_upgrade: 'Free DriveMonthly upgrade',
  }
  return descriptions[rewardId] || 'Reward'
}
