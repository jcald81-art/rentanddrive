import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select(`
      id,
      year,
      make,
      model,
      license_plate,
      status,
      bouncie_imei,
      bouncie_last_lat,
      bouncie_last_lng,
      bouncie_last_speed_mph,
      bouncie_last_seen_at,
      bouncie_battery_level,
      bouncie_firmware_version,
      host:profiles!vehicles_host_id_fkey(full_name)
    `)
    .not('bouncie_imei', 'is', null)
    .order('bouncie_last_seen_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const devices = (vehicles || []).map(v => ({
    id: v.id,
    imei: v.bouncie_imei,
    vehicle_id: v.id,
    vehicle: {
      id: v.id,
      year: v.year,
      make: v.make,
      model: v.model,
      license_plate: v.license_plate,
      status: v.status,
      host: v.host,
    },
    last_lat: v.bouncie_last_lat,
    last_lng: v.bouncie_last_lng,
    last_speed_mph: v.bouncie_last_speed_mph || 0,
    last_seen_at: v.bouncie_last_seen_at || new Date().toISOString(),
    battery_level: v.bouncie_battery_level || 100,
    is_online: v.bouncie_last_seen_at ? new Date(v.bouncie_last_seen_at) > oneHourAgo : false,
    firmware_version: v.bouncie_firmware_version || 'Unknown',
  }))

  return NextResponse.json({ devices })
}
