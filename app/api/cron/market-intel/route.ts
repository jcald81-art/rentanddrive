import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Vercel Cron: 8am Mondays
// Weekly market intelligence report

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Cron] market-intel: Starting weekly market analysis...')
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // This week's bookings
    const { data: thisWeekBookings } = await supabase
      .from('bookings')
      .select('id, total_price, start_date')
      .gte('created_at', weekAgo.toISOString())

    // Last week's bookings
    const { data: lastWeekBookings } = await supabase
      .from('bookings')
      .select('id, total_price')
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', weekAgo.toISOString())

    // Category breakdown
    const { data: categoryStats } = await supabase
      .from('bookings')
      .select(`
        vehicles(category),
        total_price
      `)
      .gte('created_at', weekAgo.toISOString())

    // Top performing vehicles
    const { data: topVehicles } = await supabase
      .from('vehicles')
      .select(`
        id, make, model, year, daily_rate,
        bookings:bookings(id, total_price)
      `)
      .eq('status', 'active')
      .limit(10)

    // Calculate metrics
    const thisWeekRevenue = (thisWeekBookings || []).reduce((sum, b) => sum + (b.total_price || 0), 0)
    const lastWeekRevenue = (lastWeekBookings || []).reduce((sum, b) => sum + (b.total_price || 0), 0)
    const revenueGrowth = lastWeekRevenue > 0 
      ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100).toFixed(1)
      : 'N/A'

    // Category performance
    const categoryBreakdown: Record<string, { bookings: number; revenue: number }> = {}
    for (const booking of categoryStats || []) {
      const category = (booking.vehicles as { category?: string })?.category || 'unknown'
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { bookings: 0, revenue: 0 }
      }
      categoryBreakdown[category].bookings++
      categoryBreakdown[category].revenue += booking.total_price || 0
    }

    const report = {
      period: `${weekAgo.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`,
      metrics: {
        total_bookings: thisWeekBookings?.length || 0,
        total_revenue: thisWeekRevenue,
        revenue_growth_pct: revenueGrowth,
        avg_booking_value: thisWeekBookings?.length 
          ? Math.round(thisWeekRevenue / thisWeekBookings.length) 
          : 0,
      },
      category_performance: categoryBreakdown,
      top_vehicles: (topVehicles || [])
        .map(v => ({
          vehicle: `${v.year} ${v.make} ${v.model}`,
          bookings: (v.bookings || []).length,
          revenue: (v.bookings || []).reduce((sum: number, b: { total_price?: number }) => 
            sum + (b.total_price || 0), 0
          ),
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
    }

    // Store report
    await supabase.from('market_reports').insert({
      report_date: now.toISOString().split('T')[0],
      report_type: 'weekly',
      data: report,
    })

    // Notify admins
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')

    for (const admin of admins || []) {
      await supabase.from('notifications').insert({
        user_id: admin.id,
        type: 'market_report',
        title: 'Weekly Market Report Ready',
        message: `Revenue: $${thisWeekRevenue.toLocaleString()} (${revenueGrowth}% vs last week)`,
        data: { report_date: now.toISOString().split('T')[0] },
      })
    }

    // Log cron run
    await supabase.from('cron_logs').insert({
      job_name: 'market-intel',
      status: 'success',
      duration_ms: Date.now() - startTime,
      details: report.metrics,
    })

    console.log(`[Cron] market-intel: Completed in ${Date.now() - startTime}ms`)

    return NextResponse.json({ success: true, report, duration_ms: Date.now() - startTime })
  } catch (error) {
    console.error('[Cron] market-intel: Error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
