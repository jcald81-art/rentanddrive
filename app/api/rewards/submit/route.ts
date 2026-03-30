import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Reward amounts by post type (in cents)
const REWARD_AMOUNTS: Record<string, number> = {
  photo: 500,    // $5
  reel: 1000,    // $10
  video: 1500,   // $15
  story: 250,    // $2.50
  review: 1000,  // $10
}

// Estimated impressions multiplier based on follower count
function estimateReach(followerCount: number | null, postType: string): { impressions: number; reach: number } {
  const baseFollowers = followerCount || 500 // Default estimate
  
  // Engagement rates vary by post type
  const engagementRates: Record<string, number> = {
    photo: 0.05,   // 5% reach
    reel: 0.15,    // 15% reach (reels get more visibility)
    video: 0.10,   // 10% reach
    story: 0.08,   // 8% reach
    review: 0.05,
  }

  const rate = engagementRates[postType] || 0.05
  const reach = Math.round(baseFollowers * rate)
  const impressions = Math.round(reach * 1.5) // Impressions typically higher than reach

  return { impressions, reach }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { booking_id, platform, post_url, post_type, caption, follower_count } = body

    // Validate required fields
    if (!booking_id || !platform || !post_url || !post_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate platform
    const validPlatforms = ['instagram', 'tiktok', 'facebook', 'twitter', 'youtube']
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    // Validate post type
    const validPostTypes = ['photo', 'reel', 'video', 'story', 'review']
    if (!validPostTypes.includes(post_type)) {
      return NextResponse.json({ error: 'Invalid post type' }, { status: 400 })
    }

    // Validate URL format
    const urlPattern = /^https?:\/\/(www\.)?(instagram\.com|tiktok\.com|facebook\.com|fb\.watch|twitter\.com|x\.com|youtube\.com|youtu\.be)\/.+/i
    if (!urlPattern.test(post_url)) {
      return NextResponse.json({ error: 'Invalid social media URL' }, { status: 400 })
    }

    // Verify booking exists and belongs to user
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, renter_id')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.renter_id !== user.id) {
      return NextResponse.json({ error: 'This booking does not belong to you' }, { status: 403 })
    }

    if (booking.status !== 'completed') {
      return NextResponse.json({ error: 'Booking must be completed to claim rewards' }, { status: 400 })
    }

    // Check for existing submission for this booking + platform
    const { data: existingReward } = await supabase
      .from('social_rewards')
      .select('id')
      .eq('booking_id', booking_id)
      .eq('platform', platform)
      .single()

    if (existingReward) {
      return NextResponse.json({ error: 'You have already submitted a post for this platform on this booking' }, { status: 400 })
    }

    // Calculate reward amount and estimated reach
    const rewardAmountCents = REWARD_AMOUNTS[post_type] || 500
    const { impressions, reach } = estimateReach(follower_count, post_type)

    // Create reward submission
    const { data: reward, error: createError } = await supabase
      .from('social_rewards')
      .insert({
        booking_id,
        user_id: user.id,
        platform,
        post_url,
        post_type,
        caption,
        follower_count,
        reward_amount_cents: rewardAmountCents,
        estimated_impressions: impressions,
        estimated_reach: reach,
        status: 'pending',
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating reward:', createError)
      return NextResponse.json({ error: 'Failed to submit reward' }, { status: 500 })
    }

    // Notify admin (create notification)
    await supabase.from('notifications').insert({
      user_id: user.id, // Will be filtered for admin view
      type: 'new_social_reward',
      title: 'New Social Media Reward Submission',
      message: `${user.email} submitted a ${platform} ${post_type} for review.`,
      data: { reward_id: reward.id },
    })

    return NextResponse.json({ 
      success: true, 
      reward,
      message: 'Your submission has been received and will be reviewed within 24-48 hours.'
    })

  } catch (error) {
    console.error('Error submitting reward:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
