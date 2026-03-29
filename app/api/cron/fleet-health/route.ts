import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Vercel Cron: 6am daily
// Fleet health check - maintenance alerts, insurance expiry, etc.

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Cron] fleet-health: Running daily fleet health check...')
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const alerts = {
      insurance_expiring: 0,
      registration_expiring: 0,
      maintenance_due: 0,
      inactive_vehicles: 0,
      notifications_sent: 0,
      bouncie_low_battery: 0,
      bouncie_silent_devices: 0,
      bouncie_high_usage_trips: 0,
    }

    // Check insurance expiry (within 30 days)
    const { data: insuranceExpiring } = await supabase
      .from('vehicles')
      .select('id, make, model, year, host_id, insurance_expiry')
      .lte('insurance_expiry', thirtyDaysFromNow.toISOString())
      .gte('insurance_expiry', now.toISOString())
      .eq('status', 'active')

    for (const vehicle of insuranceExpiring || []) {
      alerts.insurance_expiring++
      const daysLeft = Math.ceil(
        (new Date(vehicle.insurance_expiry).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )

      await supabase.from('notifications').insert({
        user_id: vehicle.host_id,
        type: 'insurance_expiry',
        title: 'Insurance Expiring Soon',
        message: `Your ${vehicle.year} ${vehicle.make} ${vehicle.model} insurance expires in ${daysLeft} days. Update before ${new Date(vehicle.insurance_expiry).toLocaleDateString()}.`,
        data: { vehicle_id: vehicle.id, expiry_date: vehicle.insurance_expiry },
        priority: daysLeft <= 7 ? 'high' : 'medium',
      })
      alerts.notifications_sent++
    }

    // Check registration expiry (within 30 days)
    const { data: registrationExpiring } = await supabase
      .from('vehicles')
      .select('id, make, model, year, host_id, registration_expiry')
      .lte('registration_expiry', thirtyDaysFromNow.toISOString())
      .gte('registration_expiry', now.toISOString())
      .eq('status', 'active')

    for (const vehicle of registrationExpiring || []) {
      alerts.registration_expiring++
      const daysLeft = Math.ceil(
        (new Date(vehicle.registration_expiry).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )

      await supabase.from('notifications').insert({
        user_id: vehicle.host_id,
        type: 'registration_expiry',
        title: 'Registration Expiring Soon',
        message: `Your ${vehicle.year} ${vehicle.make} ${vehicle.model} registration expires in ${daysLeft} days.`,
        data: { vehicle_id: vehicle.id, expiry_date: vehicle.registration_expiry },
        priority: daysLeft <= 7 ? 'high' : 'medium',
      })
      alerts.notifications_sent++
    }

    // Check maintenance due (based on last service date + interval)
    const { data: maintenanceDue } = await supabase
      .from('vehicles')
      .select('id, make, model, year, host_id, last_service_date, service_interval_days, current_mileage, service_interval_miles')
      .eq('status', 'active')
      .not('last_service_date', 'is', null)

    for (const vehicle of maintenanceDue || []) {
      const lastService = new Date(vehicle.last_service_date)
      const intervalDays = vehicle.service_interval_days || 90
      const nextServiceDate = new Date(lastService.getTime() + intervalDays * 24 * 60 * 60 * 1000)

      if (nextServiceDate <= sevenDaysFromNow) {
        alerts.maintenance_due++

        await supabase.from('notifications').insert({
          user_id: vehicle.host_id,
          type: 'maintenance_due',
          title: 'Maintenance Due Soon',
          message: `Your ${vehicle.year} ${vehicle.make} ${vehicle.model} is due for maintenance by ${nextServiceDate.toLocaleDateString()}.`,
          data: { vehicle_id: vehicle.id, next_service_date: nextServiceDate.toISOString() },
          priority: nextServiceDate <= now ? 'high' : 'medium',
        })
        alerts.notifications_sent++
      }
    }

    // Check inactive vehicles (no bookings in 30 days, still marked active)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const { data: activeVehicles } = await supabase
      .from('vehicles')
      .select(`
        id, make, model, year, host_id, daily_rate,
        bookings:bookings(id, start_date)
      `)
      .eq('status', 'active')

    for (const vehicle of activeVehicles || []) {
      const recentBookings = ((vehicle.bookings || []) as Array<{ start_date: string }>).filter(
        b => new Date(b.start_date) >= thirtyDaysAgo
      )

      if (recentBookings.length === 0) {
        alerts.inactive_vehicles++

        await supabase.from('notifications').insert({
          user_id: vehicle.host_id,
          type: 'inactive_vehicle',
          title: 'Vehicle Not Getting Bookings',
          message: `Your ${vehicle.year} ${vehicle.make} ${vehicle.model} hasn't had a booking in 30 days. Consider adjusting pricing or updating photos.`,
          data: { vehicle_id: vehicle.id, daily_rate: vehicle.daily_rate },
          priority: 'low',
        })
        alerts.notifications_sent++
      }
    }

    // ============ BOUNCIE GPS TRACKING CHECKS ============

    // Check for Bouncie devices with low battery (under 12V)
    const { data: lowBatteryDevices } = await supabase
      .from('bouncie_devices')
      .select('id, vehicle_id, battery_voltage, nickname')
      .lt('battery_voltage', 12)
      .eq('is_active', true)

    for (const device of lowBatteryDevices || []) {
      // Check if we already alerted in last 24 hours
      const { count } = await supabase
        .from('bouncie_alerts')
        .select('id', { count: 'exact' })
        .eq('device_id', device.id)
        .eq('alert_type', 'low_battery')
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())

      if (!count || count === 0) {
        await supabase.from('bouncie_alerts').insert({
          device_id: device.id,
          vehicle_id: device.vehicle_id,
          alert_type: 'low_battery',
          severity: device.battery_voltage < 11 ? 'critical' : 'warning',
          title: 'Low Battery - Proactive Alert',
          description: `Battery at ${device.battery_voltage}V. Schedule maintenance before it fails.`,
          data: { voltage: device.battery_voltage, detected_by: 'daily_health_check' },
        })
        alerts.bouncie_low_battery++
      }
    }

    // Check for Bouncie devices that haven't reported in 48+ hours
    const { data: silentDevices } = await supabase
      .from('bouncie_devices')
      .select('id, vehicle_id, last_seen_at, nickname')
      .lt('last_seen_at', new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString())
      .eq('is_active', true)

    for (const device of silentDevices || []) {
      const { count } = await supabase
        .from('bouncie_alerts')
        .select('id', { count: 'exact' })
        .eq('device_id', device.id)
        .eq('alert_type', 'device_silent')
        .gte('created_at', new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString())

      if (!count || count === 0) {
        await supabase.from('bouncie_alerts').insert({
          device_id: device.id,
          vehicle_id: device.vehicle_id,
          alert_type: 'device_silent',
          severity: 'warning',
          title: 'GPS Tracker Not Reporting',
          description: `Device hasn't sent data in 48+ hours. Last seen: ${device.last_seen_at}`,
          data: { last_seen_at: device.last_seen_at, detected_by: 'daily_health_check' },
        })
        alerts.bouncie_silent_devices++
      }
    }

    // Check for high mileage/harsh driving trips in last 24 hours
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const { data: highUsageTrips } = await supabase
      .from('bouncie_trips')
      .select('id, vehicle_id, distance_miles, max_speed_mph, hard_brakes, hard_accelerations, booking_id')
      .gte('created_at', yesterday.toISOString())
      .or('distance_miles.gt.200,max_speed_mph.gt.100,hard_brakes.gt.10')

    for (const trip of highUsageTrips || []) {
      const reasons: string[] = []
      if (trip.distance_miles > 200) reasons.push(`${trip.distance_miles} miles`)
      if (trip.max_speed_mph > 100) reasons.push(`${trip.max_speed_mph} mph max`)
      if (trip.hard_brakes > 10) reasons.push(`${trip.hard_brakes} hard brakes`)

      await supabase.from('bouncie_alerts').insert({
        device_id: null,
        vehicle_id: trip.vehicle_id,
        alert_type: 'excessive_use',
        severity: 'info',
        title: 'High Usage Trip Detected',
        description: `Trip flagged: ${reasons.join(', ')}`,
        data: { trip_id: trip.id, ...trip },
      })
      alerts.bouncie_high_usage_trips++
    }

    // ============ END BOUNCIE CHECKS ============

    // Deactivate vehicles with expired insurance/registration
    const { data: expired } = await supabase
      .from('vehicles')
      .select('id')
      .eq('status', 'active')
      .or(`insurance_expiry.lt.${now.toISOString()},registration_expiry.lt.${now.toISOString()}`)

    if (expired && expired.length > 0) {
      await supabase
        .from('vehicles')
        .update({ status: 'suspended', suspended_reason: 'Expired documents' })
        .in('id', expired.map(v => v.id))

      console.log(`[Cron] fleet-health: Suspended ${expired.length} vehicles with expired documents`)
    }

    // Log cron run
    await supabase.from('cron_logs').insert({
      job_name: 'fleet-health',
      status: 'success',
      duration_ms: Date.now() - startTime,
      details: { ...alerts, suspended: expired?.length || 0 },
    })

    console.log(`[Cron] fleet-health: Completed in ${Date.now() - startTime}ms`, alerts)

    return NextResponse.json({
      success: true,
      ...alerts,
      suspended: expired?.length || 0,
      duration_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('[Cron] fleet-health: Error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
