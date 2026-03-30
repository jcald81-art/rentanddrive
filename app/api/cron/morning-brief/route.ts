import { NextResponse } from 'next/server'
import { routeAIRequest } from '@/lib/ai-router'
import { createClient } from '@/lib/supabase/server'
import { sendMessage } from '@/lib/agents/securelink'
import { getLatestMarketSnapshot, getRealTimeConditions } from '@/lib/agents/commandcontrol'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

// Runs daily at 5:30am - generates and sends morning briefs
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Get all hosts who have morning briefs enabled
    const { data: hosts } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'host')
      .eq('morning_brief_enabled', true)

    if (!hosts || hosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hosts with morning briefs enabled',
        timestamp: new Date().toISOString(),
      })
    }

    // Get market snapshot and conditions
    const [marketSnapshot, conditions] = await Promise.all([
      getLatestMarketSnapshot(),
      getRealTimeConditions(),
    ])

    let briefsSent = 0

    for (const host of hosts) {
      try {
        // Get host's active vehicles
        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('id, make, model, year, daily_rate, status')
          .eq('host_id', host.id)
          .eq('status', 'active')

        // Get today's bookings
        const { data: todayBookings } = await supabase
          .from('bookings')
          .select('*, vehicles(make, model, year), profiles:renter_id(full_name)')
          .gte('start_date', todayStr)
          .lt('start_date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .in('vehicle_id', (vehicles || []).map(v => v.id))

        // Get returns today
        const { data: todayReturns } = await supabase
          .from('bookings')
          .select('*, vehicles(make, model, year), profiles:renter_id(full_name)')
          .eq('status', 'active')
          .gte('end_date', todayStr)
          .lt('end_date', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .in('vehicle_id', (vehicles || []).map(v => v.id))

        // Get pending reviews (needs response)
        const { data: pendingReviews } = await supabase
          .from('reviews')
          .select('id, rating, comment, created_at')
          .is('host_response', null)
          .order('created_at', { ascending: false })
          .limit(3)

        // Get unresolved alerts
        const { data: alerts } = await supabase
          .from('fleet_alerts')
          .select('*')
          .eq('is_resolved', false)
          .in('vehicle_id', (vehicles || []).map(v => v.id))
          .order('severity', { ascending: false })
          .limit(5)

        // Generate AI brief
        const briefContext = {
          hostName: host.full_name,
          date: today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
          fleetSize: vehicles?.length || 0,
          pickupsToday: todayBookings?.length || 0,
          returnsToday: todayReturns?.length || 0,
          pendingReviews: pendingReviews?.length || 0,
          unresolvedAlerts: alerts?.length || 0,
          weather: conditions.weather,
          marketAvgRate: marketSnapshot?.avgCompetitorRate || 100,
          upcomingEvents: marketSnapshot?.upcomingDemandEvents.slice(0, 3) || [],
        }

        const result = await routeAIRequest({
          taskType: 'communications',
          agentName: 'MorningBrief',
          actionType: 'generate_brief',
          system: `You are SecureLink generating a morning brief for a Rent and Drive host.
Be concise, friendly, and actionable. Format as:
- Greeting with weather
- Today's activity (pickups/returns)
- Alerts or action items
- Market insight
- Motivational close

Keep under 300 words. Sign off with "SecureLink | R&D Intelligence System"`,
          prompt: JSON.stringify(briefContext),
          maxTokens: 512,
        })

        // Save to morning_briefs table
        await supabase.from('morning_briefs').insert({
          host_id: host.id,
          brief_date: todayStr,
          content: result.text,
          metrics: {
            pickups: todayBookings?.length || 0,
            returns: todayReturns?.length || 0,
            pendingReviews: pendingReviews?.length || 0,
            alerts: alerts?.length || 0,
          },
          weather: conditions.weather,
          market_data: {
            avgRate: marketSnapshot?.avgCompetitorRate,
            events: marketSnapshot?.upcomingDemandEvents.slice(0, 3),
          },
        })

        // Send via SecureLink
        await sendMessage({
          userId: host.id,
          type: 'custom',
          customMessage: result.text,
          channels: ['email'],
        })

        briefsSent++
      } catch (error) {
        console.error(`[Morning Brief] Failed for host ${host.id}:`, error)
      }

      await new Promise(r => setTimeout(r, 500)) // Rate limit
    }

    return NextResponse.json({
      success: true,
      results: {
        hostsProcessed: hosts.length,
        briefsSent,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron Morning Brief] Error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
