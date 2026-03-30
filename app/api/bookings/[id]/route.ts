import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/bookings/[id] - Get single booking details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id,
      vehicle_id,
      renter_id,
      host_id,
      start_date,
      end_date,
      status,
      total_amount,
      daily_rate,
      platform_fee,
      security_deposit,
      lockbox_code,
      pickup_location,
      pickup_lat,
      pickup_lng,
      renter_notes,
      trip_instructions,
      created_at,
      confirmed_at,
      started_at,
      completed_at,
      cancelled_at,
      vehicle:vehicles (
        make,
        model,
        year,
        thumbnail_url,
        location_city,
        location_state
      ),
      host:users!bookings_host_id_fkey (
        id,
        full_name,
        phone,
        avatar_url
      )
    `)
    .eq('id', id)
    .single()

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Verify user is the renter or host
  if (booking.renter_id !== user.id && booking.host_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Check if user has left a review
  const { data: review } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', id)
    .eq('reviewer_id', user.id)
    .single()

  return NextResponse.json({ 
    booking: {
      ...booking,
      has_review: !!review,
    }
  })
}
