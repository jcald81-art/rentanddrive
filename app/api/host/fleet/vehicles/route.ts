import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get host's vehicles with Bouncie devices
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select(`
        id,
        make,
        model,
        year,
        license_plate,
        thumbnail_url,
        status,
        bouncie_devices (
          id,
          imei,
          battery_voltage,
          last_lat,
          last_lng,
          last_speed_mph,
          odometer_miles,
          last_seen_at,
          is_active
        )
      `)
      .eq('host_id', user.id)
      .order('make', { ascending: true })

    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError)
      return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
    }

    // Get active bookings for these vehicles
    const vehicleIds = vehicles?.map(v => v.id) || []
    const now = new Date().toISOString()
    
    const { data: activeBookings } = await supabase
      .from('bookings')
      .select(`
        id, 
        vehicle_id, 
        start_date, 
        end_date, 
        status,
        renter:users!bookings_renter_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .in('vehicle_id', vehicleIds)
      .eq('status', 'active')
      .lte('start_date', now)
      .gte('end_date', now)

    // Get unacknowledged alerts
    const { data: alerts } = await supabase
      .from('fleet_alerts')
      .select('id, vehicle_id, alert_type, severity, title, created_at')
      .in('vehicle_id', vehicleIds)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })

    // Calculate utilization for this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: monthBookings } = await supabase
      .from('bookings')
      .select('vehicle_id, start_date, end_date')
      .in('vehicle_id', vehicleIds)
      .in('status', ['completed', 'active'])
      .gte('start_date', startOfMonth.toISOString())

    // Calculate total booked days vs available days
    const daysInMonth = new Date(now).getDate()
    const totalAvailableDays = vehicleIds.length * daysInMonth
    let totalBookedDays = 0

    monthBookings?.forEach(booking => {
      const start = new Date(booking.start_date)
      const end = new Date(booking.end_date)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      totalBookedDays += days
    })

    const utilizationPercent = totalAvailableDays > 0 
      ? Math.round((totalBookedDays / totalAvailableDays) * 100) 
      : 0

    // Combine data
    const vehiclesWithStatus = vehicles?.map(vehicle => {
      const device = vehicle.bouncie_devices?.[0] || null
      const activeBooking = activeBookings?.find(b => b.vehicle_id === vehicle.id) || null
      const vehicleAlerts = alerts?.filter(a => a.vehicle_id === vehicle.id) || []

      // Determine vehicle status
      let status: 'available' | 'rented' | 'needs_attention' | 'no_tracker' | 'tracker_offline' = 'available'
      if (!device) status = 'no_tracker'
      else if (!device.is_active) status = 'tracker_offline'
      else if (vehicleAlerts.some(a => a.severity === 'critical')) status = 'needs_attention'
      else if (activeBooking) status = 'rented'

      return {
        ...vehicle,
        device,
        activeBooking,
        alerts: vehicleAlerts,
        status,
        lastLocation: device ? {
          lat: device.last_lat,
          lng: device.last_lng,
          speed: device.last_speed_mph,
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
        needsAttention: vehiclesWithStatus.filter(v => v.status === 'needs_attention' || v.alerts.length > 0).length,
        utilizationPercent,
      },
    })
  } catch (error) {
    console.error('Host fleet vehicles error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
