import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Trigger event types
type TriggerEvent = 
  | 'booking_confirmed'
  | 'pickup_reminder_24hr'
  | 'pickup_reminder_2hr'
  | 'return_reminder_4hr'
  | 'post_trip_review_request'

// Create admin client for server-side operations
function createAdminClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// System prompt for R&D Communications Agent
const SYSTEM_PROMPT = `You are the communications agent for Rent and Drive LLC, a premium car rental service in Reno/Tahoe Nevada. Write friendly, professional, concise SMS messages under 160 characters. Always include the vehicle name and relevant trip details. Tone: warm but efficient.

Important guidelines:
- Keep messages under 160 characters
- Include the vehicle make/model
- Include relevant dates/times
- Be warm but professional
- End with "- R&D Team" or similar brief signature
- No emojis unless specifically requested`

// Generate context-specific prompt based on trigger event
function getEventPrompt(event: TriggerEvent, booking: any, vehicle: any, renter: any): string {
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  const pickupDate = new Date(booking.start_date).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
  const pickupTime = new Date(booking.start_date).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit' 
  })
  const returnDate = new Date(booking.end_date).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
  const renterFirstName = renter.full_name?.split(' ')[0] || 'there'

  switch (event) {
    case 'booking_confirmed':
      return `Write an SMS confirming a booking for ${renterFirstName}. Vehicle: ${vehicleName}. Pickup: ${pickupDate} at ${pickupTime}. Include booking number ${booking.id.slice(0, 8).toUpperCase()}.`
    
    case 'pickup_reminder_24hr':
      return `Write an SMS reminder for ${renterFirstName} that their ${vehicleName} pickup is tomorrow, ${pickupDate} at ${pickupTime}. Mention they'll receive pickup location details soon.`
    
    case 'pickup_reminder_2hr':
      return `Write an urgent SMS for ${renterFirstName} that their ${vehicleName} is ready for pickup in 2 hours. Location: ${booking.pickup_location || 'Reno area'}.`
    
    case 'return_reminder_4hr':
      return `Write an SMS reminder for ${renterFirstName} that their ${vehicleName} is due back in 4 hours by ${returnDate}. Ask them to return with the same fuel level.`
    
    case 'post_trip_review_request':
      return `Write an SMS thanking ${renterFirstName} for renting the ${vehicleName} and kindly asking them to leave a review. Keep it brief and appreciative.`
    
    default:
      return `Write a general check-in SMS for ${renterFirstName} regarding their ${vehicleName} rental.`
  }
}

// Send SMS via Twilio
async function sendSMS(to: string, message: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    console.log('[R&D Agent] Twilio not configured, skipping SMS send')
    return false
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: message,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('[R&D Agent] Twilio error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[R&D Agent] Failed to send SMS:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const { booking_id, trigger_event, send_sms = true } = body

    // Validate inputs
    if (!booking_id) {
      return NextResponse.json({ error: 'booking_id is required' }, { status: 400 })
    }

    const validEvents: TriggerEvent[] = [
      'booking_confirmed',
      'pickup_reminder_24hr',
      'pickup_reminder_2hr',
      'return_reminder_4hr',
      'post_trip_review_request'
    ]

    if (!trigger_event || !validEvents.includes(trigger_event)) {
      return NextResponse.json({ 
        error: 'Invalid trigger_event. Must be one of: ' + validEvents.join(', ') 
      }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Fetch booking with vehicle and renter details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        vehicles (
          id, make, model, year, location_city
        )
      `)
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ 
        error: 'Booking not found',
        details: bookingError?.message 
      }, { status: 404 })
    }

    // Fetch renter details
    const { data: renter, error: renterError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, email')
      .eq('id', booking.renter_id)
      .single()

    if (renterError || !renter) {
      // Try to get user metadata from auth.users
      const { data: authUser } = await supabase.auth.admin.getUserById(booking.renter_id)
      if (!authUser?.user) {
        return NextResponse.json({ 
          error: 'Renter not found',
          details: renterError?.message 
        }, { status: 404 })
      }
      // Use auth user metadata as fallback
      const fallbackRenter = {
        id: authUser.user.id,
        full_name: authUser.user.user_metadata?.full_name || 'Valued Customer',
        phone: authUser.user.phone || authUser.user.user_metadata?.phone,
        email: authUser.user.email
      }
      Object.assign(renter || {}, fallbackRenter)
    }

    const vehicle = booking.vehicles

    // Generate message using Claude
    const eventPrompt = getEventPrompt(trigger_event, booking, vehicle, renter)
    
    const { text: generatedMessage, usage } = await generateText({
      model: 'anthropic/claude-sonnet-4-6',
      system: SYSTEM_PROMPT,
      prompt: eventPrompt,
      maxOutputTokens: 100,
    })

    // Estimate cost (Claude Sonnet pricing: ~$3/1M input, ~$15/1M output)
    const inputTokens = usage?.promptTokens || 0
    const outputTokens = usage?.completionTokens || 0
    const estimatedCostCents = Math.round(
      (inputTokens * 0.003 / 1000 + outputTokens * 0.015 / 1000) * 100
    )

    // Send SMS if configured and requested
    let smsSent = false
    let deliveredAt = null
    
    if (send_sms && renter?.phone) {
      smsSent = await sendSMS(renter.phone, generatedMessage)
      if (smsSent) {
        deliveredAt = new Date().toISOString()
      }
    }

    // Log to agent_logs table
    const { error: logError } = await supabase
      .from('agent_logs')
      .insert({
        agent_name: 'R&D Communications',
        action_type: trigger_event,
        input_data: {
          booking_id,
          trigger_event,
          renter_name: renter?.full_name,
          vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          prompt: eventPrompt
        },
        output_data: {
          message: generatedMessage,
          sms_sent: smsSent,
          phone: renter?.phone ? `***${renter.phone.slice(-4)}` : null
        },
        model_used: 'claude-sonnet-4-6',
        tokens_used: inputTokens + outputTokens,
        cost_cents: estimatedCostCents,
        status: smsSent ? 'completed' : (send_sms ? 'sms_failed' : 'generated'),
      })

    if (logError) {
      console.error('[R&D Agent] Failed to log action:', logError)
    }

    // Log to renter_messages table
    const { error: messageLogError } = await supabase
      .from('renter_messages')
      .insert({
        booking_id,
        direction: 'out',
        channel: 'sms',
        message_body: generatedMessage,
        sent_at: new Date().toISOString(),
        delivered_at: deliveredAt,
        template_used: trigger_event
      })

    if (messageLogError) {
      console.error('[R&D Agent] Failed to log message:', messageLogError)
    }

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: generatedMessage,
      sms_sent: smsSent,
      booking_id,
      trigger_event,
      vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      tokens_used: inputTokens + outputTokens,
      cost_cents: estimatedCostCents,
      duration_ms: duration
    })

  } catch (error) {
    console.error('[R&D Agent] Communications error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
