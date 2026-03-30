import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phone, link } = await request.json()

    if (!phone || !link) {
      return NextResponse.json({ error: 'Missing phone or link' }, { status: 400 })
    }

    // Send SMS using Twilio
    const twilioSid = process.env.TWILIO_ACCOUNT_SID
    const twilioToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER

    if (twilioSid && twilioToken && twilioPhone) {
      const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`
      
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: twilioPhone,
          Body: `Rent and Drive: Continue your license verification on your phone. This link expires in 30 minutes: ${link}`,
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending mobile verify SMS:', error)
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
  }
}
