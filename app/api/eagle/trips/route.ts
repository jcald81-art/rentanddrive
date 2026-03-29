import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BouncieClient } from '@/lib/eagle/bouncie'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    const bookingId = searchParams.get('bookingId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
      .from('trip_records')
      .select(`
        *,
        vehicles(make, model, year, license_plate),
        bookings(id, renter:profiles!bookings_renter_id_fkey(full_name))
      `)
      .order('start_time', { ascending: false })

    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId)
    }

    if (bookingId) {
      query = query.eq('booking_id', bookingId)
    }

    if (startDate) {
      query = query.gte('start_time', startDate)
    }

    if (endDate) {
      query = query.lte('end_time', endDate)
    }

    // Check authorization
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      // Get user's vehicle IDs
      const { data: userVehicles } = await supabase
        .from('vehicles')
        .select('id')
        .eq('host_id', user.id)

      const vehicleIds = userVehicles?.map(v => v.id) || []
      if (vehicleIds.length > 0) {
        query = query.in('vehicle_id', vehicleIds)
      } else {
        // Check if user has bookings
        query = query.eq('renter_id', user.id)
      }
    }

    const { data: trips, error } = await query.limit(100)

    if (error) throw error

    // Calculate aggregate stats
    const stats = {
      totalTrips: trips?.length || 0,
      totalMiles: trips?.reduce((sum, t) => sum + (t.distance_miles || 0), 0) || 0,
      totalDuration: trips?.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) || 0,
      avgDrivingScore: trips?.length 
        ? trips.reduce((sum, t) => sum + (t.driving_score || 0), 0) / trips.length 
        : 0,
      hardBrakes: trips?.reduce((sum, t) => sum + (t.hard_brakes || 0), 0) || 0,
      rapidAccels: trips?.reduce((sum, t) => sum + (t.rapid_accels || 0), 0) || 0,
    }

    return NextResponse.json({ 
      trips,
      stats,
    })
  } catch (error) {
    console.error('[Eagle Trips Error]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    )
  }
}
