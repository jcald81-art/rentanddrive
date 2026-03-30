import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'this_month'

  // Calculate date range based on period
  const now = new Date()
  let startDate: Date
  switch (period) {
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      break
    case 'last_3_months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      break
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    case 'all_time':
      startDate = new Date(2020, 0, 1)
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  // Get bookings for period
  const { data: bookings } = await supabase
    .from('bookings')
    .select('total_amount, platform_fee, created_at, vehicle_id')
    .gte('created_at', startDate.toISOString())
    .in('status', ['confirmed', 'active', 'completed'])

  const booking_revenue = bookings?.reduce((sum, b) => sum + b.total_amount, 0) || 0
  const platform_fees = bookings?.reduce((sum, b) => sum + (b.platform_fee || b.total_amount * 0.1), 0) || 0

  // VIN check sales (estimate $4.99 per check)
  const { count: vinChecks } = await supabase
    .from('vehicles')
    .select('id', { count: 'exact', head: true })
    .eq('has_vin_report', true)
    .gte('created_at', startDate.toISOString())

  const vin_check_sales = (vinChecks || 0) * 4.99

  // Agent costs
  const { data: agentLogs } = await supabase
    .from('agent_logs')
    .select('cost_cents')
    .gte('created_at', startDate.toISOString())

  const agent_costs = (agentLogs?.reduce((sum, log) => sum + (log.cost_cents || 0), 0) || 0) / 100

  const net_profit = platform_fees + vin_check_sales - agent_costs

  // Revenue per vehicle
  const { count: vehicleCount } = await supabase
    .from('vehicles')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  const revenue_per_vehicle = vehicleCount ? booking_revenue / vehicleCount : 0

  // Cost per booking
  const bookingCount = bookings?.length || 1
  const cost_per_booking = agent_costs / bookingCount

  // Monthly breakdown
  const monthlyMap: Record<string, { booking_revenue: number; platform_fees: number; vin_checks: number; agent_costs: number }> = {}
  
  bookings?.forEach((booking) => {
    const month = new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    if (!monthlyMap[month]) {
      monthlyMap[month] = { booking_revenue: 0, platform_fees: 0, vin_checks: 0, agent_costs: 0 }
    }
    monthlyMap[month].booking_revenue += booking.total_amount
    monthlyMap[month].platform_fees += booking.platform_fee || booking.total_amount * 0.1
  })

  const monthly_breakdown = Object.entries(monthlyMap).map(([month, data]) => ({
    month,
    ...data,
    net: data.platform_fees + data.vin_checks - data.agent_costs,
  }))

  // Top vehicles by revenue
  const vehicleRevenue: Record<string, number> = {}
  const vehicleBookings: Record<string, number> = {}
  
  bookings?.forEach((booking) => {
    if (booking.vehicle_id) {
      vehicleRevenue[booking.vehicle_id] = (vehicleRevenue[booking.vehicle_id] || 0) + booking.total_amount
      vehicleBookings[booking.vehicle_id] = (vehicleBookings[booking.vehicle_id] || 0) + 1
    }
  })

  const topVehicleIds = Object.entries(vehicleRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  const { data: topVehicleData } = await supabase
    .from('vehicles')
    .select('id, make, model, year')
    .in('id', topVehicleIds)

  const top_vehicles = topVehicleData?.map((v) => ({
    id: v.id,
    name: `${v.year} ${v.make} ${v.model}`,
    revenue: vehicleRevenue[v.id] || 0,
    bookings: vehicleBookings[v.id] || 0,
  })).sort((a, b) => b.revenue - a.revenue) || []

  return NextResponse.json({
    booking_revenue,
    platform_fees,
    vin_check_sales,
    agent_costs,
    net_profit,
    revenue_per_vehicle,
    cost_per_booking,
    stripe_balance: 0, // Would need Stripe API
    pending_payouts: 0, // Would need Stripe API
    monthly_breakdown,
    top_vehicles,
  })
}
