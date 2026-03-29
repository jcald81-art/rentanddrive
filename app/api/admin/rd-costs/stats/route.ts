import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || '30d'

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  
  let daysBack = 30
  if (period === '7d') daysBack = 7
  if (period === '90d') daysBack = 90
  
  const periodStart = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

  const [
    { data: thisMonthLogs },
    { data: lastMonthLogs },
    { data: periodLogs },
    { count: bookingsThisMonth },
  ] = await Promise.all([
    supabase.from('rd_agent_log')
      .select('cost_usd')
      .gte('created_at', firstOfMonth.toISOString()),
    supabase.from('rd_agent_log')
      .select('cost_usd')
      .gte('created_at', firstOfLastMonth.toISOString())
      .lt('created_at', firstOfMonth.toISOString()),
    supabase.from('rd_agent_log')
      .select('cost_usd')
      .gte('created_at', periodStart.toISOString()),
    supabase.from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstOfMonth.toISOString()),
  ])

  const totalThisMonth = thisMonthLogs?.reduce((sum, l) => sum + (l.cost_usd || 0), 0) || 0
  const totalLastMonth = lastMonthLogs?.reduce((sum, l) => sum + (l.cost_usd || 0), 0) || 0
  const totalApiCalls = periodLogs?.length || 0
  
  const costPerBooking = bookingsThisMonth && bookingsThisMonth > 0
    ? totalThisMonth / bookingsThisMonth
    : 0

  // Budget limit from platform settings (default $500/month)
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'ai_budget_limit')
    .single()
  
  const budgetLimit = settings?.value ? parseFloat(settings.value) : 500

  return NextResponse.json({
    total_this_month: totalThisMonth,
    total_last_month: totalLastMonth,
    budget_limit: budgetLimit,
    projected_monthly: totalThisMonth * (30 / now.getDate()),
    cost_per_booking: costPerBooking,
    total_api_calls: totalApiCalls,
  })
}
