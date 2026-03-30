import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')

  const { data: alerts, error } = await supabase
    .from('fleet_alerts')
    .select(`
      *,
      vehicle:vehicles!fleet_alerts_vehicle_id_fkey(year, make, model, license_plate)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ alerts: alerts || [] })
}
