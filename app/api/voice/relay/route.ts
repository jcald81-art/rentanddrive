import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// NOTE: This is a REST API stub for the WebSocket relay logic.
// In production, deploy a separate WebSocket server on Fly.io or Railway
// that handles the actual real-time conversation with Twilio ConversationRelay.
//
// This file documents the expected message handling logic.

interface CallerContext {
  hasRental: boolean
  renterName?: string
  vehicleYear?: string
  vehicleMake?: string
  vehicleModel?: string
  hostName?: string
  hostPhone?: string
  startDate?: string
  endDate?: string
  status?: string
  weatherAlerts?: string[]
  recentAlerts?: string[]
  isHost: boolean
  listingCount?: number
  activeRentals?: number
}

async function getCallerContext(phoneNumber: string): Promise<CallerContext> {
  const supabase = await createClient()
  
  // Look up caller by phone number
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, phone')
    .eq('phone', phoneNumber)
    .single()

  if (!profile) {
    return { hasRental: false, isHost: false }
  }

  // Check for active rental (renter)
  const { data: activeRental } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicle:vehicles(year, make, model, host:profiles(full_name, phone))
    `)
    .eq('renter_id', profile.id)
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString())
    .single()

  // Check if host
  const { data: hostListings } = await supabase
    .from('vehicles')
    .select('id')
    .eq('host_id', profile.id)

  const isHost = (hostListings?.length || 0) > 0

  // Get active rentals count if host
  let activeRentalsCount = 0
  if (isHost) {
    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact' })
      .in('vehicle_id', hostListings?.map(l => l.id) || [])
      .eq('status', 'active')
    activeRentalsCount = count || 0
  }

  return {
    hasRental: !!activeRental,
    renterName: profile.full_name,
    vehicleYear: activeRental?.vehicle?.year,
    vehicleMake: activeRental?.vehicle?.make,
    vehicleModel: activeRental?.vehicle?.model,
    hostName: activeRental?.vehicle?.host?.full_name,
    hostPhone: activeRental?.vehicle?.host?.phone,
    startDate: activeRental?.start_date,
    endDate: activeRental?.end_date,
    status: activeRental?.status,
    weatherAlerts: [], // Would fetch from weather alerts
    recentAlerts: [], // Would fetch from host alerts
    isHost,
    listingCount: hostListings?.length || 0,
    activeRentals: activeRentalsCount,
  }
}

function buildSystemPrompt(callerContext: CallerContext): string {
  return `You are DriveAssist, the AI phone assistant for rentanddrive.net, a peer-to-peer car rental platform based in Reno, Nevada.

Caller context:
${callerContext.hasRental ? `
- Active renter: ${callerContext.renterName}
- Current rental: ${callerContext.vehicleYear} ${callerContext.vehicleMake} ${callerContext.vehicleModel}
- Host: ${callerContext.hostName} (${callerContext.hostPhone})
- Rental dates: ${callerContext.startDate} to ${callerContext.endDate}
- Rental status: ${callerContext.status}
- Active weather alerts: ${callerContext.weatherAlerts?.join(', ') || 'None'}
- Recent HostAlerts: ${callerContext.recentAlerts?.join(', ') || 'None'}
` : '- No active rental found for this number'}

${callerContext.isHost ? `
- Host account: ${callerContext.renterName}
- Active listings: ${callerContext.listingCount}
- Active rentals: ${callerContext.activeRentals}
` : ''}

You can help with:
- Rental questions and status
- Roadside assistance (dispatch HONK via API)
- Parking recommendations (Reno/Tahoe area)
- Weather and traffic updates
- Dispute and issue reporting
- Booking modifications
- Host alert tips
- General platform questions

You CANNOT help with:
- Insurance claims (transfer to insurance provider)
- Major accidents (emergency services first, then transfer)
- Billing disputes over $200 (transfer to human agent)

When you need to transfer to a human:
Say exactly: "I'm going to connect you with a member of our team right now. Please hold."
Then include [TRANSFER] in your response so the system knows to initiate a warm transfer.

Speak naturally. You're on a phone call — be concise.
Don't use bullet points or markdown. 
Speak like a helpful, friendly human.
Keep responses under 3 sentences unless more detail is specifically needed.`
}

// This POST handler simulates what the WebSocket would do
// In production, use a real WebSocket server
export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, message, conversationHistory } = await req.json()

    // Get caller context
    const callerContext = await getCallerContext(phoneNumber)
    const systemPrompt = buildSystemPrompt(callerContext)

    // Build messages array
    const messages = [
      ...(conversationHistory || []),
      { role: 'user', content: message },
    ]

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages,
      }),
    })

    const result = await response.json()
    const aiResponse = result.content?.[0]?.text || "I'm sorry, I didn't catch that. Could you repeat?"

    // Check for transfer signal
    const needsTransfer = aiResponse.includes('[TRANSFER]')
    const cleanResponse = aiResponse.replace('[TRANSFER]', '')

    // Log the call
    const supabase = await createClient()
    await supabase.from('voice_call_logs').insert({
      phone_number: phoneNumber.slice(0, -4) + '****', // Mask number
      user_message: message,
      ai_response: cleanResponse,
      needs_transfer: needsTransfer,
      caller_context: callerContext,
      created_at: new Date().toISOString(),
    }).catch(() => {
      // Table might not exist
    })

    return NextResponse.json({
      response: cleanResponse,
      needsTransfer,
      callerContext,
    })
  } catch (error) {
    console.error('Voice relay error:', error)
    return NextResponse.json(
      { error: 'Voice processing failed' },
      { status: 500 }
    )
  }
}

// WebSocket upgrade handling note:
// Vercel serverless functions don't support WebSockets.
// Deploy this on Fly.io/Railway with the following structure:
/*
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws, req) => {
  const phoneNumber = extractPhoneFromTwilioHandshake(req);
  let conversationHistory = [];

  ws.on('message', async (data) => {
    const message = JSON.parse(data);
    
    if (message.type === 'prompt') {
      const userText = message.voicePrompt;
      conversationHistory.push({ role: 'user', content: userText });
      
      const aiResponse = await getClaudeResponse(phoneNumber, userText, conversationHistory);
      conversationHistory.push({ role: 'assistant', content: aiResponse });
      
      if (aiResponse.includes('[TRANSFER]')) {
        ws.send(JSON.stringify({
          type: 'text',
          token: aiResponse.replace('[TRANSFER]', ''),
          last: true
        }));
        await initiateWarmTransfer(message.callSid);
      } else {
        ws.send(JSON.stringify({
          type: 'text',
          token: aiResponse,
          last: true
        }));
      }
    }
  });
});
*/
