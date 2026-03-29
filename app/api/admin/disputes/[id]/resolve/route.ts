import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { resolution, refund_amount, admin_note } = await request.json()

  // Get booking details
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, payment_intent_id, total_amount, renter_id, host_id')
    .eq('id', id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  let refundedAmount = 0

  // Process refund based on resolution
  if (booking.payment_intent_id) {
    try {
      if (resolution === 'refund_renter') {
        // Full refund to renter
        await stripe.refunds.create({
          payment_intent: booking.payment_intent_id,
        })
        refundedAmount = booking.total_amount
      } else if (resolution === 'split' && refund_amount) {
        // Partial refund
        await stripe.refunds.create({
          payment_intent: booking.payment_intent_id,
          amount: Math.round(refund_amount * 100), // Convert to cents
        })
        refundedAmount = refund_amount
      }
      // 'pay_host' - no refund, host gets full amount
    } catch (stripeError) {
      console.error('Stripe refund error:', stripeError)
      // Continue with status update even if refund fails
    }
  }

  // Update booking status
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'resolved',
      resolution_type: resolution,
      refund_amount: refundedAmount,
      admin_notes: admin_note,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify both parties
  const resolutionMessage = resolution === 'refund_renter' 
    ? 'Full refund issued to renter'
    : resolution === 'pay_host'
    ? 'Host will receive full payment'
    : `Partial refund of $${refundedAmount.toFixed(2)} issued to renter`

  await supabase.from('notifications').insert([
    {
      user_id: booking.renter_id,
      type: 'dispute_resolved',
      title: 'Dispute Resolved',
      message: `Your dispute has been resolved. ${resolutionMessage}`,
      data: { booking_id: id },
    },
    {
      user_id: booking.host_id,
      type: 'dispute_resolved',
      title: 'Dispute Resolved',
      message: `A dispute for your booking has been resolved. ${resolutionMessage}`,
      data: { booking_id: id },
    },
  ])

  return NextResponse.json({ success: true, refunded_amount: refundedAmount })
}
