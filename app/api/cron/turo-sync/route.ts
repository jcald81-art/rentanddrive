import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Vercel Cron: Every 15 minutes
// Syncs Turo iCal calendars to prevent double-bookings

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('[Cron] turo-sync: Unauthorized request')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Cron] turo-sync: Starting Turo calendar sync...')
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    // Get all vehicles with Turo iCal URLs
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, turo_ical_url, make, model')
      .not('turo_ical_url', 'is', null)

    if (vehiclesError) {
      throw new Error(`Failed to fetch vehicles: ${vehiclesError.message}`)
    }

    console.log(`[Cron] turo-sync: Found ${vehicles?.length || 0} vehicles with Turo calendars`)

    const results = {
      synced: 0,
      failed: 0,
      blockedDates: 0,
      errors: [] as string[],
    }

    for (const vehicle of vehicles || []) {
      try {
        // Fetch iCal from Turo
        const icalResponse = await fetch(vehicle.turo_ical_url, {
          headers: { 'User-Agent': 'RentAndDrive-CalSync/1.0' },
        })

        if (!icalResponse.ok) {
          throw new Error(`HTTP ${icalResponse.status}`)
        }

        const icalText = await icalResponse.text()
        const blockedPeriods = parseICalEvents(icalText)

        // Clear existing Turo blocks for this vehicle
        await supabase
          .from('blocked_dates')
          .delete()
          .eq('vehicle_id', vehicle.id)
          .eq('source', 'turo')

        // Insert new blocked periods
        if (blockedPeriods.length > 0) {
          const { error: insertError } = await supabase
            .from('blocked_dates')
            .insert(
              blockedPeriods.map((period) => ({
                vehicle_id: vehicle.id,
                start_date: period.start,
                end_date: period.end,
                source: 'turo',
                reason: period.summary || 'Turo booking',
              }))
            )

          if (insertError) {
            throw new Error(`Insert failed: ${insertError.message}`)
          }

          results.blockedDates += blockedPeriods.length
        }

        results.synced++
        console.log(`[Cron] turo-sync: Synced ${vehicle.make} ${vehicle.model} - ${blockedPeriods.length} blocked periods`)
      } catch (err) {
        results.failed++
        const errorMsg = `${vehicle.make} ${vehicle.model}: ${err instanceof Error ? err.message : 'Unknown error'}`
        results.errors.push(errorMsg)
        console.error(`[Cron] turo-sync: Failed to sync ${errorMsg}`)
      }
    }

    // Log sync run
    await supabase.from('cron_logs').insert({
      job_name: 'turo-sync',
      status: results.failed === 0 ? 'success' : 'partial',
      duration_ms: Date.now() - startTime,
      details: results,
    })

    console.log(`[Cron] turo-sync: Completed in ${Date.now() - startTime}ms`, results)

    return NextResponse.json({
      success: true,
      ...results,
      duration_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('[Cron] turo-sync: Fatal error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

// Parse iCal VEVENT blocks
function parseICalEvents(icalText: string): Array<{ start: string; end: string; summary?: string }> {
  const events: Array<{ start: string; end: string; summary?: string }> = []
  const eventBlocks = icalText.split('BEGIN:VEVENT')

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i]
    const dtstart = block.match(/DTSTART[^:]*:(\d{8})/)?.[1]
    const dtend = block.match(/DTEND[^:]*:(\d{8})/)?.[1]
    const summary = block.match(/SUMMARY:([^\r\n]+)/)?.[1]

    if (dtstart && dtend) {
      events.push({
        start: `${dtstart.slice(0, 4)}-${dtstart.slice(4, 6)}-${dtstart.slice(6, 8)}`,
        end: `${dtend.slice(0, 4)}-${dtend.slice(4, 6)}-${dtend.slice(6, 8)}`,
        summary: summary?.trim(),
      })
    }
  }

  return events
}
