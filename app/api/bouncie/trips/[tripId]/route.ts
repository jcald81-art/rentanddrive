import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/bouncie/trips/[tripId] - Get detailed trip data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params

    // Get the trip
    const { data: trip, error: tripError } = await supabase
      .from('bouncie_trips')
      .select(`
        *,
        vehicles (
          id,
          make,
          model,
          year,
          license_plate
        )
      `)
      .eq('id', tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Get location history for this trip
    const { data: locations } = await supabase
      .from('bouncie_locations')
      .select('lat, lng, speed_mph, heading, recorded_at')
      .eq('vehicle_id', trip.vehicle_id)
      .gte('recorded_at', trip.start_time)
      .lte('recorded_at', trip.end_time || new Date().toISOString())
      .order('recorded_at', { ascending: true })

    // Get any alerts during this trip
    const { data: alerts } = await supabase
      .from('bouncie_alerts')
      .select('*')
      .eq('vehicle_id', trip.vehicle_id)
      .gte('created_at', trip.start_time)
      .lte('created_at', trip.end_time || new Date().toISOString())

    // Try to find linked booking
    let booking = null
    if (trip.booking_id) {
      const { data: bookingData } = await supabase
        .from('bookings')
        .select(`
          id,
          start_date,
          end_date,
          total_price,
          status,
          profiles:renter_id (
            full_name,
            email,
            phone
          )
        `)
        .eq('id', trip.booking_id)
        .single()
      
      booking = bookingData
    }

    return NextResponse.json({
      trip: {
        ...trip,
        locations: locations || [],
        alerts: alerts || [],
        booking,
        stats: {
          duration_minutes: trip.end_time 
            ? Math.round((new Date(trip.end_time).getTime() - new Date(trip.start_time).getTime()) / 60000)
            : null,
          avg_speed_mph: trip.avg_speed_mph,
          max_speed_mph: trip.max_speed_mph,
          distance_miles: trip.distance_miles,
          hard_brakes: trip.hard_brakes,
          hard_accelerations: trip.hard_accelerations,
          idle_time_minutes: trip.idle_time_minutes,
          fuel_used_gallons: trip.fuel_used_gallons,
        },
      },
    })
  } catch (error) {
    console.error('Trip detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
