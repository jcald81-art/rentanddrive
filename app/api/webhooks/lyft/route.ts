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

    // Update mobility request (legacy)
    if (ride_id) {
      await supabase
        .from('mobility_requests')
        .update({
          status: data?.status,
          updated_at: new Date().toISOString(),
          ...(data?.driver && { courier_data: data.driver }),
        })
        .eq('external_id', ride_id)

      // Also update ride_dispatches table (new system)
      await supabase
        .from('ride_dispatches')
        .update({
          status: data?.status,
          updated_at: new Date().toISOString(),
        })
        .eq('ride_id', ride_id)

      // Get dispatch to send notification
      const { data: dispatch } = await supabase
        .from('ride_dispatches')
        .select('booking_id, renter_id')
        .eq('ride_id', ride_id)
        .single()

      if (dispatch) {
        const messages: Record<string, string> = {
          'driver_accepted': 'Your Lyft driver is on the way to pick you up!',
          'driver_arrived': 'Your Lyft driver has arrived at your location.',
          'pickup': 'You\'re on your way to your RAD vehicle. Enjoy the ride!',
          'dropoff': 'You\'ve arrived at your vehicle. Safe travels!',
          'canceled': 'Your Lyft ride was canceled. Please book another ride.',
        }

        if (messages[data?.status]) {
          await supabase.from('notifications').insert({
            user_id: dispatch.renter_id,
            type: 'ride_update',
            title: 'Ride update',
            body: messages[data?.status],
            metadata: { ride_id, booking_id: dispatch.booking_id },
            read: false,
          })
        }
      }
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
