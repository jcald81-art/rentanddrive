import { routeAIRequest } from '@/lib/ai-router'
import { createClient } from '@/lib/supabase/server'

const AGENT_NAME = 'Shield'

interface ReviewAnalysis {
  reviewId: string
  sentiment: number // 0-1
  keywords: string[]
  suggestedResponse: string
  requiresAttention: boolean
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  topics: string[]
}

interface RenterScore {
  renterId: string
  score: number // 0-100
  totalTrips: number
  avgSpeed: number
  hardBrakingEvents: number
  speedViolations: number
  curfewViolations: number
  isFlagged: boolean
  flagReason?: string
}

// Analyze a single review
export async function analyzeReview(reviewId: string): Promise<ReviewAnalysis> {
  const supabase = await createClient()

  const { data: review } = await supabase
    .from('reviews')
    .select(`
      *,
      bookings(
        vehicles(make, model, year, host_id),
        profiles:renter_id(full_name)
      )
    `)
    .eq('id', reviewId)
    .single()

  if (!review) throw new Error('Review not found')

  const systemPrompt = `You are Shield, the reputation AI for Rent and Drive car rental platform.
Analyze reviews for sentiment, extract key topics, and generate appropriate host responses.
Be alert for:
- Safety concerns (requires_attention: true, urgency: high/critical)
- Cleanliness issues
- Mechanical problems
- Host communication issues
- Positive highlights to celebrate

Return JSON only:
{
  "sentiment": 0.0-1.0,
  "keywords": ["array", "of", "key", "terms"],
  "suggestedResponse": "Under 100 words, professional and warm",
  "requiresAttention": boolean,
  "urgencyLevel": "low|medium|high|critical",
  "topics": ["cleanliness", "communication", "vehicle_condition", etc]
}`

  const prompt = `Analyze this review:

Vehicle: ${review.bookings?.vehicles?.year} ${review.bookings?.vehicles?.make} ${review.bookings?.vehicles?.model}
Rating: ${review.rating}/5 stars
Review text: "${review.comment}"
Reviewer: ${review.bookings?.profiles?.full_name || 'Anonymous'}`

  const result = await routeAIRequest({
    taskType: 'reviews',
    agentName: AGENT_NAME,
    actionType: 'analyze_review',
    system: systemPrompt,
    prompt,
    maxTokens: 512,
  })

  try {
    const parsed = JSON.parse(result.text.replace(/```json\n?|\n?```/g, ''))
    
    const analysis: ReviewAnalysis = {
      reviewId,
      sentiment: Math.min(1, Math.max(0, parsed.sentiment)),
      keywords: parsed.keywords || [],
      suggestedResponse: parsed.suggestedResponse || '',
      requiresAttention: parsed.requiresAttention || false,
      urgencyLevel: parsed.urgencyLevel || 'low',
      topics: parsed.topics || [],
    }

    // Save analysis to database
    await supabase.from('review_analysis').insert({
      review_id: reviewId,
      sentiment_score: analysis.sentiment,
      keywords: analysis.keywords,
      suggested_response: analysis.suggestedResponse,
      requires_attention: analysis.requiresAttention,
      urgency_level: analysis.urgencyLevel,
      topics: analysis.topics,
      analyzed_by: 'shield_agent',
    })

    // If requires attention, notify host
    if (analysis.requiresAttention) {
      const hostId = review.bookings?.vehicles?.host_id
      if (hostId) {
        // Send urgent email
        if (process.env.SENDGRID_API_KEY && analysis.urgencyLevel !== 'low') {
          const { data: host } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', hostId)
            .single()

          if (host?.email) {
            await fetch('https://api.sendgrid.com/v3/mail/send', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                personalizations: [{ to: [{ email: host.email }] }],
                from: { email: process.env.SENDGRID_FROM_EMAIL || 'shield@rentanddrive.net', name: 'Shield | R&D Intelligence' },
                subject: `[${analysis.urgencyLevel.toUpperCase()}] Review Requires Attention`,
                content: [{
                  type: 'text/html',
                  value: `
                    <h2>Review Alert</h2>
                    <p>A new review on your ${review.bookings?.vehicles?.year} ${review.bookings?.vehicles?.make} ${review.bookings?.vehicles?.model} requires attention.</p>
                    <p><strong>Rating:</strong> ${review.rating}/5</p>
                    <p><strong>Review:</strong> "${review.comment}"</p>
                    <p><strong>Key Topics:</strong> ${analysis.topics.join(', ')}</p>
                    <p><strong>Suggested Response:</strong></p>
                    <blockquote>${analysis.suggestedResponse}</blockquote>
                    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/host/reviews">View in Dashboard</a></p>
                  `,
                }],
              }),
            })
          }
        }

        // Create notification
        await supabase.from('notifications').insert({
          user_id: hostId,
          type: 'review_alert',
          title: `Review Alert: ${analysis.urgencyLevel}`,
          message: `New ${review.rating}-star review needs attention. Topics: ${analysis.topics.join(', ')}`,
          priority: analysis.urgencyLevel === 'critical' ? 'high' : 'normal',
          data: { reviewId, analysis },
        })
      }
    }

    return analysis
  } catch (error) {
    console.error('[Shield] Failed to parse analysis:', error)
    return {
      reviewId,
      sentiment: review.rating / 5,
      keywords: [],
      suggestedResponse: 'Thank you for your review!',
      requiresAttention: review.rating <= 2,
      urgencyLevel: review.rating <= 2 ? 'medium' : 'low',
      topics: [],
    }
  }
}

// Analyze all new reviews (called by cron)
export async function analyzeNewReviews(): Promise<{ analyzed: number; flagged: number }> {
  const supabase = await createClient()
  let analyzed = 0, flagged = 0

  // Get reviews without analysis
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id')
    .is('analyzed_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  for (const review of reviews || []) {
    try {
      const analysis = await analyzeReview(review.id)
      await supabase.from('reviews').update({ analyzed_at: new Date().toISOString() }).eq('id', review.id)
      analyzed++
      if (analysis.requiresAttention) flagged++
    } catch (error) {
      console.error(`[Shield] Failed to analyze review ${review.id}:`, error)
    }
    await new Promise(r => setTimeout(r, 200)) // Rate limit
  }

  return { analyzed, flagged }
}

// Calculate renter road score from Bouncie data
export async function calculateRenterScore(renterId: string): Promise<RenterScore> {
  const supabase = await createClient()

  // Get all trips for this renter
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id,
      trip_records(
        total_miles,
        avg_speed_mph,
        max_speed_mph,
        hard_braking_count,
        hard_acceleration_count,
        idle_time_minutes
      )
    `)
    .eq('renter_id', renterId)
    .eq('status', 'completed')

  if (!bookings || bookings.length === 0) {
    return {
      renterId,
      score: 100, // New renters start at 100
      totalTrips: 0,
      avgSpeed: 0,
      hardBrakingEvents: 0,
      speedViolations: 0,
      curfewViolations: 0,
      isFlagged: false,
    }
  }

  // Aggregate metrics
  let totalHardBraking = 0
  let totalSpeedViolations = 0
  let avgSpeedSum = 0
  let tripCount = 0

  for (const booking of bookings) {
    const trips = booking.trip_records as any[]
    for (const trip of trips || []) {
      totalHardBraking += trip.hard_braking_count || 0
      if (trip.max_speed_mph > 85) totalSpeedViolations++
      avgSpeedSum += trip.avg_speed_mph || 0
      tripCount++
    }
  }

  const avgSpeed = tripCount > 0 ? avgSpeedSum / tripCount : 0

  // Get curfew violations
  const { count: curfewViolations } = await supabase
    .from('fleet_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('alert_type', 'curfew_violation')
    .in('booking_id', bookings.map(b => b.id))

  // Calculate score (100 max, deductions for bad behavior)
  let score = 100
  score -= totalHardBraking * 2 // -2 per hard brake
  score -= totalSpeedViolations * 5 // -5 per speed violation
  score -= (curfewViolations || 0) * 10 // -10 per curfew violation
  score = Math.max(0, Math.min(100, score))

  const isFlagged = score < 70
  let flagReason: string | undefined

  if (isFlagged) {
    const reasons: string[] = []
    if (totalSpeedViolations > 3) reasons.push('excessive speeding')
    if (totalHardBraking > 10) reasons.push('aggressive driving')
    if ((curfewViolations || 0) > 1) reasons.push('curfew violations')
    flagReason = reasons.join(', ')
  }

  // Update renter_road_scores table
  await supabase.from('renter_road_scores').upsert({
    renter_id: renterId,
    score,
    total_trips: bookings.length,
    avg_speed_mph: Math.round(avgSpeed),
    hard_braking_count: totalHardBraking,
    speed_violations: totalSpeedViolations,
    curfew_violations: curfewViolations || 0,
    is_flagged: isFlagged,
    flag_reason: flagReason,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'renter_id' })

  // Notify admin if flagged
  if (isFlagged) {
    await supabase.from('notifications').insert({
      user_id: process.env.ADMIN_USER_ID || renterId, // Notify admin or self
      type: 'renter_flagged',
      title: 'Renter Flagged',
      message: `Renter score dropped to ${score}. Reason: ${flagReason}`,
      priority: 'high',
      data: { renterId, score, flagReason },
    })
  }

  return {
    renterId,
    score,
    totalTrips: bookings.length,
    avgSpeed: Math.round(avgSpeed),
    hardBrakingEvents: totalHardBraking,
    speedViolations: totalSpeedViolations,
    curfewViolations: curfewViolations || 0,
    isFlagged,
    flagReason,
  }
}

// Update all renter scores (called by cron)
export async function updateAllRenterScores(): Promise<{ updated: number; flagged: number }> {
  const supabase = await createClient()
  let updated = 0, flagged = 0

  // Get all renters with completed trips
  const { data: renters } = await supabase
    .from('bookings')
    .select('renter_id')
    .eq('status', 'completed')

  const uniqueRenters = [...new Set((renters || []).map(r => r.renter_id))]

  for (const renterId of uniqueRenters) {
    try {
      const score = await calculateRenterScore(renterId)
      updated++
      if (score.isFlagged) flagged++
    } catch (error) {
      console.error(`[Shield] Failed to calculate score for ${renterId}:`, error)
    }
    await new Promise(r => setTimeout(r, 100))
  }

  return { updated, flagged }
}

// Analyze damage photos with Gemini
export async function analyzeDamagePhotos(
  claimId: string,
  photoUrls: string[]
): Promise<{
  damageDetected: boolean
  severity: 'none' | 'minor' | 'moderate' | 'severe'
  description: string
  estimatedCost: number | null
  locations: string[]
}> {
  const systemPrompt = `You are Shield, analyzing vehicle damage photos for insurance claims.
Assess damage severity and provide estimated repair costs based on typical rates.
Return JSON: {
  "damageDetected": boolean,
  "severity": "none|minor|moderate|severe",
  "description": "detailed description",
  "estimatedCost": number or null,
  "locations": ["front bumper", "driver door", etc]
}`

  // For now, analyze first photo (could loop through all)
  const result = await routeAIRequest({
    taskType: 'document_analysis',
    agentName: AGENT_NAME,
    actionType: 'analyze_damage_photos',
    system: systemPrompt,
    prompt: `Analyze this vehicle damage photo for insurance claim ${claimId}. Photo URL: ${photoUrls[0]}`,
    maxTokens: 512,
  })

  try {
    const parsed = JSON.parse(result.text.replace(/```json\n?|\n?```/g, ''))
    return {
      damageDetected: parsed.damageDetected || false,
      severity: parsed.severity || 'none',
      description: parsed.description || '',
      estimatedCost: parsed.estimatedCost || null,
      locations: parsed.locations || [],
    }
  } catch {
    return {
      damageDetected: false,
      severity: 'none',
      description: 'Unable to analyze photos',
      estimatedCost: null,
      locations: [],
    }
  }
}

// ── ShieldAgent class wrapper ──────────────────────────────────────────────────
export class ShieldAgent {
  async analyzeReview(reviewId: string) {
    return analyzeReview(reviewId)
  }
  async generateResponse(reviewId: string) {
    return analyzeReview(reviewId)
  }
  async scanHostReviews(_hostId: string) {
    return analyzeNewReviews()
  }
  async calculateRenterScore(renterId: string) {
    return calculateRenterScore(renterId)
  }
  async flagReview(reviewId: string, _reason: string) {
    return analyzeReview(reviewId)
  }
}
