import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const eventPointValues: Record<string, number | ((amount: number) => number)> = {
  rental_completed: (amount: number) => Math.floor(amount), // 1pt per $1
  review_left: 25,
  photo_uploaded: 15,
  referral: 200,
  repeat_booking: 50,
  signup_bonus: 100,
}

const tierMultipliers: Record<string, number> = {
  bronze: 1,
  silver: 1.25,
  gold: 1.5,
  platinum: 2,
}

function getTier(lifetimePoints: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (lifetimePoints >= 10000) return 'platinum'
  if (lifetimePoints >= 5000) return 'gold'
  if (lifetimePoints >= 1000) return 'silver'
  return 'bronze'
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventType, referenceId, amount = 0 } = await req.json()

    if (!eventType || !eventPointValues[eventType]) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('drive_points, lifetime_drive_points')
      .eq('id', user.id)
      .single()

    const currentPoints = profile?.drive_points || 0
    const lifetimePoints = profile?.lifetime_drive_points || 0
    const tier = getTier(lifetimePoints)
    const multiplier = tierMultipliers[tier]

    // Calculate base points
    const pointConfig = eventPointValues[eventType]
    const basePoints = typeof pointConfig === 'function' ? pointConfig(amount) : pointConfig
    
    // Apply tier multiplier
    const pointsEarned = Math.floor(basePoints * multiplier)
    const newBalance = currentPoints + pointsEarned
    const newLifetimePoints = lifetimePoints + pointsEarned
    const newTier = getTier(newLifetimePoints)

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        drive_points: newBalance,
        lifetime_drive_points: newLifetimePoints,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[Rewards Earn] Update error:', updateError)
      // Continue anyway - might be missing columns
    }

    // Log transaction
    await supabase.from('drive_points_history').insert({
      user_id: user.id,
      event_type: eventType,
      reference_id: referenceId || null,
      base_amount: basePoints,
      multiplier,
      points_earned: pointsEarned,
      balance_after: newBalance,
      description: getEventDescription(eventType, referenceId),
    })

    // Check for tier upgrade notification
    if (newTier !== tier) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'tier_upgrade',
        title: `Welcome to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)}!`,
        message: `Congratulations! You've been upgraded to ${newTier} tier with DrivePoints!`,
        data: { oldTier: tier, newTier },
      })
    }

    return NextResponse.json({
      pointsEarned,
      newBalance,
      newTier,
      tierUpgraded: newTier !== tier,
    })
  } catch (error) {
    console.error('[Rewards Earn] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getEventDescription(eventType: string, referenceId?: string): string {
  const descriptions: Record<string, string> = {
    rental_completed: `Completed rental${referenceId ? ` #${referenceId}` : ''}`,
    review_left: 'Left a review',
    photo_uploaded: 'Uploaded trip photos',
    referral: 'Referral bonus',
    repeat_booking: 'Repeat booking bonus',
    signup_bonus: 'Welcome bonus',
  }
  return descriptions[eventType] || 'Points earned'
}
