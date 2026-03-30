import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const {
      rentalId,
      userType, // 'renter' | 'host'
      emojiRating, // 1-5 (😠=1, 😕=2, 😐=3, 😊=4, 😍=5)
      specificFeedback,
      openField,
      flagForReview,
      flagDetails,
    } = body

    // Validate required fields
    if (!rentalId || !userType || !emojiRating || !specificFeedback) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Save pulse response
    const { data: pulse, error: pulseError } = await supabase
      .from('pulse_responses')
      .insert({
        rental_id: rentalId,
        user_id: user.id,
        user_type: userType,
        emoji_rating: emojiRating,
        specific_feedback: specificFeedback,
        open_field: openField,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (pulseError) {
      console.error('Failed to save pulse:', pulseError)
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      )
    }

    // Flag rental for review if low score from renter
    if (userType === 'renter' && emojiRating <= 3) {
      await supabase.from('support_tickets').insert({
        type: 'low_pulse_score',
        priority: emojiRating === 1 ? 'high' : 'medium',
        rental_id: rentalId,
        user_id: user.id,
        title: `Low pulse score (${emojiRating}/5) from renter`,
        description: `Specific feedback: ${specificFeedback}\n${openField ? `Additional: ${openField}` : ''}`,
        status: 'open',
        created_at: new Date().toISOString(),
      })

      // Notify support
      await supabase.from('notifications').insert({
        user_id: process.env.SUPPORT_USER_ID || user.id,
        type: 'support_alert',
        title: 'Low Pulse Score Alert',
        message: `Rental ${rentalId} received a ${emojiRating}/5 rating. Review required.`,
        data: { rental_id: rentalId, pulse_id: pulse.id },
      })
    }

    // Create support ticket if host flagged for review
    if (userType === 'host' && flagForReview) {
      await supabase.from('support_tickets').insert({
        type: specificFeedback === 'needs_attention' ? 'host_flag_urgent' : 'host_flag_minor',
        priority: specificFeedback === 'needs_attention' ? 'high' : 'low',
        rental_id: rentalId,
        user_id: user.id,
        title: `Host flagged rental: ${specificFeedback}`,
        description: flagDetails || 'No additional details provided',
        status: 'open',
        created_at: new Date().toISOString(),
      })
    }

    // Update DriveCoach aggregate (for AI coaching insights)
    // This would be aggregated in a background job, here we just log the score
    await supabase.from('drivecoach_data').insert({
      rental_id: rentalId,
      user_id: user.id,
      user_type: userType,
      pulse_score: emojiRating,
      pulse_category: specificFeedback,
      created_at: new Date().toISOString(),
    }).catch(() => {
      // Table might not exist yet, that's ok
    })

    // Determine if we should prompt for full review
    // Only prompt if score is 4 or 5
    const promptFullReview = emojiRating >= 4

    return NextResponse.json({
      saved: true,
      promptFullReview,
      pulseId: pulse.id,
    })
  } catch (error) {
    console.error('Pulse submit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
