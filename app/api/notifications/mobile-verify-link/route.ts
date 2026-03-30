import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, link } = await request.json()

    if (!email || !link) {
      return NextResponse.json({ error: 'Missing email or link' }, { status: 400 })
    }

    // Send email using SendGrid or your email provider
    const sendGridApiKey = process.env.SENDGRID_API_KEY
    
    if (sendGridApiKey) {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: 'verify@rentanddrive.net', name: 'Rent and Drive' },
          subject: 'Continue Your License Verification on Mobile',
          content: [
            {
              type: 'text/html',
              value: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #f97316;">Continue on Your Phone</h2>
                  <p>You requested to continue your driver's license verification on your phone.</p>
                  <p>Click the button below to take photos of your license:</p>
                  <a href="${link}" style="display: inline-block; background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                    Continue Verification
                  </a>
                  <p style="color: #666; font-size: 14px;">This link will expire in 30 minutes.</p>
                  <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
                </div>
              `,
            },
          ],
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending mobile verify link:', error)
    return NextResponse.json({ error: 'Failed to send link' }, { status: 500 })
  }
}
