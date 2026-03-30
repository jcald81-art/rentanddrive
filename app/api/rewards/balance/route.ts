import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function getTier(lifetimePoints: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (lifetimePoints >= 10000) return 'platinum'
  if (lifetimePoints >= 5000) return 'gold'
  if (lifetimePoints >= 1000) return 'silver'
  return 'bronze'
}

function getNextTierInfo(tier: string): { name: string; threshold: number } | null {
  const tiers = {
    bronze: { next: 'silver', threshold: 1000 },
    silver: { next: 'gold', threshold: 5000 },
    gold: { next: 'platinum', threshold: 10000 },
    platinum: null,
  }
  const info = tiers[tier as keyof typeof tiers]
  if (!info) return null
  return { name: info.next, threshold: info.threshold }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get rewards balance from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('drive_points, lifetime_drive_points')
      .eq('id', user.id)
      .single()

    if (profileError) {
      // Return default values if no profile or columns don't exist
      return NextResponse.json({
        points: 0,
        lifetimePoints: 0,
        tier: 'bronze',
        nextTier: { name: 'silver', pointsNeeded: 1000 },
        pointsToNextTier: 1000,
        history: [],
      })
    }

    const points = profile?.drive_points || 0
    const lifetimePoints = profile?.lifetime_drive_points || 0
    const tier = getTier(lifetimePoints)
    const nextTierInfo = getNextTierInfo(tier)
    const pointsToNextTier = nextTierInfo ? nextTierInfo.threshold - lifetimePoints : 0

    // Get points history
    const { data: history } = await supabase
      .from('drive_points_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      points,
      lifetimePoints,
      tier,
      nextTier: nextTierInfo ? { name: nextTierInfo.name, pointsNeeded: nextTierInfo.threshold } : null,
      pointsToNextTier,
      history: history || [],
    })
  } catch (error) {
    console.error('[Rewards Balance] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
