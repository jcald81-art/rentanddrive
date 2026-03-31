import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Verify Lyft webhook token
  const token = req.headers.get('Authorization')
  if (token !== `Bearer ${process.env.LYFT_WEBHOOK_TOKEN}`) {
    console.error('Lyft webhook: Unauthorized')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const event = await req.json()
    const { event_type, ride_id, data } = event

    console.log(`Lyft webhook: ${event_type}`, ride_id)

    // Update mobility request
    if (ride_id) {
      await supabase
        .from('mobility_requests')
        .update({
          status: data?.status,
          updated_at: new Date().toISOString(),
          ...(data?.driver && { courier_data: data.driver }),
        })
        .eq('external_id', ride_id)
    }

    switch (event_type) {
      case 'rides.driver_arrival': {
        const { data: mobility } = await supabase
          .from('mobility_requests')
          .select('booking_id, type')
          .eq('external_id', ride_id)
          .single()

        if (mobility) {
          const msg = mobility.type === 'lyft_return_ride'
            ? 'Your Lyft is outside. Trip complete — thanks for going RAD.'
            : 'Your Lyft to your RAD vehicle has arrived.'

          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/agent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task: 'communications',
              message: `${msg} Booking: ${mobility.booking_id}`,
              context: { booking_id: mobility.booking_id },
            }),
          })
        }
        break
      }

      case 'rides.status_changed': {
        if (data?.status === 'droppedOff') {
          const { data: mobility } = await supabase
            .from('mobility_requests')
            .select('booking_id')
            .eq('external_id', ride_id)
            .single()

          if (mobility) {
            await supabase
              .from('mobility_requests')
              .update({ completed_at: new Date().toISOString() })
              .eq('external_id', ride_id)
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Lyft webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
