import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Vercel Cron: Every 10 minutes
// Process SMS message queue

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Cron] send-messages: Processing SMS queue...')
  const startTime = Date.now()

  try {
    const supabase = await createClient()

    // Get pending messages (limit 50 per run)
    const { data: messages, error } = await supabase
      .from('message_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50)

    if (error) throw error

    console.log(`[Cron] send-messages: Found ${messages?.length || 0} pending messages`)

    const results = { sent: 0, failed: 0, errors: [] as string[] }

    for (const message of messages || []) {
      try {
        // Send via Twilio (or your SMS provider)
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`
          
          const response = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: message.to_phone,
              From: process.env.TWILIO_PHONE_NUMBER || '',
              Body: message.body,
            }),
          })

          if (!response.ok) {
            throw new Error(`Twilio error: ${response.status}`)
          }

          const twilioData = await response.json()

          // Mark as sent
          await supabase
            .from('message_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              provider_id: twilioData.sid,
            })
            .eq('id', message.id)

          results.sent++
        } else {
          // No Twilio configured - mark as skipped
          await supabase
            .from('message_queue')
            .update({
              status: 'skipped',
              error: 'Twilio not configured',
            })
            .eq('id', message.id)

          console.log(`[Cron] send-messages: Skipped (Twilio not configured): ${message.id}`)
        }
      } catch (err) {
        results.failed++
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        results.errors.push(`${message.id}: ${errorMsg}`)

        // Mark as failed
        await supabase
          .from('message_queue')
          .update({
            status: 'failed',
            error: errorMsg,
            retry_count: (message.retry_count || 0) + 1,
          })
          .eq('id', message.id)
      }
    }

    // Log cron run
    await supabase.from('cron_logs').insert({
      job_name: 'send-messages',
      status: results.failed === 0 ? 'success' : 'partial',
      duration_ms: Date.now() - startTime,
      details: results,
    })

    console.log(`[Cron] send-messages: Completed in ${Date.now() - startTime}ms`, results)

    return NextResponse.json({
      success: true,
      ...results,
      duration_ms: Date.now() - startTime,
    })
  } catch (error) {
    console.error('[Cron] send-messages: Error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
