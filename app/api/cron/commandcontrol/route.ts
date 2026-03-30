import { NextResponse } from 'next/server'
import { runWeeklyMarketScan } from '@/lib/agents/commandcontrol'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

// Runs Sunday at 6am - weekly market intelligence scan
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runWeeklyMarketScan()

    return NextResponse.json({
      success: true,
      results: {
        avgCompetitorRate: result.avgCompetitorRate,
        ratePosition: result.ratePosition,
        upcomingEvents: result.upcomingDemandEvents.length,
        alertsGenerated: result.alerts.length,
        turoListings: result.turoListingCount,
      },
      summary: result.weeklySummary,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron CommandControl] Error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
