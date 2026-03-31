import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  handleBookingConfirmed,
  handleTripStarted,
  handleTripEnded,
} from '@/lib/mobility/mobility-orchestrator'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { booking_id, trigger } = await req.json()

    if (!booking_id || !trigger) {
      return NextResponse.json(
        { error: 'Missing required fields: booking_id, trigger' },
        { status: 400 }
      )
    }

    switch (trigger) {
      case 'booking_confirmed':
        await handleBookingConfirmed(booking_id)
        break
      case 'trip_started':
        await handleTripStarted(booking_id)
        break
      case 'trip_ended':
        await handleTripEnded(booking_id)
        break
      default:
        return NextResponse.json({ error: 'Invalid trigger' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mobility dispatch error:', error)
    return NextResponse.json(
      { error: 'Failed to dispatch mobility service' },
      { status: 500 }
    )
  }
}
