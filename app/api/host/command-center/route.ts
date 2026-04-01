import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Run all queries in parallel
    const [
      vehiclesResult,
      alertsResult,
      bookingsResult,
      ridesResult,
    ] = await Promise.all([
      // Vehicles with Bouncie telemetry
      supabase
        .from('vehicles')
        .select(`
          id, make, model, year, license_plate, status, thumbnail_url,
          bouncie_devices(
            imei, last_lat, last_lng, last_speed_mph, battery_voltage,
            odometer_miles, last_seen_at, is_active, fuel_level
          )
        `)
        .eq('host_id', user.id)
        .order('make'),

      // Unread alerts for this host
      supabase
        .from('command_center_alerts')
        .select('*')
        .eq('host_id', user.id)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(50),

      // Active + upcoming bookings (next 48h)
      supabase
        .from('bookings')
        .select(`
          id, booking_number, status, start_date, end_date, total_amount,
          vehicles(make, model, year, license_plate),
          profiles!bookings_renter_id_fkey(full_name, phone)
        `)
        .eq('host_id', user.id)
        .in('status', ['confirmed', 'active', 'pending'])
        .gte('end_date', new Date().toISOString())
        .order('start_date')
        .limit(20),

      // Active concierge rides
      supabase
        .from('ride_concierge')
        .select(`
          id, ride_type, ride_status, ride_direction,
          pickup_address, dropoff_address, scheduled_time,
          driver_name, driver_phone, eta_minutes, cost_cents,
          bookings!inner(host_id)
        `)
        .eq('bookings.host_id', user.id)
        .in('ride_status', ['scheduled', 'dispatched', 'en_route', 'arrived'])
        .order('scheduled_time'),
    ])

    // Compute fleet KPIs
    const vehicles = vehiclesResult.data || []
    const onlineVehicles = vehicles.filter((v: Record<string, unknown>) => {
      const device = Array.isArray(v.bouncie_devices)
        ? v.bouncie_devices[0]
        : v.bouncie_devices as Record<string, unknown> | null
      if (!device) return false
      const lastSeen = device.last_seen_at as string | null
      if (!lastSeen) return false
      return Date.now() - new Date(lastSeen).getTime() < 15 * 60 * 1000 // 15 min
    })
    const movingVehicles = onlineVehicles.filter((v: Record<string, unknown>) => {
      const device = Array.isArray(v.bouncie_devices)
        ? v.bouncie_devices[0]
        : v.bouncie_devices as Record<string, unknown> | null
      return device && (device.last_speed_mph as number) > 2
    })

    const alerts = alertsResult.data || []
    const criticalAlerts = alerts.filter((a: Record<string, unknown>) => a.severity === 'critical')
    const unreadCount = alerts.filter((a: Record<string, unknown>) => !a.is_read).length

    return NextResponse.json({
      kpis: {
        total_vehicles: vehicles.length,
        online_vehicles: onlineVehicles.length,
        moving_vehicles: movingVehicles.length,
        offline_vehicles: vehicles.length - onlineVehicles.length,
        active_bookings: (bookingsResult.data || []).filter((b: Record<string, unknown>) => b.status === 'active').length,
        upcoming_bookings: (bookingsResult.data || []).filter((b: Record<string, unknown>) => b.status === 'confirmed').length,
        unread_alerts: unreadCount,
        critical_alerts: criticalAlerts.length,
        active_rides: (ridesResult.data || []).length,
      },
      vehicles: vehicles.map((v: Record<string, unknown>) => {
        const device = Array.isArray(v.bouncie_devices)
          ? (v.bouncie_devices as Record<string, unknown>[])[0]
          : v.bouncie_devices as Record<string, unknown> | null
        const lastSeen = device?.last_seen_at as string | null
        const isOnline = lastSeen
          ? Date.now() - new Date(lastSeen).getTime() < 15 * 60 * 1000
          : false
        return {
          id: v.id,
          make: v.make,
          model: v.model,
          year: v.year,
          license_plate: v.license_plate,
          status: v.status,
          thumbnail_url: v.thumbnail_url,
          telemetry: device
            ? {
                lat: device.last_lat,
                lng: device.last_lng,
                speed_mph: device.last_speed_mph,
                battery_voltage: device.battery_voltage,
                odometer_miles: device.odometer_miles,
                fuel_level: device.fuel_level,
                last_seen_at: device.last_seen_at,
                is_online: isOnline,
                is_moving: (device.last_speed_mph as number) > 2,
              }
            : null,
        }
      }),
      alerts,
      bookings: bookingsResult.data || [],
      rides: ridesResult.data || [],
    })
  } catch (err) {
    console.error('[command-center] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
