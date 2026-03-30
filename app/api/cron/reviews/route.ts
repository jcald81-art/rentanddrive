import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Runs every 4 hours to analyze new reviews
export async function GET(request: NextRequest) {
  // Verify cron secret
  const headersList = await headers()
  const authHeader = headersList.get('authorization')
  
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const results = {
    reviews_found: 0,
    analyzed: 0,
    requires_attention: 0,
    errors: 0,
  }

  try {
    // Find reviews not yet analyzed (created in last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('id')
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false })

    if (error || !reviews) {
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    results.reviews_found = reviews.length

    // Check which haven't been analyzed
    for (const review of reviews) {
      const { data: existing } = await supabase
        .from('review_analysis')
        .select('id')
        .eq('review_id', review.id)
        .single()

      if (existing) continue // Already analyzed

      // Call the reviews agent
      try {
        const host = request.headers.get('host') || 'localhost:3000'
        const protocol = host.includes('localhost') ? 'http' : 'https'
        
        const response = await fetch(`${protocol}://${host}/api/agents/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ review_id: review.id }),
        })

        if (response.ok) {
          const data = await response.json()
          results.analyzed++
          if (data.requires_attention) {
            results.requires_attention++
          }
        } else {
          results.errors++
        }
      } catch (err) {
        console.error(`Failed to analyze review ${review.id}:`, err)
        results.errors++
      }

      // Rate limit: wait 1 second between API calls
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Log summary
    await supabase.from('agent_logs').insert({
      agent_name: 'reviews-cron',
      action_type: 'batch_analysis',
      input_data: { reviews_found: results.reviews_found },
      output_data: results,
      model_used: 'system',
      tokens_used: 0,
      cost_cents: 0,
      status: 'success',
    })

    return NextResponse.json({
      success: true,
      ...results,
      processing_time_ms: Date.now() - startTime,
    })

  } catch (error) {
    console.error('Reviews cron error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
