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
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get host's vehicles
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, make, model, year')
      .eq('host_id', user.id)

    const vehicleIds = vehicles?.map(v => v.id) || []

    // Get this month's bookings and payments
    const { data: thisMonthBookings } = await supabase
      .from('bookings')
      .select('id, vehicle_id, total_price_cents, host_payout_cents, status, created_at')
      .in('vehicle_id', vehicleIds)
      .gte('created_at', startOfMonth.toISOString())
      .in('status', ['completed', 'confirmed', 'active'])

    // Get last month's bookings
    const { data: lastMonthBookings } = await supabase
      .from('bookings')
      .select('id, vehicle_id, total_price_cents, host_payout_cents, status')
      .in('vehicle_id', vehicleIds)
      .gte('created_at', startOfLastMonth.toISOString())
      .lte('created_at', endOfLastMonth.toISOString())
      .eq('status', 'completed')

    // Calculate revenue by vehicle
    const revenueByVehicle = vehicles?.map(vehicle => {
      const vehicleBookings = thisMonthBookings?.filter(b => b.vehicle_id === vehicle.id) || []
      const revenue = vehicleBookings.reduce((sum, b) => sum + (b.host_payout_cents || 0), 0)
      return {
        vehicleId: vehicle.id,
        name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        revenue,
        bookings: vehicleBookings.length,
      }
    }) || []

    // Get payout history (from payments table)
    const { data: payouts } = await supabase
      .from('payments')
      .select('*')
      .eq('payee_id', user.id)
      .eq('type', 'host_payout')
      .order('created_at', { ascending: false })
      .limit(20)

    // Get insurance claims revenue
    const { data: insuranceClaims } = await supabase
      .from('insurance_claims')
      .select('*')
      .in('vehicle_id', vehicleIds)
      .eq('status', 'paid')
      .gte('created_at', startOfMonth.toISOString())

    const insuranceRevenue = insuranceClaims?.reduce((sum, c) => sum + (c.payout_cents || 0), 0) || 0

    // Calculate totals
    const thisMonthRevenue = thisMonthBookings?.reduce((sum, b) => sum + (b.host_payout_cents || 0), 0) || 0
    const lastMonthRevenue = lastMonthBookings?.reduce((sum, b) => sum + (b.host_payout_cents || 0), 0) || 0
    const revenueChange = lastMonthRevenue > 0 
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0

    // Project 30-day earnings based on daily average
    const dayOfMonth = now.getDate()
    const dailyAvg = dayOfMonth > 0 ? thisMonthRevenue / dayOfMonth : 0
    const projected30Day = Math.round(dailyAvg * 30)

    // Get upcoming payouts (pending bookings)
    const { data: pendingPayouts } = await supabase
      .from('bookings')
      .select('id, host_payout_cents, end_date')
      .in('vehicle_id', vehicleIds)
      .in('status', ['confirmed', 'active'])
      .gte('end_date', now.toISOString())

    const upcomingPayoutTotal = pendingPayouts?.reduce((sum, b) => sum + (b.host_payout_cents || 0), 0) || 0

    return NextResponse.json({
      thisMonth: {
        revenue: thisMonthRevenue,
        bookings: thisMonthBookings?.length || 0,
        avgPerBooking: thisMonthBookings?.length 
          ? Math.round(thisMonthRevenue / thisMonthBookings.length)
          : 0,
      },
      lastMonth: {
        revenue: lastMonthRevenue,
        bookings: lastMonthBookings?.length || 0,
      },
      revenueChange,
      projected30Day,
      upcomingPayouts: upcomingPayoutTotal,
      revenueByVehicle: revenueByVehicle.sort((a, b) => b.revenue - a.revenue),
      payoutHistory: payouts || [],
      insuranceRevenue,
    })
  } catch (error) {
    console.error('Vault error:', error)
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 })
  }
}
