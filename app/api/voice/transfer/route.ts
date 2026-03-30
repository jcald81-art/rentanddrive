import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(req: NextRequest) {
  try {
    const { callSid, callerName, issue, rentalInfo, conversationSummary } = await req.json()

    const humanAgentNumber = process.env.HUMAN_AGENT_NUMBER

    if (!humanAgentNumber) {
      return NextResponse.json(
        { error: 'Human agent number not configured' },
        { status: 500 }
      )
    }

    // Send SMS summary to agent before call connects
    const summaryMessage = `📞 Incoming transfer from ${callerName || 'Unknown Caller'}
Issue: ${issue || 'Not specified'}
${rentalInfo ? `Rental: ${rentalInfo}` : ''}
${conversationSummary ? `Summary: ${conversationSummary}` : ''}
Action needed: ${issue || 'AI unable to resolve - needs human assistance'}`

    try {
      await twilioClient.messages.create({
        body: summaryMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: humanAgentNumber,
      })
    } catch (smsError) {
      console.error('Failed to send agent SMS:', smsError)
      // Continue with transfer anyway
    }

    // Update the call to transfer to human agent
    // This uses Twilio's call update API
    await twilioClient.calls(callSid).update({
      twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Please hold while I connect you with a member of our team.
  </Say>
  <Dial timeout="60" callerId="${process.env.TWILIO_PHONE_NUMBER}">
    ${humanAgentNumber}
  </Dial>
  <Say voice="Polly.Joanna">
    We were unable to connect you at this time. Please try calling back or email support at help@rentanddrive.net
  </Say>
</Response>`,
    })

    return NextResponse.json({ success: true, transferred: true })
  } catch (error) {
    console.error('Transfer error:', error)
    return NextResponse.json(
      { error: 'Transfer failed' },
      { status: 500 }
    )
  }
}
