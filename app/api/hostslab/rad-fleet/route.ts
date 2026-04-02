import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get vehicles with telemetry
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select(`
        id, make, model, year, license_plate, status, thumbnail_url,
        bouncie_imei, pulse_health_score
      `)
      .eq('host_id', user.id)
      .eq('status', 'active')

    const vehicleIds = vehicles?.map(v => v.id) || []

    // Get latest telemetry for each vehicle
    const { data: telemetry } = await supabase
      .from('fleet_telemetry')
      .select('*')
      .in('vehicle_id', vehicleIds)
      .order('recorded_at', { ascending: false })

    // Get active alerts
    const { data: alerts } = await supabase
      .from('fleet_alerts')
      .select('*')
      .in('vehicle_id', vehicleIds)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })

    // Get recent trips
    const { data: trips } = await supabase
      .from('trip_records')
      .select(`
        *,
        vehicle:vehicles(make, model, year),
        booking:bookings(
          renter:profiles!bookings_renter_id_fkey(full_name)
        )
      `)
      .in('vehicle_id', vehicleIds)
      .order('started_at', { ascending: false })
      .limit(10)

    // Get active bookings for renter info
    const { data: activeBookings } = await supabase
      .from('bookings')
      .select(`
        id, vehicle_id, start_date, end_date,
        renter:profiles!bookings_renter_id_fkey(id, full_name, phone)
      `)
      .in('vehicle_id', vehicleIds)
      .in('status', ['confirmed', 'active'])

    // Get renter scores
    const renterIds = activeBookings?.map(b => {
      const renter = Array.isArray(b.renter) ? b.renter[0] : b.renter
      return renter?.id
    }).filter(Boolean) || []
    const { data: renterScores } = await supabase
      .from('renter_road_scores')
      .select('*')
      .in('user_id', renterIds)

    // Build vehicle data with latest telemetry
    const vehiclesWithTelemetry = vehicles?.map(vehicle => {
      const latestTelemetry = telemetry?.find(t => t.vehicle_id === vehicle.id)
      const vehicleAlerts = alerts?.filter(a => a.vehicle_id === vehicle.id) || []
      const activeBookingRaw = activeBookings?.find(b => b.vehicle_id === vehicle.id)
      const activeBooking = activeBookingRaw ? {
        ...activeBookingRaw,
        renter: Array.isArray(activeBookingRaw.renter) ? activeBookingRaw.renter[0] : activeBookingRaw.renter
      } : undefined
      
      return {
        ...vehicle,
        location: latestTelemetry ? {
          lat: latestTelemetry.latitude,
          lng: latestTelemetry.longitude,
          speed: latestTelemetry.speed_mph,
          heading: latestTelemetry.heading,
          lastSeen: latestTelemetry.recorded_at,
        } : null,
        alerts: vehicleAlerts,
        activeBooking,
        healthScore: vehicle.pulse_health_score,
      }
    }) || []

    // Fleet health summary
    const healthSummary = {
      total: vehicles?.length || 0,
      online: vehiclesWithTelemetry.filter(v => v.location).length,
      alertCount: alerts?.length || 0,
      criticalAlerts: alerts?.filter(a => a.severity === 'critical').length || 0,
      avgHealthScore: vehicles?.length 
        ? Math.round(vehicles.reduce((sum, v) => sum + (v.pulse_health_score || 100), 0) / vehicles.length)
        : 100,
    }

    return NextResponse.json({
      vehicles: vehiclesWithTelemetry,
      alerts: alerts || [],
      trips: trips || [],
      renterScores: renterScores || [],
      healthSummary,
    })
  } catch (error) {
    console.error('RAD Fleet Command error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
