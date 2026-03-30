import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Get host's vehicles
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, status')
      .eq('host_id', user.id)

    const vehicleIds = vehicles?.map(v => v.id) || []

    // Get trips this month
    const { count: tripsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('vehicle_id', vehicleIds)
      .gte('created_at', startOfMonth)
      .eq('status', 'completed')

    // Get revenue this month
    const { data: payments } = await supabase
      .from('payments')
      .select('amount_cents, booking_id')
      .in('booking_id', 
        (await supabase
          .from('bookings')
          .select('id')
          .in('vehicle_id', vehicleIds)
          .gte('created_at', startOfMonth)
        ).data?.map(b => b.id) || []
      )
      .eq('status', 'succeeded')

    const revenue = (payments || []).reduce((sum, p) => sum + (p.amount_cents || 0), 0)

    // Get average rating
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .in('vehicle_id', vehicleIds)

    const avgRating = reviews?.length 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0

    // Get morning brief
    const { data: brief } = await supabase
      .from('morning_briefs')
      .select('*')
      .eq('host_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get upcoming bookings
    const { data: upcomingBookings } = await supabase
      .from('bookings')
      .select(`
        id, start_date, end_date, status, total_price_cents,
        vehicle:vehicles(id, make, model, year, thumbnail_url),
        renter:profiles!bookings_renter_id_fkey(full_name, avatar_url)
      `)
      .in('vehicle_id', vehicleIds)
      .gte('start_date', now.toISOString())
      .order('start_date', { ascending: true })
      .limit(10)

    // Get agent statuses
    const { data: agents } = await supabase
      .from('rd_agents')
      .select('*')
      .eq('host_id', user.id)

    // Get recent agent activity
    const { data: agentLogs } = await supabase
      .from('rd_agent_log')
      .select('*')
      .eq('host_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      stats: {
        activeVehicles: vehicles?.filter(v => v.status === 'active').length || 0,
        totalVehicles: vehicles?.length || 0,
        tripsThisMonth: tripsCount || 0,
        revenueThisMonth: revenue,
        avgRating: Math.round(avgRating * 10) / 10,
      },
      brief,
      upcomingBookings: upcomingBookings || [],
      agents: agents || [],
      recentActivity: agentLogs || [],
    })
  } catch (error) {
    console.error('Hosts Suite lobby stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
