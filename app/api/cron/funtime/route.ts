import { NextResponse } from 'next/server'
import { runDailyFuntime } from '@/lib/agents/funtime'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

// Runs daily at midnight - XP and badge awards
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runDailyFuntime()

    return NextResponse.json({
      success: true,
      results: {
        xpAwarded: result.xpAwarded,
        badgesAwarded: result.badgesAwarded,
        leaderboardUpdated: result.leaderboardUpdated,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron Funtime] Error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
