import { NextResponse } from 'next/server'
import { analyzeAllVehiclePricing } from '@/lib/agents/dollar'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

// Runs daily at 2am - prices all active vehicles
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await analyzeAllVehiclePricing()

    return NextResponse.json({
      success: true,
      results: {
        totalVehicles: result.totalVehicles,
        autoApplied: result.autoApplied,
        recommendationsGenerated: result.recommendations.length,
        avgConfidence: result.recommendations.length > 0
          ? Math.round(result.recommendations.reduce((sum, r) => sum + r.confidence, 0) / result.recommendations.length)
          : 0,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron Dollar] Error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
