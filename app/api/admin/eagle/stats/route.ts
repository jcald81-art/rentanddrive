import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const [
    { data: allDevices },
    { count: activeAlerts },
    { count: geofencesActive },
    { data: tripsToday },
  ] = await Promise.all([
    supabase.from('vehicles')
      .select('id, bouncie_imei, bouncie_last_seen_at, bouncie_battery_level')
      .not('bouncie_imei', 'is', null),
    supabase.from('fleet_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_resolved', false),
    supabase.from('geofences')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase.from('trip_records')
      .select('distance_miles')
      .gte('start_time', startOfDay.toISOString()),
  ])

  const devices = allDevices || []
  const onlineDevices = devices.filter(d => 
    d.bouncie_last_seen_at && new Date(d.bouncie_last_seen_at) > oneHourAgo
  ).length
  const offlineDevices = devices.length - onlineDevices
  const lowBatteryDevices = devices.filter(d => 
    d.bouncie_battery_level !== null && d.bouncie_battery_level < 20
  ).length

  const totalTripsToday = tripsToday?.length || 0
  const totalMilesToday = tripsToday?.reduce((sum, t) => sum + (t.distance_miles || 0), 0) || 0

  return NextResponse.json({
    total_devices: devices.length,
    online_devices: onlineDevices,
    offline_devices: offlineDevices,
    low_battery_devices: lowBatteryDevices,
    total_trips_today: totalTripsToday,
    total_miles_today: Math.round(totalMilesToday),
    active_alerts: activeAlerts || 0,
    geofences_active: geofencesActive || 0,
  })
}
