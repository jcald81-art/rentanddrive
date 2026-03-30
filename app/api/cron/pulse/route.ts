import { NextResponse } from 'next/server'
import { runFleetHealthCheck } from '@/lib/agents/pulse'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

// Runs daily at 6am - fleet health check
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runFleetHealthCheck()

    return NextResponse.json({
      success: true,
      results: {
        fleetHealthScore: result.fleetHealthScore,
        vehiclesNeedingAttention: result.vehiclesNeedingAttention.length,
        drivingBehaviorFlags: result.drivingBehaviorFlags.length,
        maintenancePredictions: result.maintenancePredictions.length,
        criticalAlerts: result.alerts.filter(a => a.severity === 'critical').length,
      },
      summary: result.summary,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron Pulse] Error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
