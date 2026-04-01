import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      platformStatsResult,
      allVehiclesResult,
      revenueResult,
      alertsResult,
      hostsResult,
      bookingsResult,
      ridesResult,
    ] = await Promise.all([
      // Platform-wide counts
      supabase.rpc('get_platform_stats').maybeSingle(),

      // All vehicles across all hosts
      supabase
        .from('vehicles')
        .select(`
          id, make, model, year, license_plate, status, host_id,
          profiles!vehicles_host_id_fkey(full_name),
          bouncie_devices(last_lat, last_lng, last_speed_mph, last_seen_at, battery_voltage)
        `)
        .order('created_at', { ascending: false }),

      // Revenue last 30 days
      supabase
        .from('bookings')
        .select('total_amount, created_at, status')
        .gte('created_at', thirtyDaysAgo)
        .in('status', ['completed', 'active', 'confirmed']),

      // All unresolved critical alerts
      supabase
        .from('command_center_alerts')
        .select(`
          *, 
          vehicles(make, model, license_plate),
          profiles!command_center_alerts_host_id_fkey(full_name)
        `)
        .eq('is_resolved', false)
        .eq('severity', 'critical')
        .order('created_at', { ascending: false })
        .limit(100),

      // All hosts with their fleet size
      supabase
        .from('profiles')
        .select(`
          id, full_name, phone, role, is_host, created_at,
          vehicles(count)
        `)
        .eq('is_host', true)
        .order('created_at', { ascending: false })
        .limit(50),

      // Recent bookings platform-wide
      supabase
        .from('bookings')
        .select(`
          id, booking_number, status, total_amount, created_at,
          vehicles(make, model),
          profiles!bookings_renter_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(20),

      // Active rides across platform
      supabase
        .from('ride_concierge')
        .select('id, ride_type, ride_status, ride_direction, cost_cents, created_at')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(100),
    ])

    const allVehicles = allVehiclesResult.data || []
    const revenue = revenueResult.data || []
    const totalRevenue = revenue.reduce((sum: number, b: Record<string, unknown>) => sum + ((b.total_amount as number) || 0), 0)

    // Revenue by day
    const revenueByDay: Record<string, number> = {}
    revenue.forEach((b: Record<string, unknown>) => {
      const day = (b.created_at as string).slice(0, 10)
      revenueByDay[day] = (revenueByDay[day] || 0) + ((b.total_amount as number) || 0)
    })
    const revenueChart = Object.entries(revenueByDay)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Fleet health
    const now2 = Date.now()
    const onlineVehicles = allVehicles.filter((v: Record<string, unknown>) => {
      const devices = v.bouncie_devices as Record<string, unknown>[] | null
      const device = Array.isArray(devices) ? devices[0] : devices
      if (!device?.last_seen_at) return false
      return now2 - new Date(device.last_seen_at as string).getTime() < 15 * 60 * 1000
    })

    return NextResponse.json({
      kpis: {
        total_vehicles: allVehicles.length,
        online_vehicles: onlineVehicles.length,
        total_revenue_30d: totalRevenue,
        total_bookings_30d: revenue.length,
        critical_alerts: (alertsResult.data || []).length,
        total_hosts: (hostsResult.data || []).length,
        active_rides: (ridesResult.data || []).filter((r: Record<string, unknown>) =>
          ['dispatched', 'en_route', 'arrived'].includes(r.ride_status as string)
        ).length,
      },
      vehicles: allVehicles,
      revenue_chart: revenueChart,
      alerts: alertsResult.data || [],
      hosts: hostsResult.data || [],
      bookings: bookingsResult.data || [],
      rides: ridesResult.data || [],
    })
  } catch (err) {
    console.error('[management/overview] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
