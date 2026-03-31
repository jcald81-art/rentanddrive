import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-uber-signature') || ''

  // Verify webhook signature
  const expected = crypto
    .createHmac('sha256', process.env.UBER_WEBHOOK_SECRET || '')
    .update(rawBody)
    .digest('hex')

  if (signature !== `sha256=${expected}`) {
    console.error('Uber webhook: Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    const event = JSON.parse(rawBody)
    const { event_type, data } = event

    console.log(`Uber webhook: ${event_type}`, data?.id)

    // Update mobility request status
    if (data?.id) {
      await supabase
        .from('mobility_requests')
        .update({
          status: data.status,
          updated_at: new Date().toISOString(),
          ...(data.tracking_url && { tracking_url: data.tracking_url }),
          ...(data.courier && { courier_data: data.courier }),
        })
        .eq('external_id', data.id)
    }

    // Handle specific events
    switch (event_type) {
      case 'delivery.status.changed': {
        if (data.status === 'delivered') {
          // Get booking from external_id
          const { data: mobility } = await supabase
            .from('mobility_requests')
            .select('booking_id')
            .eq('external_id', data.id)
            .single()

          if (mobility) {
            // Notify renter via Beacon
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/agent`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                task: 'communications',
                message: `Notify renter their RAD vehicle keys have been delivered. Booking: ${mobility.booking_id}`,
                context: { booking_id: mobility.booking_id },
              }),
            })
          }
        }
        break
      }

      case 'delivery.status.changed.canceled': {
        const { data: mobility } = await supabase
          .from('mobility_requests')
          .select('booking_id')
          .eq('external_id', data.id)
          .single()

        if (mobility) {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task: 'communications',
              message: `Alert renter that their Uber vehicle delivery was cancelled. Need to rebook or arrange alternative pickup. Booking: ${mobility.booking_id}`,
              context: { booking_id: mobility.booking_id },
            }),
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Uber webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
