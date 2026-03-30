import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Save to database for tracking
    await supabase.from('contact_submissions').insert({
      name,
      email,
      subject,
      message,
      created_at: new Date().toISOString(),
    })

    // Send via SecureLink (SendGrid)
    const sendgridKey = process.env.SENDGRID_API_KEY
    if (sendgridKey) {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: 'joe@rentanddrive.net' }],
            subject: `[Contact Form] ${subject}: ${name}`,
          }],
          from: { email: 'noreply@rentanddrive.net', name: 'Rent and Drive' },
          reply_to: { email, name },
          content: [{
            type: 'text/plain',
            value: `
New contact form submission:

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
SecureLink | R&D Intelligence System
            `.trim(),
          }],
        }),
      })
    } else {
      // Log for development
      console.log('[Contact Form]', { name, email, subject, message })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Contact API Error]', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
