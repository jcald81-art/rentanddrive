import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { disputeId } = await req.json()

    // Get dispute with all related data
    const { data: dispute } = await supabase
      .from('disputes')
      .select(`
        *,
        rental:bookings(
          id,
          start_date,
          end_date,
          total_price,
          vehicle:vehicles(
            id,
            year,
            make,
            model,
            host_id
          )
        )
      `)
      .eq('id', disputeId)
      .single()

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    // Get Bouncie data for GPS evidence
    const { data: bouncieData } = await supabase
      .from('bouncie_locations')
      .select('*')
      .eq('vehicle_id', dispute.rental?.vehicle?.id)
      .gte('timestamp', dispute.rental?.start_date)
      .lte('timestamp', dispute.rental?.end_date)
      .order('timestamp', { ascending: false })
      .limit(10)

    // Get DriveShield inspection photos
    const { data: inspections } = await supabase
      .from('inspections')
      .select('*')
      .eq('rental_id', dispute.rental?.id)

    // Get message log
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('booking_id', dispute.rental?.id)
      .order('created_at', { ascending: true })
      .limit(20)

    // Build platform policy for this dispute type
    const policies: Record<string, string> = {
      late_return: 'Late returns incur $25/hour after 30-minute grace period. Host must document late return via app.',
      cleanliness: 'Vehicles must be returned in similar condition. Excessive cleaning fees capped at $150 unless documented evidence of major damage.',
      charge: 'Unauthorized charges require host documentation. Platform fee disputes handled separately.',
      listing: 'Listings must accurately represent vehicle. Major discrepancies may warrant partial refund.',
      mileage: 'Overage rates must be clearly stated in listing. GPS data is authoritative for disputes.',
    }

    const systemPrompt = `You are DriveMediate, a neutral AI mediator for rentanddrive.net, a peer-to-peer car rental platform.
Analyze this dispute fairly, referencing platform data as objective evidence.

Dispute context:
- Type: ${dispute.dispute_type}
- Renter claim: ${dispute.opener_type === 'renter' ? dispute.opener_statement : dispute.respondent_statement}
- Host claim: ${dispute.opener_type === 'host' ? dispute.opener_statement : dispute.respondent_statement}
- Bouncie GPS return time: ${bouncieData?.[0]?.timestamp || 'No GPS data available'}
- DriveShield pre-rental photos: ${inspections?.filter(i => i.type === 'pre').length || 0} photos
- DriveShield post-rental photos: ${inspections?.filter(i => i.type === 'post').length || 0} photos
- Message log summary: ${messages?.length || 0} messages exchanged
- Agreed rental terms: $${dispute.rental?.total_price} total, ${dispute.rental?.start_date} to ${dispute.rental?.end_date}
- Platform policy for this dispute type: ${policies[dispute.dispute_type] || 'Standard resolution process applies.'}
- Desired outcome requested: ${dispute.desired_outcome}${dispute.refund_amount ? ` ($${dispute.refund_amount})` : ''}

Provide:
1. Neutral summary of both positions
2. What objective platform data shows
3. Recommended resolution with specific dollar amount if applicable
4. Reasoning for recommendation
5. Confidence level: high/medium/low

Be fair. Reference only facts, not assumptions.
If insufficient evidence, say so clearly.
Respond in JSON only with this structure:
{
  "summary": "...",
  "platformData": "...",
  "recommendation": "...",
  "reasoning": "...",
  "confidence": "high|medium|low"
}`

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: systemPrompt }],
      }),
    })

    const aiResult = await response.json()
    const aiText = aiResult.content?.[0]?.text || '{}'
    
    let analysis
    try {
      analysis = JSON.parse(aiText)
    } catch {
      analysis = {
        summary: 'Unable to parse AI response',
        platformData: 'Analysis error',
        recommendation: 'Manual review required',
        reasoning: 'AI analysis encountered an error',
        confidence: 'low',
      }
    }

    // Update dispute with AI analysis
    await supabase
      .from('disputes')
      .update({
        ai_analysis: analysis,
        ai_analyzed_at: new Date().toISOString(),
        status: 'mediated',
      })
      .eq('id', disputeId)

    // Add timeline events
    await supabase.from('dispute_timeline').insert([
      {
        dispute_id: disputeId,
        actor: 'ai',
        action: 'AI analysis triggered',
        details: 'Both parties responded',
        created_at: new Date().toISOString(),
      },
      {
        dispute_id: disputeId,
        actor: 'ai',
        action: 'AI recommendation ready',
        details: `Confidence: ${analysis.confidence}`,
        created_at: new Date(Date.now() + 1000).toISOString(),
      },
    ])

    // Notify both parties
    await supabase.from('notifications').insert([
      {
        user_id: dispute.opener_id,
        type: 'dispute_ai_ready',
        title: 'DriveMediate AI Analysis Ready',
        message: 'Our AI has analyzed your dispute and provided a recommendation. Review and respond.',
        data: { dispute_id: disputeId },
      },
      {
        user_id: dispute.respondent_id,
        type: 'dispute_ai_ready',
        title: 'DriveMediate AI Analysis Ready',
        message: 'Our AI has analyzed the dispute and provided a recommendation. Review and respond.',
        data: { dispute_id: disputeId },
      },
    ])

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('AI analyze error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
