import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const {
      rentalId,
      disputeType,
      description,
      incidentDate,
      incidentTime,
      desiredOutcome,
      refundAmount,
      evidenceCount,
    } = body

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate reference number: RAD-D-YYYYMMDD-XXXX
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const referenceNumber = `RAD-D-${dateStr}-${randomSuffix}`

    // Get rental details to find other party
    const { data: rental } = await supabase
      .from('bookings')
      .select('id, renter_id, vehicle_id, vehicles(host_id)')
      .eq('id', rentalId)
      .single()

    const isRenter = rental?.renter_id === user.id
    const otherPartyId = isRenter 
      ? (rental?.vehicles as any)?.host_id 
      : rental?.renter_id

    // Create dispute record
    const { data: dispute, error } = await supabase
      .from('disputes')
      .insert({
        reference_number: referenceNumber,
        rental_id: rentalId,
        opener_id: user.id,
        opener_type: isRenter ? 'renter' : 'host',
        respondent_id: otherPartyId,
        dispute_type: disputeType,
        opener_statement: description,
        incident_date: incidentDate,
        incident_time: incidentTime,
        desired_outcome: desiredOutcome,
        refund_amount: refundAmount,
        evidence_count: evidenceCount,
        status: 'opened',
        response_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create dispute:', error)
      return NextResponse.json({ error: 'Failed to create dispute' }, { status: 500 })
    }

    // Create timeline event
    await supabase.from('dispute_timeline').insert({
      dispute_id: dispute.id,
      actor: isRenter ? 'renter' : 'host',
      action: 'Opened dispute',
      details: `Type: ${disputeType}`,
      created_at: new Date().toISOString(),
    })

    // Notify other party
    if (otherPartyId) {
      await supabase.from('notifications').insert({
        user_id: otherPartyId,
        type: 'dispute_opened',
        title: 'New Dispute Filed',
        message: `A dispute has been opened for your recent rental. You have 48 hours to respond.`,
        data: { dispute_id: dispute.id, reference_number: referenceNumber },
      })

      // Also add timeline event for notification
      await supabase.from('dispute_timeline').insert({
        dispute_id: dispute.id,
        actor: 'admin',
        action: 'Notified other party',
        details: '48-hour response timer started',
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      disputeId: dispute.id,
      referenceNumber,
    })
  } catch (error) {
    console.error('Dispute create error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
