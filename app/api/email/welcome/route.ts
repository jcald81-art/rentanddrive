import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verify the request is from an authenticated user or internal
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, firstName, role } = body

    // Only allow sending to the authenticated user's email
    if (email !== user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await sendWelcomeEmail({
      to: email,
      firstName: firstName || user.user_metadata?.full_name?.split(' ')[0],
      role: role || user.user_metadata?.role || 'renter'
    })

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
  } catch (error) {
    console.error('[v0] Welcome email API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
