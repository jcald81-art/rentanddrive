import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/bouncie/vehicles - Get all vehicles with their Bouncie device status
export async function GET() {
  try {
    // Get all vehicles with their linked Bouncie devices
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select(`
        id,
        make,
        model,
        year,
        license_plate,
        is_active,
        bouncie_devices (
          id,
          imei,
          nickname,
          battery_voltage,
          last_lat,
          last_lng,
          last_speed_mph,
          last_heading,
          odometer_miles,
          last_seen_at,
          is_active
        )
      `)
      .eq('is_active', true)
      .order('make', { ascending: true })

    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError)
      return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
    }

    // Get active bookings for each vehicle
    const now = new Date().toISOString()
    const { data: activeBookings } = await supabase
      .from('bookings')
      .select('id, vehicle_id, renter_id, start_date, end_date, status')
      .eq('status', 'active')
      .lte('start_date', now)
      .gte('end_date', now)

    // Get recent alerts for each vehicle (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentAlerts } = await supabase
      .from('bouncie_alerts')
      .select('id, vehicle_id, alert_type, severity, title, is_resolved, created_at')
      .gte('created_at', yesterday)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })

    // Combine data
    const vehiclesWithStatus = vehicles?.map(vehicle => {
      const device = vehicle.bouncie_devices?.[0] || null
      const activeBooking = activeBookings?.find(b => b.vehicle_id === vehicle.id) || null
      const alerts = recentAlerts?.filter(a => a.vehicle_id === vehicle.id) || []

      // Determine vehicle status
      let status = 'available'
      if (!device) status = 'no_tracker'
      else if (!device.is_active) status = 'tracker_offline'
      else if (activeBooking) status = 'rented'
      else if (alerts.some(a => a.severity === 'critical')) status = 'needs_attention'

      return {
        ...vehicle,
        device,
        activeBooking,
        alerts,
        status,
        lastLocation: device ? {
          lat: device.last_lat,
          lng: device.last_lng,
          speed: device.last_speed_mph,
          heading: device.last_heading,
          updatedAt: device.last_seen_at,
        } : null,
      }
    }) || []

    return NextResponse.json({
      vehicles: vehiclesWithStatus,
      summary: {
        total: vehiclesWithStatus.length,
        available: vehiclesWithStatus.filter(v => v.status === 'available').length,
        rented: vehiclesWithStatus.filter(v => v.status === 'rented').length,
        needsAttention: vehiclesWithStatus.filter(v => v.status === 'needs_attention').length,
        noTracker: vehiclesWithStatus.filter(v => v.status === 'no_tracker').length,
        trackerOffline: vehiclesWithStatus.filter(v => v.status === 'tracker_offline').length,
      },
    })
  } catch (error) {
    console.error('Fleet status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
