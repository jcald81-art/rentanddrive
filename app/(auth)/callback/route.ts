import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role') || 'renter'
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Update user metadata with role if provided via OAuth
      if (role && !data.user.user_metadata?.role) {
        await supabase.auth.updateUser({
          data: { role }
        })
      }

      // If there's a specific next URL, use that
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Determine redirect based on role - direct to appropriate suite
      const userRole = data.user.user_metadata?.role || role
      const redirectPath = userRole === 'host' ? '/host/dashboard' : '/renter/suite'
      
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error?message=Could not authenticate user`)
}
