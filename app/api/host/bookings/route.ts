import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/host/bookings - Get all bookings for host's vehicles
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')

  let query = supabase
    .from('bookings')
    .select(`
      id,
      start_date,
      end_date,
      status,
      total_amount,
      host_payout,
      instant_book,
      created_at,
      renter:users!bookings_renter_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      ),
      vehicle:vehicles (
        id,
        make,
        model,
        year
      )
    `)
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: bookings, error } = await query

  if (error) {
    console.error('Failed to fetch host bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }

  return NextResponse.json({ bookings })
}
