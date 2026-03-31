import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Runs every 5 minutes via Vercel Cron
// Dispatches scheduled rides that are due within 15 minutes
export async function GET() {
  try {
    const now = new Date()
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000)

    // Find pending scheduled rides due within 15 minutes
    const { data: pendingRides, error: fetchError } = await supabase
      .from('ride_dispatches')
      .select(`
        id,
        booking_id,
        renter_id,
        scheduled_at,
        delivery_type,
        bookings (
          id,
          vehicle_id,
          vehicles (
            location_lat,
            location_lng,
            location_city,
            location_state
          )
        ),
        profiles:renter_id (
          full_name,
          phone,
          address_lat,
          address_lng
        )
      `)
      .eq('status', 'pending')
      .not('scheduled_at', 'is', null)
      .lte('scheduled_at', fifteenMinutesFromNow.toISOString())
      .gte('scheduled_at', now.toISOString())

    if (fetchError) {
      console.error('[Cron] Failed to fetch scheduled rides:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch rides' }, { status: 500 })
    }

    if (!pendingRides || pendingRides.length === 0) {
      return NextResponse.json({ dispatched: 0, message: 'No rides due' })
    }

    let dispatched = 0
    const errors: string[] = []

    for (const ride of pendingRides) {
      try {
        // Skip if missing required data
        const booking = ride.bookings as unknown as {
          id: string
          vehicle_id: string
          vehicles: {
            location_lat: number
            location_lng: number
            location_city: string
            location_state: string
          }
        }
        const profile = ride.profiles as unknown as {
          full_name: string
          phone: string
          address_lat: number
          address_lng: number
        }

        if (!booking?.vehicles || !profile?.phone) {
          console.log(`[Cron] Skipping ride ${ride.id}: missing vehicle or renter data`)
          continue
        }

        // Dispatch the ride via internal API
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/lyft/dispatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_id: ride.booking_id,
            renter_phone: profile.phone,
            renter_name: profile.full_name || 'RAD Renter',
            pickup_lat: profile.address_lat,
            pickup_lng: profile.address_lng,
            dropoff_lat: booking.vehicles.location_lat,
            dropoff_lng: booking.vehicles.location_lng,
            vehicle_address: `${booking.vehicles.location_city}, ${booking.vehicles.location_state}`,
            // No scheduled_at = immediate dispatch
          }),
        })

        if (response.ok) {
          dispatched++
          console.log(`[Cron] Dispatched ride for booking ${ride.booking_id}`)
        } else {
          const errorData = await response.json()
          errors.push(`Ride ${ride.id}: ${errorData.error || 'Unknown error'}`)
        }
      } catch (err) {
        console.error(`[Cron] Error dispatching ride ${ride.id}:`, err)
        errors.push(`Ride ${ride.id}: ${(err as Error).message}`)
      }
    }

    return NextResponse.json({
      dispatched,
      total: pendingRides.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[Cron] dispatch-scheduled-rides error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
