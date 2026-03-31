import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error_param = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const role = searchParams.get('role') || 'renter'
  const next = searchParams.get('next')

  // Handle OAuth error from provider
  if (error_param) {
    const errorMsg = error_description || error_param || 'OAuth error'
    return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(errorMsg)}`)
  }

  // No code provided
  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent('No authorization code provided')}`)
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('[v0] Auth callback error:', error.message)
      return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(error.message)}`)
    }

    if (!data.user) {
      return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent('No user data returned')}`)
    }

    // Check if this is a new user (first sign in)
    const isNewUser = data.user.created_at === data.user.last_sign_in_at ||
                      new Date(data.user.created_at).getTime() > Date.now() - 60000 // Within last minute

    // Update user metadata with role if provided via OAuth
    const userRole = data.user.user_metadata?.role || role
    if (role && !data.user.user_metadata?.role) {
      await supabase.auth.updateUser({
        data: { role }
      })
    }

    // Send welcome email for new users (non-blocking)
    if (isNewUser && data.user.email) {
      const firstName = data.user.user_metadata?.full_name?.split(' ')[0] ||
                       data.user.user_metadata?.name?.split(' ')[0]
      
      sendWelcomeEmail({
        to: data.user.email,
        firstName,
        role: userRole as 'host' | 'renter'
      }).catch(err => console.error('[v0] Welcome email failed:', err))
    }

    // If there's a specific next URL, use that
    if (next) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    // Determine redirect based on role - direct to appropriate suite
    const redirectPath = userRole === 'host' ? '/host/dashboard' : '/renter/suite'
    
    return NextResponse.redirect(`${origin}${redirectPath}`)
  } catch (err) {
    console.error('[v0] Auth callback exception:', err)
    const message = err instanceof Error ? err.message : 'Authentication failed'
    return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(message)}`)
  }
}
