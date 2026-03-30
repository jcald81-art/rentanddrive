import { NextResponse } from 'next/server'
import { analyzeNewReviews, updateAllRenterScores } from '@/lib/agents/shield'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

// Runs daily at 6am - analyzes new reviews and updates renter scores
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [reviewsResult, scoresResult] = await Promise.all([
      analyzeNewReviews(),
      updateAllRenterScores(),
    ])

    return NextResponse.json({
      success: true,
      results: {
        reviews: {
          analyzed: reviewsResult.analyzed,
          flagged: reviewsResult.flagged,
        },
        renterScores: {
          updated: scoresResult.updated,
          flagged: scoresResult.flagged,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron Shield] Error:', error)
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
