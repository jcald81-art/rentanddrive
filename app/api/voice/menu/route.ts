import { NextRequest, NextResponse } from 'next/server'

// Handle menu selection from Gather
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const digits = formData.get('Digits')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'

  let twiml = ''

  switch (digits) {
    case '1':
      // Active rental help - go to AI
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay 
      url="wss://${baseUrl.replace('https://', '')}/api/voice/relay"
      welcomeGreeting="I'm here to help with your rental. Can you tell me about the issue you're experiencing?"
      voice="en-US-Neural2-F"
      transcriptionProvider="deepgram"
      speechModel="nova-2"
    />
  </Connect>
</Response>`
      break

    case '2':
      // Roadside emergency - direct to HONK or human
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Connecting you to roadside assistance now. Please stay on the line.
  </Say>
  <Dial timeout="30" callerId="${process.env.TWILIO_PHONE_NUMBER}">
    ${process.env.HONK_DISPATCH_NUMBER || process.env.HUMAN_AGENT_NUMBER}
  </Dial>
  <Say voice="Polly.Joanna">
    We were unable to connect you. Please try again or call 911 if this is an emergency.
  </Say>
</Response>`
      break

    case '3':
      // Billing - go to AI with billing context
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay 
      url="wss://${baseUrl.replace('https://', '')}/api/voice/relay?context=billing"
      welcomeGreeting="I can help with billing questions. What would you like to know about your charges?"
      voice="en-US-Neural2-F"
      transcriptionProvider="deepgram"
      speechModel="nova-2"
    />
  </Connect>
</Response>`
      break

    default:
      // Default - go to AI assistant
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay 
      url="wss://${baseUrl.replace('https://', '')}/api/voice/relay"
      welcomeGreeting="Hi, thanks for calling rentanddrive! I'm your AI assistant. What can I help you with today?"
      voice="en-US-Neural2-F"
      transcriptionProvider="deepgram"
      speechModel="nova-2"
    />
  </Connect>
</Response>`
  }

  return new NextResponse(twiml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
