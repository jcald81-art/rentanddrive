import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { user_id, status, reason } = await request.json()

    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(user_id)
    const userEmail = userData?.user?.email

    if (!userEmail) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Send email to user about verification result
    if (process.env.SENDGRID_API_KEY) {
      const isApproved = status === 'approved'
      
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: userEmail }],
          }],
          from: { 
            email: process.env.SENDGRID_FROM_EMAIL || 'noreply@rentanddrive.net',
            name: 'Rent and Drive'
          },
          subject: isApproved 
            ? 'Your Driver Verification is Approved!' 
            : 'Driver Verification Update',
          content: [{
            type: 'text/html',
            value: isApproved 
              ? `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #22c55e;">Verification Approved!</h2>
                  <p>Great news! Your driver's license has been verified.</p>
                  <p>You can now book any vehicle on Rent and Drive.</p>
                  <p style="margin-top: 20px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'}/vehicles" 
                       style="background-color: #CC0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                      Browse Vehicles
                    </a>
                  </p>
                </div>
              `
              : `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #CC0000;">Verification Not Approved</h2>
                  <p>Unfortunately, we couldn't verify your driver's license at this time.</p>
                  <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
                  <p>Please re-submit your verification with the required corrections.</p>
                  <p style="margin-top: 20px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'}/verify" 
                       style="background-color: #CC0000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                      Re-submit Verification
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
