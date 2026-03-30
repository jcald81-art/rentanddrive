import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Vercel cron config - runs every hour
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Create admin client for server-side operations
function createAdminClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const results: { booking_id: string; status: string; message?: string }[] = []

  try {
    // Calculate time window for 24-hour reminders
    // Find bookings starting between 23-25 hours from now
    const now = new Date()
    const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    // Fetch bookings starting in ~24 hours that haven't received this reminder
    const { data: upcomingBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, start_date, renter_id')
      .gte('start_date', in23Hours.toISOString())
      .lte('start_date', in25Hours.toISOString())
      .in('status', ['confirmed', 'pending'])

    if (fetchError) {
      console.error('[R&D Cron] Failed to fetch bookings:', fetchError)
      return NextResponse.json({ 
        error: 'Failed to fetch bookings',
        details: fetchError.message 
      }, { status: 500 })
    }

    if (!upcomingBookings || upcomingBookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bookings requiring 24hr reminder',
        processed: 0
      })
    }

    // Check which bookings already received the 24hr reminder
    const bookingIds = upcomingBookings.map(b => b.id)
    const { data: existingMessages } = await supabase
      .from('renter_messages')
      .select('booking_id')
      .in('booking_id', bookingIds)
      .eq('template_used', 'pickup_reminder_24hr')

    const alreadyNotified = new Set(existingMessages?.map(m => m.booking_id) || [])
    const bookingsToNotify = upcomingBookings.filter(b => !alreadyNotified.has(b.id))

    if (bookingsToNotify.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All eligible bookings already notified',
        processed: 0
      })
    }

    // Get the base URL for internal API calls
    const protocol = process.env.VERCEL_URL ? 'https' : 'http'
    const host = process.env.VERCEL_URL || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

    // Trigger communications API for each booking
    for (const booking of bookingsToNotify) {
      try {
        const response = await fetch(`${baseUrl}/api/agents/communications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            booking_id: booking.id,
            trigger_event: 'pickup_reminder_24hr',
            send_sms: true
          })
        })

        const result = await response.json()

        if (response.ok) {
          results.push({
            booking_id: booking.id,
            status: 'success',
            message: result.message
          })
        } else {
          results.push({
            booking_id: booking.id,
            status: 'failed',
            message: result.error
          })
        }
      } catch (error) {
        results.push({
          booking_id: booking.id,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Log cron execution to agent_logs
    await supabase
      .from('agent_logs')
      .insert({
        agent_name: 'R&D Communications Cron',
        action_type: 'pickup_reminder_24hr_batch',
        input_data: {
          bookings_found: upcomingBookings.length,
          bookings_to_notify: bookingsToNotify.length,
          time_window: {
            from: in23Hours.toISOString(),
            to: in25Hours.toISOString()
          }
        },
        output_data: {
          results,
          success_count: results.filter(r => r.status === 'success').length,
          failed_count: results.filter(r => r.status !== 'success').length
        },
        model_used: 'cron',
        tokens_used: 0,
        cost_cents: 0,
        status: 'completed'
      })

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} booking reminders`,
      processed: results.length,
      results
    })

  } catch (error) {
    console.error('[R&D Cron] Communications cron error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
