import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]

  // Fetch all dashboard data in parallel
  const [
    upcomingBookingsResult,
    pastBookingsResult,
    creditsResult,
    wishlistResult,
    notificationsResult
  ] = await Promise.all([
    // Upcoming bookings
    supabase
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
        vehicle:vehicles (
          id,
          make,
          model,
          year,
          thumbnail_url,
          location_city
        ),
        host:users!bookings_host_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('renter_id', user.id)
      .gte('start_date', today)
      .in('status', ['confirmed', 'pending'])
      .order('start_date', { ascending: true })
      .limit(5),
    
    // Past bookings
    supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        start_date,
        end_date,
        total_amount,
        status,
        has_review,
        vehicle:vehicles (
          id,
          make,
          model,
          year,
          thumbnail_url
        )
      `)
      .eq('renter_id', user.id)
      .lt('end_date', today)
      .order('end_date', { ascending: false })
      .limit(5),
    
    // User credits
    supabase
      .from('user_credits')
      .select('balance, lifetime_earned')
      .eq('user_id', user.id)
      .single(),
    
    // Wishlist/saved vehicles
    supabase
      .from('wishlists')
      .select(`
        id,
        vehicle:vehicles (
          id,
          make,
          model,
          year,
          daily_rate,
          thumbnail_url,
          location_city,
          rating
        )
      `)
      .eq('user_id', user.id)
      .limit(6),
    
    // Notifications
    supabase
      .from('notifications')
      .select('id, title, message, type, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
  ])

  // Get referral code
  const { data: referralData } = await supabase
    .from('users')
    .select('referral_code')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    upcomingBookings: upcomingBookingsResult.data || [],
    pastBookings: pastBookingsResult.data || [],
    credits: creditsResult.data || { balance: 0, lifetime_earned: 0 },
    savedVehicles: wishlistResult.data || [],
    notifications: notificationsResult.data || [],
    referralCode: referralData?.referral_code || null,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name,
      avatarUrl: user.user_metadata?.avatar_url
    }
  })
}
