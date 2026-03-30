import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ShieldAgent } from '@/lib/agents/shield'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, data } = body

    const agent = new ShieldAgent()
    let result

    switch (action) {
      case 'analyze_review':
        result = await agent.analyzeReview(data.reviewId)
        break
      case 'generate_response':
        result = await agent.generateResponse(data.reviewId)
        break
      case 'scan_host_reviews':
        result = await agent.scanHostReviews(data.hostId)
        break
      case 'calculate_renter_score':
        result = await agent.calculateRenterScore(data.renterId)
        break
      case 'flag_review':
        result = await agent.flagReview(data.reviewId, data.reason)
        break
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    // Log agent action
    await supabase.from('rd_agent_log').insert({
      agent_name: 'shield',
      action,
      input_data: data,
      output_data: result,
      status: result?.success ? 'success' : 'error',
      triggered_by: user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Shield API Error]:', error)
    return NextResponse.json(
      { error: 'Failed to execute Shield action' },
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

    // Get review analysis stats
    const { data: analyses } = await supabase
      .from('review_analysis')
      .select('*, reviews(rating, comment, created_at)')
      .order('created_at', { ascending: false })
      .limit(20)

    // Get flagged reviews
    const { data: flagged } = await supabase
      .from('reviews')
      .select('*, profiles:user_id(full_name)')
      .eq('is_flagged', true)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })

    // Get sentiment distribution
    const { data: sentimentData } = await supabase
      .from('review_analysis')
      .select('sentiment')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const sentimentCounts = {
      positive: sentimentData?.filter(r => r.sentiment >= 0.6).length || 0,
      neutral: sentimentData?.filter(r => r.sentiment >= 0.4 && r.sentiment < 0.6).length || 0,
      negative: sentimentData?.filter(r => r.sentiment < 0.4).length || 0,
    }

    return NextResponse.json({
      analyses,
      flagged,
      sentimentCounts,
    })
  } catch (error) {
    console.error('[Shield API Error]:', error)
    return NextResponse.json({ error: 'Failed to fetch Shield data' }, { status: 500 })
  }
}
