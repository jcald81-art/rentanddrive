import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SYSTEM_PROMPT = `You are the Review & Reputation agent for Rent and Drive LLC, a premium car rental service in Reno/Lake Tahoe Nevada.

Your responsibilities:
1. Analyze customer review sentiment (score 0-100, where 100 is most positive)
2. Extract key themes and keywords from reviews
3. Draft professional, warm responses for the host
4. Flag urgent issues that need immediate attention (safety, damage, theft, harassment)
5. Identify patterns across multiple reviews

Response format (JSON only):
{
  "sentiment_score": 0-100,
  "keywords": ["keyword1", "keyword2", ...],
  "suggested_response": "Response text for host to post",
  "requires_attention": true/false,
  "attention_reason": "Only if requires_attention is true",
  "category": "positive|neutral|negative|critical"
}

Guidelines:
- Keep responses under 200 characters
- Be warm but professional
- Thank the reviewer by name if available
- Address specific points they mentioned
- For negative reviews, apologize and offer to make it right
- Flag CRITICAL: any mention of safety issues, vehicle problems during trip, accidents, harassment`

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { review_id } = await request.json()

    if (!review_id) {
      return NextResponse.json({ error: 'review_id is required' }, { status: 400 })
    }

    // Fetch the review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select(`
        *,
        booking:bookings(
          id,
          vehicle:vehicles(make, model, year),
          renter:profiles(full_name)
        )
      `)
      .eq('id', review_id)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Check if already analyzed
    const { data: existing } = await supabase
      .from('review_analysis')
      .select('id')
      .eq('review_id', review_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Review already analyzed', analysis_id: existing.id }, { status: 409 })
    }

    // Prepare context for Claude
    const vehicleInfo = review.booking?.vehicle 
      ? `${review.booking.vehicle.year} ${review.booking.vehicle.make} ${review.booking.vehicle.model}`
      : 'Unknown vehicle'
    
    const renterName = review.booking?.renter?.full_name || 'Anonymous'

    const prompt = `Analyze this review for a ${vehicleInfo} rental:

Reviewer: ${renterName}
Rating: ${review.rating}/5 stars
Review Text: "${review.content}"

Provide your analysis as JSON.`

    // Call Claude
    const result = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: SYSTEM_PROMPT,
      prompt,
      maxOutputTokens: 500,
    })

    const tokensUsed = result.usage?.totalTokens || 0
    const costCents = Math.ceil(tokensUsed * 0.003 * 100) // Approximate cost

    // Parse response
    let analysis
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch {
      analysis = {
        sentiment_score: review.rating * 20,
        keywords: [],
        suggested_response: 'Thank you for your feedback!',
        requires_attention: false,
        category: review.rating >= 4 ? 'positive' : review.rating >= 3 ? 'neutral' : 'negative'
      }
    }

    // Save to review_analysis
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('review_analysis')
      .insert({
        review_id,
        sentiment_score: analysis.sentiment_score,
        keywords: analysis.keywords || [],
        suggested_response: analysis.suggested_response,
        requires_attention: analysis.requires_attention || false,
        response_sent: false,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save analysis:', saveError)
    }

    // Log to agent_logs
    await supabase.from('agent_logs').insert({
      agent_name: 'reviews',
      action_type: 'analyze_review',
      input_data: { review_id, rating: review.rating, content_preview: review.content?.substring(0, 100) },
      output_data: analysis,
      model_used: 'claude-sonnet-4-20250514',
      tokens_used: tokensUsed,
      cost_cents: costCents,
      status: 'success',
    })

    // If requires attention, send alert email
    if (analysis.requires_attention && process.env.SENDGRID_API_KEY) {
      await sendUrgentReviewAlert(review, analysis, vehicleInfo)
    }

    return NextResponse.json({
      success: true,
      analysis_id: savedAnalysis?.id,
      sentiment_score: analysis.sentiment_score,
      category: analysis.category,
      keywords: analysis.keywords,
      suggested_response: analysis.suggested_response,
      requires_attention: analysis.requires_attention,
      attention_reason: analysis.attention_reason,
      processing_time_ms: Date.now() - startTime,
    })

  } catch (error) {
    console.error('Review analysis error:', error)
    
    await supabase.from('agent_logs').insert({
      agent_name: 'reviews',
      action_type: 'analyze_review',
      input_data: { error: String(error) },
      output_data: null,
      model_used: 'claude-sonnet-4-20250514',
      tokens_used: 0,
      cost_cents: 0,
      status: 'error',
    })

    return NextResponse.json({ error: 'Failed to analyze review' }, { status: 500 })
  }
}

// GET - Fetch analysis for a review
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reviewId = searchParams.get('review_id')

  if (!reviewId) {
    // Return all reviews needing attention
    const { data, error } = await supabase
      .from('review_analysis')
      .select('*, review:reviews(*)')
      .eq('requires_attention', true)
      .eq('response_sent', false)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    return NextResponse.json({ reviews_needing_attention: data })
  }

  const { data, error } = await supabase
    .from('review_analysis')
    .select('*')
    .eq('review_id', reviewId)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

async function sendUrgentReviewAlert(review: any, analysis: any, vehicleInfo: string) {
  if (!process.env.SENDGRID_API_KEY) return

  const sgMail = await import('@sendgrid/mail')
  sgMail.default.setApiKey(process.env.SENDGRID_API_KEY)

  await sgMail.default.send({
    to: 'joe@rentanddrive.net',
    from: process.env.SENDGRID_FROM_EMAIL || 'alerts@rentanddrive.net',
    subject: `[URGENT] Review Requires Attention - ${vehicleInfo}`,
    html: `
      <h2>Urgent Review Alert</h2>
      <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
      <p><strong>Rating:</strong> ${review.rating}/5 stars</p>
      <p><strong>Sentiment Score:</strong> ${analysis.sentiment_score}/100</p>
      <p><strong>Reason for Alert:</strong> ${analysis.attention_reason || 'Flagged as critical'}</p>
      <hr>
      <p><strong>Review Content:</strong></p>
      <blockquote>${review.content}</blockquote>
      <hr>
      <p><strong>Suggested Response:</strong></p>
      <p>${analysis.suggested_response}</p>
      <p><a href="https://rentanddrive.net/dashboard/reviews/${review.id}">View in Dashboard</a></p>
    `,
  })
}
