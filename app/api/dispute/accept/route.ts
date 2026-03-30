import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { disputeId } = await req.json()

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

    // Track who accepted
    const acceptedBy = dispute.accepted_by || []
    if (!acceptedBy.includes(user.id)) {
      acceptedBy.push(user.id)
    }

    // Check if both parties have accepted
    const bothAccepted = acceptedBy.includes(dispute.opener_id) && 
                         acceptedBy.includes(dispute.respondent_id)

    if (bothAccepted) {
      // Execute resolution
      const analysis = dispute.ai_analysis as any

      // If refund is part of recommendation, process it
      if (analysis?.recommendation?.toLowerCase().includes('refund')) {
        const refundMatch = analysis.recommendation.match(/\$(\d+(?:\.\d{2})?)/)?.[1]
        const refundAmount = refundMatch ? parseFloat(refundMatch) : 0

        if (refundAmount > 0) {
          // Get the booking to find the payment intent
          const { data: booking } = await supabase
            .from('bookings')
            .select('stripe_payment_intent_id')
            .eq('id', dispute.rental_id)
            .single()

          if (booking?.stripe_payment_intent_id) {
            try {
              await stripe.refunds.create({
                payment_intent: booking.stripe_payment_intent_id,
                amount: Math.round(refundAmount * 100),
                reason: 'requested_by_customer',
              })
            } catch (stripeError) {
              console.error('Stripe refund failed:', stripeError)
              // Continue anyway, log for manual processing
            }
          }
        }
      }

      // Update dispute as resolved
      await supabase
        .from('disputes')
        .update({
          accepted_by: acceptedBy,
          status: 'resolved',
          resolution: analysis.recommendation,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', disputeId)

      // Add timeline event
      await supabase.from('dispute_timeline').insert({
        dispute_id: disputeId,
        actor: 'admin',
        action: 'Dispute resolved',
        details: `Both parties accepted: ${analysis.recommendation}`,
        created_at: new Date().toISOString(),
      })

      // Notify both parties
      await supabase.from('notifications').insert([
        {
          user_id: dispute.opener_id,
          type: 'dispute_resolved',
          title: 'Dispute Resolved',
          message: `Your dispute has been resolved: ${analysis.recommendation}`,
          data: { dispute_id: disputeId },
        },
        {
          user_id: dispute.respondent_id,
          type: 'dispute_resolved',
          title: 'Dispute Resolved',
          message: `The dispute has been resolved: ${analysis.recommendation}`,
          data: { dispute_id: disputeId },
        },
      ])

      return NextResponse.json({ 
        success: true, 
        resolved: true,
        resolution: analysis.recommendation,
      })
    } else {
      // Just record acceptance, waiting for other party
      await supabase
        .from('disputes')
        .update({ accepted_by: acceptedBy })
        .eq('id', disputeId)

      // Add timeline event
      await supabase.from('dispute_timeline').insert({
        dispute_id: disputeId,
        actor: user.id === dispute.opener_id ? 
          (dispute.opener_type === 'renter' ? 'renter' : 'host') :
          (dispute.opener_type === 'renter' ? 'host' : 'renter'),
        action: 'Accepted AI resolution',
        details: 'Waiting for other party',
        created_at: new Date().toISOString(),
      })

      return NextResponse.json({ 
        success: true, 
        resolved: false,
        message: 'Waiting for other party to accept',
      })
    }
  } catch (error) {
    console.error('Dispute accept error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
