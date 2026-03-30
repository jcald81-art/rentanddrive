import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { user_id, user_email } = await request.json()

    // Send email to admin (joe@rentanddrive.net) about new verification
    if (process.env.SENDGRID_API_KEY) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: 'joe@rentanddrive.net' }],
          }],
          from: { 
            email: process.env.SENDGRID_FROM_EMAIL || 'noreply@rentanddrive.net',
            name: 'Rent and Drive'
          },
          subject: 'New Driver Verification Submitted',
          content: [{
            type: 'text/html',
            value: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #CC0000;">New Verification Request</h2>
                <p>A new driver verification has been submitted and needs your review.</p>
                <p><strong>User ID:</strong> ${user_id}</p>
                <p><strong>Email:</strong> ${user_email || 'N/A'}</p>
                <p style="margin-top: 20px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'}/dashboard/verifications" 
                     style="background-color: #CC0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Review Verification
                  </a>
                </p>
              </div>
            `,
          }],
        }),
      })

      if (!response.ok) {
        console.error('SendGrid error:', await response.text())
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notification error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
