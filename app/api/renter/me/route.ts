import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Return default data for unauthenticated users
      return NextResponse.json({
        roadScore: 85,
        unreadNotifications: 0,
        rank: 'Guest',
      })
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Fetch unread notifications count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false)

    // Calculate Road Score from driving data
    let roadScore = 85 // Default
    const { data: drivingScores } = await supabase
      .from('driving_scores')
      .select('overall_score')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (drivingScores && drivingScores.length > 0) {
      roadScore = Math.round(
        drivingScores.reduce((sum, s) => sum + s.overall_score, 0) / drivingScores.length
      )
    }

    // Determine rank based on road score
    let rank = 'New Driver'
    if (roadScore >= 95) rank = 'Ambassador'
    else if (roadScore >= 85) rank = 'Elite'
    else if (roadScore >= 70) rank = 'Trusted'

    return NextResponse.json({
      roadScore,
      unreadNotifications: unreadCount || 0,
      rank,
      name: profile?.full_name || 'Adventurer',
      avatar: profile?.avatar_url,
    })
  } catch (error) {
    console.error('Error fetching RR data:', error)
    return NextResponse.json({
      roadScore: 85,
      unreadNotifications: 0,
      rank: 'Trusted',
    })
  }
}
