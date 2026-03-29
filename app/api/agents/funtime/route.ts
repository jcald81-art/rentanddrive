import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FuntimeAgent } from '@/lib/agents/funtime'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, data } = body

    const agent = new FuntimeAgent()
    let result

    switch (action) {
      case 'award_xp':
        result = await agent.awardXP(data.userId, data.amount, data.reason, data.source)
        break
      case 'check_level_up':
        result = await agent.checkLevelUp(data.userId)
        break
      case 'award_badge':
        result = await agent.awardBadge(data.userId, data.badgeType)
        break
      case 'update_leaderboard':
        result = await agent.updateLeaderboard()
        break
      case 'process_challenge':
        result = await agent.processChallengeProgress(data.userId, data.challengeId)
        break
      case 'vote_photo':
        result = await agent.voteOnPhoto(data.photoId, user.id)
        break
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    // Log agent action
    await supabase.from('rd_agent_log').insert({
      agent_name: 'funtime',
      action,
      input_data: data,
      output_data: result,
      status: result?.success ? 'success' : 'error',
      triggered_by: user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Funtime API Error]:', error)
    return NextResponse.json(
      { error: 'Failed to execute Funtime action' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get leaderboard
    const { data: leaderboard } = await supabase
      .from('host_leaderboard')
      .select('*, profiles:user_id(full_name, avatar_url)')
      .order('rank', { ascending: true })
      .limit(20)

    // Get active challenges
    const { data: challenges } = await supabase
      .from('lab_challenges')
      .select('*')
      .eq('is_active', true)
      .order('xp_reward', { ascending: false })

    // Get recent achievements
    const { data: achievements } = await supabase
      .from('host_achievements')
      .select('*, profiles:user_id(full_name)')
      .order('earned_at', { ascending: false })
      .limit(10)

    // Get photo contest entries
    const { data: photos } = await supabase
      .from('trip_photos')
      .select('*, profiles:user_id(full_name), photo_votes(count)')
      .eq('is_contest_entry', true)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      leaderboard,
      challenges,
      achievements,
      contestPhotos: photos,
    })
  } catch (error) {
    console.error('[Funtime API Error]:', error)
    return NextResponse.json({ error: 'Failed to fetch Funtime data' }, { status: 500 })
  }
}
