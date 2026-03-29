import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get host's vehicles for market comparison
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, make, model, year, daily_rate, category')
      .eq('host_id', user.id)

    // Get latest competitor snapshots
    const { data: competitorSnapshots } = await supabase
      .from('competitor_snapshots')
      .select('*')
      .order('captured_at', { ascending: false })
      .limit(50)

    // Get pricing history for host's vehicles
    const vehicleIds = vehicles?.map(v => v.id) || []
    const { data: pricingHistory } = await supabase
      .from('pricing_history')
      .select('*')
      .in('vehicle_id', vehicleIds)
      .order('created_at', { ascending: false })
      .limit(100)

    // Get pending pricing recommendations
    const pendingRecommendations = pricingHistory?.filter(p => 
      p.was_applied === false && p.confidence >= 0.7
    ) || []

    // Calculate market position
    const categoryRates: Record<string, number[]> = {}
    competitorSnapshots?.forEach(snap => {
      if (!categoryRates[snap.category]) categoryRates[snap.category] = []
      categoryRates[snap.category].push(snap.daily_rate_cents / 100)
    })

    const marketPosition = vehicles?.map(vehicle => {
      const catRates = categoryRates[vehicle.category] || []
      const avgMarketRate = catRates.length 
        ? catRates.reduce((a, b) => a + b, 0) / catRates.length 
        : vehicle.daily_rate

      const position = vehicle.daily_rate < avgMarketRate * 0.9 
        ? 'below' 
        : vehicle.daily_rate > avgMarketRate * 1.1 
          ? 'above' 
          : 'competitive'

      return {
        vehicleId: vehicle.id,
        name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        currentRate: vehicle.daily_rate,
        avgMarketRate: Math.round(avgMarketRate),
        position,
        priceDiff: Math.round(((vehicle.daily_rate - avgMarketRate) / avgMarketRate) * 100),
      }
    }) || []

    // Get upcoming events (simulated for now)
    const upcomingEvents = [
      { name: 'Hot August Nights', date: '2024-08-08', demandMultiplier: 1.8, category: 'all' },
      { name: 'Reno Air Races', date: '2024-09-13', demandMultiplier: 1.5, category: 'all' },
      { name: 'Ski Season Start', date: '2024-11-15', demandMultiplier: 1.6, category: 'suv' },
    ]

    // Best performing days analysis
    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_date, total_price_cents')
      .in('vehicle_id', vehicleIds)
      .eq('status', 'completed')
      .limit(200)

    const dayPerformance: Record<number, { count: number; revenue: number }> = {}
    bookings?.forEach(b => {
      const day = new Date(b.start_date).getDay()
      if (!dayPerformance[day]) dayPerformance[day] = { count: 0, revenue: 0 }
      dayPerformance[day].count++
      dayPerformance[day].revenue += b.total_price_cents || 0
    })

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const bestDays = Object.entries(dayPerformance)
      .map(([day, stats]) => ({
        day: dayNames[parseInt(day)],
        bookings: stats.count,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    return NextResponse.json({
      marketPosition,
      pendingRecommendations,
      competitorRates: competitorSnapshots?.slice(0, 20) || [],
      upcomingEvents,
      bestDays,
      vehicles: vehicles || [],
    })
  } catch (error) {
    console.error('Briefing room error:', error)
    return NextResponse.json({ error: 'Failed to fetch briefing data' }, { status: 500 })
  }
}
