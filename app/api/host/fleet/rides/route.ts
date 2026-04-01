import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/host/fleet/rides
 * Returns ride_concierge rows for bookings owned by the authenticated host.
 * RLS policy "Hosts can view rides for their bookings" enforces scoping.
 *
 * Query params:
 *   active=true   → only statuses: scheduled, dispatched, en_route, arrived
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activeOnly = request.nextUrl.searchParams.get('active') === 'true'

    let query = supabase
      .from('ride_concierge')
      .select(`
        id,
        booking_id,
        ride_type,
        ride_direction,
        rider_name,
        rider_phone,
        pickup_address,
        dropoff_address,
        scheduled_time,
        ride_status,
        external_ride_id,
        driver_name,
        driver_phone,
        vehicle_description,
        eta_minutes,
        cost_cents,
        notes,
        created_at,
        booking:bookings (
          booking_number,
          vehicle:vehicles (
            id,
            make,
            model,
            year
          )
        )
      `)
      .order('scheduled_time', { ascending: true })

    if (activeOnly) {
      query = query.in('ride_status', ['scheduled', 'dispatched', 'en_route', 'arrived'])
    }

    const { data, error } = await query

    if (error) {
      console.error('[v0] Host fleet rides error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rides: data ?? [] })
  } catch (err) {
    console.error('[v0] Host fleet rides exception:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
