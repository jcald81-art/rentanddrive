import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Vercel Cron: Every 6 hours
// Monitor reviews and alert hosts on low ratings

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Cron] review-monitor: Checking recent reviews...')
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)

    // Get recent reviews
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        id, rating, comment, created_at,
        booking:bookings(
          id,
          vehicle:vehicles(id, make, model, year, host_id),
          renter:profiles!bookings_renter_id_fkey(first_name, last_name)
        )
      `)
      .gte('created_at', sixHoursAgo.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    console.log(`[Cron] review-monitor: Found ${reviews?.length || 0} recent reviews`)

    const alerts = { low_ratings: 0, flagged: 0, notifications_sent: 0 }

    for (const review of reviews || []) {
      const booking = review.booking as {
        vehicle?: { id: string; make: string; model: string; year: number; host_id: string }
        renter?: { first_name: string; last_name: string }
      }
      
      if (!booking?.vehicle) continue

      // Alert host on low rating (3 stars or below)
      if (review.rating <= 3) {
        alerts.low_ratings++

        await supabase.from('notifications').insert({
          user_id: booking.vehicle.host_id,
          type: 'low_rating_alert',
          title: 'Low Rating Received',
          message: `${booking.renter?.first_name || 'A renter'} left a ${review.rating}-star review for your ${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`,
          data: {
            review_id: review.id,
            vehicle_id: booking.vehicle.id,
            rating: review.rating,
          },
        })
        alerts.notifications_sent++
      }

      // Flag potentially inappropriate reviews for admin
      const flaggedWords = ['scam', 'fraud', 'dangerous', 'unsafe', 'lawsuit', 'police']
      const commentLower = (review.comment || '').toLowerCase()
      
      if (flaggedWords.some(word => commentLower.includes(word))) {
        alerts.flagged++

        // Notify admins
        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin')

        for (const admin of admins || []) {
          await supabase.from('notifications').insert({
            user_id: admin.id,
            type: 'review_flagged',
            title: 'Review Flagged for Moderation',
            message: `Review for ${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model} contains flagged content`,
            data: { review_id: review.id },
          })
          alerts.notifications_sent++
        }

        // Mark review for moderation
        await supabase
          .from('reviews')
          .update({ flagged: true, flagged_at: new Date().toISOString() })
          .eq('id', review.id)
      }
    }

    // Update vehicle ratings
    const vehicleIds = [...new Set(
      (reviews || [])
        .map(r => (r.booking as { vehicle?: { id: string } })?.vehicle?.id)
        .filter(Boolean)
    )]

    for (const vehicleId of vehicleIds) {
      const { data: vehicleReviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('vehicle_id', vehicleId)

      if (vehicleReviews && vehicleReviews.length > 0) {
        const avgRating = vehicleReviews.reduce((sum, r) => sum + r.rating, 0) / vehicleReviews.length

        await supabase
          .from('vehicles')
          .update({
            rating: Math.round(avgRating * 10) / 10,
            review_count: vehicleReviews.length,
          })
          .eq('id', vehicleId)
      }
    }

    // Log cron run
    await supabase.from('cron_logs').insert({
      job_name: 'review-monitor',
      status: 'success',
      duration_ms: Date.now() - startTime,
      details: { reviews_processed: reviews?.length || 0, ...alerts },
    })

    console.log(`[Cron] review-monitor: Completed in ${Date.now() - startTime}ms`, alerts)

    return NextResponse.json({
      success: true,
      reviews_processed: reviews?.length || 0,
      ...alerts,
      duration_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('[Cron] review-monitor: Error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
