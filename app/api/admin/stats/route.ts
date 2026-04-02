import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Revenue this month from completed bookings
  const { data: monthlyBookings } = await supabase
    .from('bookings')
    .select('total_amount, platform_fee')
    .gte('created_at', startOfMonth)
    .in('status', ['confirmed', 'active', 'completed'])

  const revenue_this_month = monthlyBookings?.reduce((sum, b) => sum + (b.platform_fee || b.total_amount * 0.1), 0) || 0

  // Active bookings (status = active)
  const { count: active_bookings } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  // Total vehicles
  const { count: total_vehicles } = await supabase
    .from('vehicles')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  // Pending verifications
  const { count: pending_verifications } = await supabase
    .from('driver_verifications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Open disputes
  const { count: open_disputes } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'disputed')

  // Agent spend this month
  const { data: agentLogs } = await supabase
    .from('agent_logs')
    .select('cost_cents')
    .gte('created_at', startOfMonth)

  const agent_spend_this_month = (agentLogs?.reduce((sum, log) => sum + (log.cost_cents || 0), 0) || 0) / 100

  // Revenue last 30 days
  const { data: last30DaysBookings } = await supabase
    .from('bookings')
    .select('created_at, total_amount, platform_fee')
    .gte('created_at', thirtyDaysAgo)
    .in('status', ['confirmed', 'active', 'completed'])
    .order('created_at', { ascending: true })

  // Group by day
  const revenueByDay: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split('T')[0]
    revenueByDay[dateStr] = 0
  }

  last30DaysBookings?.forEach((booking) => {
    const dateStr = booking.created_at.split('T')[0]
    if (revenueByDay[dateStr] !== undefined) {
      revenueByDay[dateStr] += booking.platform_fee || booking.total_amount * 0.1
    }
  })

  const revenue_last_30_days = Object.entries(revenueByDay).map(([date, revenue]) => ({
    date,
    revenue,
  }))

  // Recent bookings
  const { data: recent_bookings } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_number,
      total_amount,
      status,
      created_at,
      renter:profiles!bookings_renter_id_fkey (full_name),
      vehicle:vehicles (make, model, year)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  const formattedBookings = recent_bookings?.map((b) => {
    const vehicle = Array.isArray(b.vehicle) ? b.vehicle[0] : b.vehicle
    const renter = Array.isArray(b.renter) ? b.renter[0] : b.renter
    return {
      id: b.id,
      booking_number: b.booking_number || b.id.slice(0, 8).toUpperCase(),
      renter_name: renter?.full_name || 'Unknown',
      vehicle_name: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle',
      total_amount: b.total_amount,
      status: b.status,
      created_at: b.created_at,
    }
  })

  // Recent signups
  const { data: recent_signups } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    revenue_this_month,
    active_bookings: active_bookings || 0,
    total_vehicles: total_vehicles || 0,
    pending_verifications: pending_verifications || 0,
    open_disputes: open_disputes || 0,
    agent_spend_this_month,
    revenue_last_30_days,
    recent_bookings: formattedBookings || [],
    recent_signups: recent_signups || [],
  })
}
