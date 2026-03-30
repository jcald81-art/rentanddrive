import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
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

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    // Today's rides
    const { data: todayRides } = await supabase
      .from('ride_concierge')
      .select('cost_cents')
      .gte('scheduled_time', today.toISOString())
      .lte('scheduled_time', todayEnd.toISOString())

    // Monthly rides
    const { data: monthRides } = await supabase
      .from('ride_concierge')
      .select('cost_cents')
      .gte('scheduled_time', monthStart.toISOString())

    // Pending rides
    const { data: pendingRides } = await supabase
      .from('ride_concierge')
      .select('id')
      .in('ride_status', ['scheduled', 'dispatched', 'en_route'])

    const todayCost = todayRides?.reduce((sum, r) => sum + (r.cost_cents || 0), 0) || 0
    const monthCost = monthRides?.reduce((sum, r) => sum + (r.cost_cents || 0), 0) || 0

    return NextResponse.json({
      today_rides: todayRides?.length || 0,
      today_cost: todayCost,
      month_rides: monthRides?.length || 0,
      month_cost: monthCost,
      pending_rides: pendingRides?.length || 0,
    })
  } catch (error) {
    console.error('[v0] Concierge stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
