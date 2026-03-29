import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get host's lab level
    const { data: labLevel } = await supabase
      .from('host_lab_levels')
      .select('*')
      .eq('host_id', user.id)
      .single()

    // Get all level definitions
    const { data: levelDefs } = await supabase
      .from('lab_level_definitions')
      .select('*')
      .order('level', { ascending: true })

    // Get current level and next level
    const currentLevelDef = levelDefs?.find(l => l.level === (labLevel?.current_level || 1))
    const nextLevelDef = levelDefs?.find(l => l.level === (labLevel?.current_level || 1) + 1)

    // Get weekly leaderboard
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const { data: leaderboard } = await supabase
      .from('host_leaderboard')
      .select(`
        *,
        host:profiles!host_leaderboard_host_id_fkey(full_name, avatar_url)
      `)
      .gte('week_start', startOfWeek.toISOString())
      .order('xp_earned', { ascending: false })
      .limit(10)

    // Get active challenges
    const { data: challenges } = await supabase
      .from('lab_challenges')
      .select('*')
      .eq('is_active', true)

    // Get host's challenge progress
    const { data: challengeProgress } = await supabase
      .from('host_challenge_progress')
      .select('*')
      .eq('host_id', user.id)

    // Get host's achievements/badges
    const { data: achievements } = await supabase
      .from('host_achievements')
      .select('*')
      .eq('host_id', user.id)

    // Get recent XP transactions
    const { data: xpHistory } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('host_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculate streak
    const { data: streakData } = await supabase
      .from('bookings')
      .select('created_at')
      .eq('host_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(30)

    // Simple streak calculation
    let streak = 0
    if (streakData && streakData.length > 0) {
      const today = new Date()
      let checkDate = new Date(today)
      
      for (const booking of streakData) {
        const bookingDate = new Date(booking.created_at)
        const dayDiff = Math.floor((checkDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (dayDiff <= 1) {
          streak++
          checkDate = bookingDate
        } else {
          break
        }
      }
    }

    // Build challenges with progress
    const challengesWithProgress = challenges?.map(challenge => {
      const progress = challengeProgress?.find(p => p.challenge_id === challenge.id)
      return {
        ...challenge,
        currentProgress: progress?.current_progress || 0,
        isCompleted: progress?.is_completed || false,
        completedAt: progress?.completed_at,
      }
    }) || []

    return NextResponse.json({
      labLevel: {
        level: labLevel?.current_level || 1,
        xp: labLevel?.current_xp || 0,
        totalXp: labLevel?.total_xp_earned || 0,
        title: currentLevelDef?.title || 'Rookie',
        nextLevel: nextLevelDef?.level,
        nextLevelXp: nextLevelDef?.xp_required,
        nextLevelTitle: nextLevelDef?.title,
      },
      leaderboard: leaderboard || [],
      challenges: challengesWithProgress,
      achievements: achievements || [],
      xpHistory: xpHistory || [],
      streak,
    })
  } catch (error) {
    console.error('Game room error:', error)
    return NextResponse.json({ error: 'Failed to fetch game data' }, { status: 500 })
  }
}
