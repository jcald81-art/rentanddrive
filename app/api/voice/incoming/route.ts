import { NextRequest, NextResponse } from 'next/server'

// Twilio webhook for incoming calls - returns TwiML
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'
  
  // Return TwiML to initiate ConversationRelay
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="${baseUrl}/api/voice/menu" method="POST" timeout="5">
    <Say voice="Polly.Joanna">
      Press 1 for active rental help.
      Press 2 for roadside emergency.
      Press 3 for billing.
      Or stay on the line for our AI assistant.
    </Say>
  </Gather>
  <Connect>
    <ConversationRelay 
      url="wss://${baseUrl.replace('https://', '')}/api/voice/relay"
      welcomeGreeting="Hi, thanks for calling rentanddrive! I'm your AI assistant — I can help with your rental, answer questions, and resolve most issues right now. What can I help you with today?"
      voice="en-US-Neural2-F"
      transcriptionProvider="deepgram"
      speechModel="nova-2"
    />
  </Connect>
</Response>`

  return new NextResponse(twiml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}

export async function POST(req: NextRequest) {
  // Also handle POST for webhook compatibility
  return GET(req)
}
