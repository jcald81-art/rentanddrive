import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get host's vehicle IDs
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id')
      .eq('host_id', user.id)

    const vehicleIds = vehicles?.map(v => v.id) || []

    if (vehicleIds.length === 0) {
      return NextResponse.json({ alerts: [] })
    }

    // Get unresolved alerts for host's vehicles
    const { data: alerts, error } = await supabase
      .from('fleet_alerts')
      .select(`
        id,
        vehicle_id,
        alert_type,
        severity,
        title,
        description,
        is_resolved,
        is_acknowledged,
        created_at,
        vehicle:vehicles (
          make,
          model,
          year
        )
      `)
      .in('vehicle_id', vehicleIds)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching alerts:', error)
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }

    return NextResponse.json({ alerts: alerts || [] })
  } catch (error) {
    console.error('Host fleet alerts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
