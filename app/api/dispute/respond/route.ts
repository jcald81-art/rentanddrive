import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const { disputeId, statement, evidenceCount } = body

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get dispute
    const { data: dispute } = await supabase
      .from('disputes')
      .select('*')
      .eq('id', disputeId)
      .single()

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 })
    }

    // Verify user is the respondent
    if (dispute.respondent_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update dispute with response
    const { error: updateError } = await supabase
      .from('disputes')
      .update({
        respondent_statement: statement,
        respondent_evidence_count: evidenceCount,
        respondent_responded_at: new Date().toISOString(),
        status: 'responding',
      })
      .eq('id', disputeId)

    if (updateError) {
      console.error('Failed to update dispute:', updateError)
      return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 })
    }

    // Add timeline event
    const respondentType = dispute.opener_type === 'renter' ? 'host' : 'renter'
    await supabase.from('dispute_timeline').insert({
      dispute_id: disputeId,
      actor: respondentType,
      action: 'Submitted response',
      created_at: new Date().toISOString(),
    })

    // Both parties responded - trigger AI analysis
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    await fetch(`${baseUrl}/api/dispute/ai-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disputeId }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Dispute respond error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
