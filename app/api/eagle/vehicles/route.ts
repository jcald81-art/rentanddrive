import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
// BouncieClient is not used directly in this route - remove unused import

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const hostId = searchParams.get('hostId')

    // Build query
    let query = supabase
      .from('vehicles')
      .select(`
        id,
        make,
        model,
        year,
        license_plate,
        status,
        bouncie_imei,
        last_lat,
        last_lng,
        last_speed_mph,
        last_heading,
        last_seen_at,
        host_id
      `)
      .not('bouncie_imei', 'is', null)

    // Filter by host if specified
    if (hostId) {
      query = query.eq('host_id', hostId)
    }

    // If not admin, only show own vehicles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && !hostId) {
      query = query.eq('host_id', user.id)
    }

    const { data: vehicles, error } = await query

    if (error) throw error

    // Fetch live locations if Bouncie is configured
    let liveData: any[] = []
    if (process.env.BOUNCIE_API_KEY) {
      try {
        const bouncie = new BouncieClient()
        liveData = await bouncie.getVehicles()
      } catch (e) {
        console.error('Bouncie fetch failed:', e)
      }
    }

    // Merge live data with database records
    const enrichedVehicles = vehicles?.map(vehicle => {
      const live = liveData.find(l => l.imei === vehicle.bouncie_imei)
      return {
        ...vehicle,
        live: live ? {
          lat: live.stats?.location?.lat,
          lng: live.stats?.location?.lon,
          speed: live.stats?.speed,
          heading: live.stats?.heading,
          battery: live.stats?.battery,
          isMoving: live.stats?.speed > 0,
          lastUpdate: live.stats?.lastUpdated,
        } : null,
      }
    })

    return NextResponse.json({ vehicles: enrichedVehicles })
  } catch (error) {
    console.error('[Eagle Vehicles Error]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Eagle vehicles' },
      { status: 500 }
    )
  }
}
