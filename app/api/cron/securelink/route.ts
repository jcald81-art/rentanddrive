import { NextResponse } from 'next/server'
import { sendPickupReminders, sendReturnReminders, sendReviewRequests } from '@/lib/agents/securelink'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

// Runs hourly - sends booking reminders
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [pickupResult, returnResult, reviewResult] = await Promise.all([
      sendPickupReminders(),
      sendReturnReminders(),
      sendReviewRequests(),
    ])

    return NextResponse.json({
      success: true,
      results: {
        pickup: pickupResult,
        return: returnResult,
        reviews: reviewResult,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron SecureLink] Error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
