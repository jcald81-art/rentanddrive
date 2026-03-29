import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const channel = searchParams.get('channel') || 'general'

    // Get community posts
    const { data: posts } = await supabase
      .from('community_posts')
      .select(`
        *,
        author:profiles!community_posts_author_id_fkey(id, full_name, avatar_url)
      `)
      .eq('channel', channel)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30)

    // Get post reactions
    const postIds = posts?.map(p => p.id) || []
    const { data: reactions } = await supabase
      .from('post_reactions')
      .select('*')
      .in('post_id', postIds)

    // Get online hosts count (active in last 5 min)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { count: onlineCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'host')
      .gte('last_active_at', fiveMinAgo)

    // Get host spotlight (featured host of the week)
    const { data: spotlight } = await supabase
      .from('host_spotlights')
      .select(`
        *,
        host:profiles!host_spotlights_host_id_fkey(full_name, avatar_url)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get today's SecureLink brief
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: dailyBrief } = await supabase
      .from('morning_briefs')
      .select('*')
      .eq('host_id', user.id)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Build posts with reaction counts
    const postsWithReactions = posts?.map(post => {
      const postReactions = reactions?.filter(r => r.post_id === post.id) || []
      const reactionCounts: Record<string, number> = {}
      postReactions.forEach(r => {
        reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1
      })
      const userReaction = postReactions.find(r => r.user_id === user.id)?.reaction_type

      return {
        ...post,
        reactionCounts,
        userReaction,
        totalReactions: postReactions.length,
      }
    }) || []

    return NextResponse.json({
      posts: postsWithReactions,
      onlineCount: onlineCount || 0,
      spotlight,
      dailyBrief,
      channels: ['general', 'reno', 'tahoe', 'sparks', 'tips', 'newbies'],
      currentChannel: channel,
    })
  } catch (error) {
    console.error('Community error:', error)
    return NextResponse.json({ error: 'Failed to fetch community' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, channel = 'general' } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content required' }, { status: 400 })
    }

    const { data: post, error } = await supabase
      .from('community_posts')
      .insert({
        author_id: user.id,
        content: content.trim(),
        channel,
      })
      .select(`
        *,
        author:profiles!community_posts_author_id_fkey(id, full_name, avatar_url)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
