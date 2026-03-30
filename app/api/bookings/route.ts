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
      vehicle_id,
      start_date,
      end_date,
      total_amount,
      status,
      lockbox_code,
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

  // Check which bookings have reviews
  const bookingIds = data?.map(b => b.id) || []
  if (bookingIds.length > 0) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('booking_id')
      .in('booking_id', bookingIds)

    const reviewedBookingIds = new Set(reviews?.map(r => r.booking_id) || [])
    
    const bookingsWithReviewStatus = data?.map(b => ({
      ...b,
      has_review: reviewedBookingIds.has(b.id),
    }))

    return NextResponse.json({ bookings: bookingsWithReviewStatus })
  }

  return NextResponse.json({ bookings: data })
}
