import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { disputeId, reason } = await req.json()

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

    // Determine priority based on amount at stake
    const amount = dispute.refund_amount || 0
    let priority = 'low'
    if (amount >= 500) priority = 'high'
    else if (amount >= 100) priority = 'medium'

    // Update dispute status
    await supabase
      .from('disputes')
      .update({
        status: 'escalated',
        escalated_at: new Date().toISOString(),
        escalated_by: user.id,
        escalation_reason: reason,
      })
      .eq('id', disputeId)

    // Create human review ticket
    await supabase.from('support_tickets').insert({
      type: 'dispute_escalation',
      priority,
      dispute_id: disputeId,
      user_id: user.id,
      title: `Escalated Dispute: ${dispute.reference_number}`,
      description: `Dispute type: ${dispute.dispute_type}\nAmount: $${amount}\nReason for escalation: ${reason || 'Party rejected AI resolution'}`,
      status: 'open',
      created_at: new Date().toISOString(),
    })

    // Add timeline event
    await supabase.from('dispute_timeline').insert({
      dispute_id: disputeId,
      actor: user.id === dispute.opener_id ? 
        (dispute.opener_type === 'renter' ? 'renter' : 'host') :
        (dispute.opener_type === 'renter' ? 'host' : 'renter'),
      action: 'Escalated to human review',
      details: reason || 'Rejected AI resolution',
      created_at: new Date().toISOString(),
    })

    // Notify both parties
    await supabase.from('notifications').insert([
      {
        user_id: dispute.opener_id,
        type: 'dispute_escalated',
        title: 'Dispute Escalated',
        message: 'This dispute has been escalated to a platform admin who will review within 24 business hours.',
        data: { dispute_id: disputeId },
      },
      {
        user_id: dispute.respondent_id,
        type: 'dispute_escalated',
        title: 'Dispute Escalated',
        message: 'This dispute has been escalated to a platform admin who will review within 24 business hours.',
        data: { dispute_id: disputeId },
      },
    ])

    return NextResponse.json({ 
      success: true,
      message: 'Dispute escalated to human review',
    })
  } catch (error) {
    console.error('Dispute escalate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
