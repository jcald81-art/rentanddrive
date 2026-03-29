import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get host's vehicle IDs
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id')
      .eq('host_id', user.id)

    const vehicleIds = vehicles?.map(v => v.id) || []

    if (vehicleIds.length === 0) {
      return NextResponse.json({ trips: [] })
    }

    // Get recent trips for host's vehicles
    const { data: trips, error } = await supabase
      .from('bouncie_trips')
      .select(`
        id,
        vehicle_id,
        booking_id,
        start_time,
        end_time,
        distance_miles,
        avg_speed_mph,
        max_speed_mph,
        hard_brakes,
        hard_accelerations,
        driving_score,
        vehicle:vehicles (
          make,
          model,
          year
        ),
        booking:bookings (
          renter:users!bookings_renter_id_fkey (
            full_name
          )
        )
      `)
      .in('vehicle_id', vehicleIds)
      .order('start_time', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching trips:', error)
      return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
    }

    // Calculate incidents for each trip
    const tripsWithIncidents = trips?.map(trip => {
      let incidents = 0
      if ((trip.max_speed_mph || 0) > 90) incidents++
      if ((trip.hard_brakes || 0) > 5) incidents++
      if ((trip.hard_accelerations || 0) > 5) incidents++

      return {
        id: trip.id,
        vehicle_id: trip.vehicle_id,
        vehicle: trip.vehicle,
        renter_name: (trip.booking as any)?.renter?.full_name || null,
        start_time: trip.start_time,
        end_time: trip.end_time,
        distance_miles: trip.distance_miles || 0,
        avg_speed_mph: trip.avg_speed_mph || 0,
        max_speed_mph: trip.max_speed_mph || 0,
        hard_brakes: trip.hard_brakes || 0,
        driving_score: trip.driving_score || 85,
        incidents,
      }
    }) || []

    return NextResponse.json({ trips: tripsWithIncidents })
  } catch (error) {
    console.error('Host fleet trips error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
