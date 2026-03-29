import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get host's vehicle IDs
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id')
      .eq('host_id', user.id)

    const vehicleIds = vehicles?.map(v => v.id) || []

    if (vehicleIds.length === 0) {
      return NextResponse.json({ scores: [] })
    }

    // Get all completed bookings for host's vehicles
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        renter_id,
        vehicle_id,
        renter:users!bookings_renter_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .in('vehicle_id', vehicleIds)
      .eq('status', 'completed')

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    // Get unique renters
    const renterMap = new Map<string, {
      user_id: string
      full_name: string
      avatar_url?: string
      bookingIds: string[]
    }>()

    bookings?.forEach(booking => {
      const renter = booking.renter as any
      if (!renter?.id) return

      if (renterMap.has(renter.id)) {
        renterMap.get(renter.id)!.bookingIds.push(booking.id)
      } else {
        renterMap.set(renter.id, {
          user_id: renter.id,
          full_name: renter.full_name || 'Unknown',
          avatar_url: renter.avatar_url,
          bookingIds: [booking.id],
        })
      }
    })

    // Get trip data for each renter's bookings
    const scores = await Promise.all(
      Array.from(renterMap.values()).map(async (renter) => {
        const { data: trips } = await supabase
          .from('bouncie_trips')
          .select('distance_miles, hard_brakes, driving_score, max_speed_mph')
          .in('booking_id', renter.bookingIds)

        const totalMiles = trips?.reduce((sum, t) => sum + (t.distance_miles || 0), 0) || 0
        const totalHardBrakes = trips?.reduce((sum, t) => sum + (t.hard_brakes || 0), 0) || 0
        const avgDrivingScore = trips?.length 
          ? trips.reduce((sum, t) => sum + (t.driving_score || 85), 0) / trips.length
          : 85
        const speedViolations = trips?.filter(t => (t.max_speed_mph || 0) > 85).length || 0

        // Check if renter is blocked by this host
        const { data: blocked } = await supabase
          .from('host_blocked_renters')
          .select('id')
          .eq('host_id', user.id)
          .eq('renter_id', renter.user_id)
          .single()

        return {
          user_id: renter.user_id,
          full_name: renter.full_name,
          avatar_url: renter.avatar_url,
          trips_count: renter.bookingIds.length,
          total_miles: Math.round(totalMiles),
          avg_driving_score: Math.round(avgDrivingScore),
          hard_brakes_per_100_miles: totalMiles > 0 
            ? Math.round((totalHardBrakes / totalMiles) * 100 * 10) / 10
            : 0,
          speed_violations: speedViolations,
          is_blocked: !!blocked,
        }
      })
    )

    // Sort by trips count descending
    scores.sort((a, b) => b.trips_count - a.trips_count)

    return NextResponse.json({ scores })
  } catch (error) {
    console.error('Host renter scores error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
