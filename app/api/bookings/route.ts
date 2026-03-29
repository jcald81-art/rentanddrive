import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') // upcoming, past, all
  const limit = parseInt(searchParams.get('limit') || '10')

  let query = supabase
    .from('bookings')
    .select(`
      id,
      booking_number,
      start_date,
      end_date,
      total_amount,
      status,
      lyft_pickup_requested,
      lyft_pickup_status,
      created_at,
      vehicle:vehicles (
        id,
        make,
        model,
        year,
        thumbnail_url,
        location_city,
        daily_rate
      ),
      host:users!bookings_host_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('renter_id', user.id)
    .order('start_date', { ascending: false })
    .limit(limit)

  const today = new Date().toISOString().split('T')[0]

  if (status === 'upcoming') {
    query = query.gte('start_date', today).in('status', ['confirmed', 'pending'])
  } else if (status === 'past') {
    query = query.lt('end_date', today)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
