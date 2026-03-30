import { routeAIRequest } from '@/lib/ai-router'
import { createClient } from '@/lib/supabase/server'

const AGENT_NAME = 'SecureLink'
const SIGNATURE = 'SecureLink | R&D Intelligence System'

interface MessageOptions {
  userId: string
  type: 'booking_confirmation' | 'pickup_reminder_24h' | 'pickup_reminder_2h' | 'return_reminder_4h' | 'post_trip_review' | 'urgent_alert' | 'custom'
  bookingId?: string
  customMessage?: string
  channels?: ('email' | 'sms')[]
}

interface MessageResult {
  success: boolean
  emailSent?: boolean
  smsSent?: boolean
  error?: string
}

// Get agent name override from database
async function getAgentDisplayName(): Promise<string> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('rd_agents')
      .select('display_name')
      .eq('agent_type', 'securelink')
      .single()
    return data?.display_name || AGENT_NAME
  } catch {
    return AGENT_NAME
  }
}

// Send SMS via Twilio
async function sendSMS(to: string, body: string): Promise<boolean> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.warn('[SecureLink] Twilio not configured')
    return false
  }

  try {
    const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: process.env.TWILIO_PHONE_NUMBER,
          Body: body,
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('[SecureLink] SMS failed:', error)
    return false
  }
}

// Send Email via SendGrid
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[SecureLink] SendGrid not configured')
    return false
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { 
          email: process.env.SENDGRID_FROM_EMAIL || 'securelink@rentanddrive.net',
          name: await getAgentDisplayName(),
        },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    })

    return response.ok
  } catch (error) {
    console.error('[SecureLink] Email failed:', error)
    return false
  }
}

// Generate message content using AI
async function generateMessageContent(
  type: string,
  context: Record<string, unknown>
): Promise<{ subject: string; body: string; smsBody: string }> {
  const systemPrompt = `You are SecureLink, the communications AI for Rent and Drive car rental platform.
Your tone is professional, friendly, and helpful. Keep messages concise but warm.
Always sign messages with: "${SIGNATURE}"
For SMS: Keep under 160 characters, no signature needed.`

  const prompts: Record<string, string> = {
    booking_confirmation: `Generate a booking confirmation message.
Booking details: ${JSON.stringify(context)}
Include: confirmation number, vehicle info, pickup date/time/location, total cost.`,
    
    pickup_reminder_24h: `Generate a 24-hour pickup reminder.
Booking details: ${JSON.stringify(context)}
Include: pickup time, location, lockbox code reminder, what to bring (license, phone).`,
    
    pickup_reminder_2h: `Generate a 2-hour pickup reminder.
Booking details: ${JSON.stringify(context)}
Include: final reminder, lockbox code, emergency contact.`,
    
    return_reminder_4h: `Generate a 4-hour return reminder.
Booking details: ${JSON.stringify(context)}
Include: return time, return location, fuel level reminder, photo checklist.`,
    
    post_trip_review: `Generate a post-trip review request.
Trip details: ${JSON.stringify(context)}
Ask them to rate their experience, mention they'll earn rewards.`,
    
    urgent_alert: `Generate an urgent alert message.
Alert details: ${JSON.stringify(context)}
Be direct, clear, and include any required actions.`,
  }

  const result = await routeAIRequest({
    taskType: 'communications',
    agentName: AGENT_NAME,
    actionType: `generate_${type}`,
    system: systemPrompt,
    prompt: prompts[type] || `Generate a message: ${JSON.stringify(context)}`,
    maxTokens: 512,
  })

  // Parse AI response to extract subject/body
  const lines = result.text.split('\n')
  const subject = lines.find(l => l.toLowerCase().startsWith('subject:'))?.replace(/^subject:\s*/i, '') || 'Message from Rent and Drive'
  const body = lines.filter(l => !l.toLowerCase().startsWith('subject:')).join('\n').trim()
  
  // Generate SMS version
  const smsResult = await routeAIRequest({
    taskType: 'communications',
    agentName: AGENT_NAME,
    actionType: `generate_${type}_sms`,
    system: 'Convert to SMS under 160 chars. No greeting, just key info.',
    prompt: body.slice(0, 500),
    maxTokens: 64,
  })

  return {
    subject,
    body,
    smsBody: smsResult.text.slice(0, 160),
  }
}

// Main send message function
export async function sendMessage(options: MessageOptions): Promise<MessageResult> {
  const { userId, type, bookingId, customMessage, channels = ['email', 'sms'] } = options
  const supabase = await createClient()

  try {
    // Get user details
    const { data: user } = await supabase
      .from('profiles')
      .select('email, phone, full_name')
      .eq('id', userId)
      .single()

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Get booking details if provided
    let bookingContext: Record<string, unknown> = { userName: user.full_name }
    if (bookingId) {
      const { data: booking } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicles(make, model, year, color, license_plate, pickup_address),
          lockboxes(code)
        `)
        .eq('id', bookingId)
        .single()

      if (booking) {
        bookingContext = {
          ...bookingContext,
          confirmationNumber: booking.id.slice(0, 8).toUpperCase(),
          vehicle: `${booking.vehicles?.year} ${booking.vehicles?.make} ${booking.vehicles?.model}`,
          vehicleColor: booking.vehicles?.color,
          licensePlate: booking.vehicles?.license_plate,
          pickupDate: booking.start_date,
          pickupTime: booking.pickup_time,
          pickupLocation: booking.vehicles?.pickup_address,
          returnDate: booking.end_date,
          returnTime: booking.dropoff_time,
          totalCost: booking.total_price,
          lockboxCode: booking.lockboxes?.code,
        }
      }
    }

    // Generate or use custom message
    let subject: string, body: string, smsBody: string
    if (customMessage) {
      subject = 'Message from Rent and Drive'
      body = `${customMessage}\n\n${SIGNATURE}`
      smsBody = customMessage.slice(0, 160)
    } else {
      const content = await generateMessageContent(type, bookingContext)
      subject = content.subject
      body = content.body
      smsBody = content.smsBody
    }

    // Send through requested channels
    let emailSent = false
    let smsSent = false

    if (channels.includes('email') && user.email) {
      emailSent = await sendEmail(user.email, subject, body.replace(/\n/g, '<br>'))
    }

    if (channels.includes('sms') && user.phone) {
      smsSent = await sendSMS(user.phone, smsBody)
    }

    // Log to notifications table
    await supabase.from('notifications').insert({
      user_id: userId,
      type: type === 'urgent_alert' ? 'urgent' : 'info',
      title: subject,
      message: body.slice(0, 500),
      data: { bookingId, emailSent, smsSent },
    })

    return { success: true, emailSent, smsSent }
  } catch (error) {
    console.error('[SecureLink] Error:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Send pickup reminders (called by cron)
export async function sendPickupReminders(): Promise<{ sent24h: number; sent2h: number }> {
  const supabase = await createClient()
  const now = new Date()
  let sent24h = 0, sent2h = 0

  // 24-hour reminders
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const { data: bookings24h } = await supabase
    .from('bookings')
    .select('id, renter_id')
    .eq('status', 'confirmed')
    .gte('start_date', tomorrow.toISOString().split('T')[0])
    .lt('start_date', new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString().split('T')[0])
    .is('reminder_24h_sent', null)

  for (const booking of bookings24h || []) {
    await sendMessage({
      userId: booking.renter_id,
      type: 'pickup_reminder_24h',
      bookingId: booking.id,
    })
    await supabase.from('bookings').update({ reminder_24h_sent: now.toISOString() }).eq('id', booking.id)
    sent24h++
  }

  // 2-hour reminders
  const twoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const { data: bookings2h } = await supabase
    .from('bookings')
    .select('id, renter_id')
    .eq('status', 'confirmed')
    .lte('start_date', twoHours.toISOString())
    .gte('start_date', now.toISOString())
    .is('reminder_2h_sent', null)

  for (const booking of bookings2h || []) {
    await sendMessage({
      userId: booking.renter_id,
      type: 'pickup_reminder_2h',
      bookingId: booking.id,
    })
    await supabase.from('bookings').update({ reminder_2h_sent: now.toISOString() }).eq('id', booking.id)
    sent2h++
  }

  return { sent24h, sent2h }
}

// Send return reminders (called by cron)
export async function sendReturnReminders(): Promise<{ sent: number }> {
  const supabase = await createClient()
  const now = new Date()
  let sent = 0

  // 4-hour return reminders
  const fourHours = new Date(now.getTime() + 4 * 60 * 60 * 1000)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, renter_id')
    .eq('status', 'active')
    .lte('end_date', fourHours.toISOString())
    .gte('end_date', now.toISOString())
    .is('reminder_return_sent', null)

  for (const booking of bookings || []) {
    await sendMessage({
      userId: booking.renter_id,
      type: 'return_reminder_4h',
      bookingId: booking.id,
    })
    await supabase.from('bookings').update({ reminder_return_sent: now.toISOString() }).eq('id', booking.id)
    sent++
  }

  return { sent }
}

// Send post-trip review requests (called by cron)
export async function sendReviewRequests(): Promise<{ sent: number }> {
  const supabase = await createClient()
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  let sent = 0

  // Bookings completed ~24 hours ago without review
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, renter_id')
    .eq('status', 'completed')
    .lte('end_date', oneDayAgo.toISOString())
    .is('review_request_sent', null)

  for (const booking of bookings || []) {
    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking.id)
      .single()

    if (!existingReview) {
      await sendMessage({
        userId: booking.renter_id,
        type: 'post_trip_review',
        bookingId: booking.id,
      })
      sent++
    }
    await supabase.from('bookings').update({ review_request_sent: now.toISOString() }).eq('id', booking.id)
  }

  return { sent }
}

// Send urgent alert
export async function sendUrgentAlert(
  userId: string,
  alertType: string,
  details: Record<string, unknown>
): Promise<MessageResult> {
  return sendMessage({
    userId,
    type: 'urgent_alert',
    customMessage: `URGENT: ${alertType}\n\n${JSON.stringify(details, null, 2)}`,
    channels: ['email', 'sms'],
  })
}

// Offer to connect host and renter
// This allows any R&D agent to offer establishing a text session or call
export async function offerConnection(options: {
  bookingId: string
  agentName: string
  connectionType: 'text' | 'call'
  initiator: 'host' | 'renter' | 'system'
  reason: string
}): Promise<{ success: boolean; offerId?: string; error?: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'offer_connection',
        booking_id: options.bookingId,
        initiator: options.initiator,
        connection_type: options.connectionType,
        message: options.reason,
        agent_name: options.agentName,
      }),
    })

    const data = await response.json()
    return {
      success: data.success || false,
      offerId: data.offer_id,
      error: data.error,
    }
  } catch (error) {
    console.error('[SecureLink] Connection offer failed:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Quick connect - immediately send contact info to both parties
export async function quickConnect(options: {
  bookingId: string
  agentName: string
  reason: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'accept_connection', // Skip the offer step
        booking_id: options.bookingId,
        initiator: 'system',
        connection_type: 'text',
        message: options.reason,
        agent_name: options.agentName,
      }),
    })

    const data = await response.json()
    return { success: data.success || false, error: data.error }
  } catch (error) {
    console.error('[SecureLink] Quick connect failed:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Alias for backward compatibility
export const SecureLink = {
  quickConnect,
  sendMessage,
  sendUrgentAlert,
  offerConnection,
}

// Class wrapper for API routes
export class SecureLinkAgent {
  async sendBookingConfirmation(bookingId: string) {
    return sendMessage({ userId: '', type: 'booking_confirmation', bookingId })
  }
  async sendReminder(bookingId: string, type: 'pickup_reminder_24h' | 'pickup_reminder_2h' | 'return_reminder_4h') {
    return sendMessage({ userId: '', type, bookingId })
  }
  async sendReviewRequest(bookingId: string) {
    return sendMessage({ userId: '', type: 'post_trip_review', bookingId })
  }
  async sendUrgentAlert(userId: string, message: string) {
    return sendUrgentAlert(userId, message)
  }
  async quickConnect(bookingId: string, reason: string) {
    return quickConnect({ bookingId, agentName: 'SecureLink', reason })
  }
}
