import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect')

  // Validate redirect URL (must be relative or same origin)
  const safeRedirect = (() => {
    if (!redirect) return '/dashboard'
    const decoded = decodeURIComponent(redirect)
    // Only allow relative paths or same-origin URLs
    if (decoded.startsWith('/')) return decoded
    try {
      const url = new URL(decoded)
      if (url.origin === origin) return url.pathname + url.search
    } catch {
      // Invalid URL, use default
    }
    return '/dashboard'
  })()

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successful OAuth or email confirmation
      return NextResponse.redirect(new URL(safeRedirect, origin))
    }

    console.error('[Auth Callback] Failed to exchange code:', error.message)
  }

  // Error: redirect to signin with error param
  const errorUrl = new URL('/auth/signin', origin)
  errorUrl.searchParams.set('error', 'auth_callback_failed')
  if (redirect) {
    errorUrl.searchParams.set('redirect', redirect)
  }
  return NextResponse.redirect(errorUrl)
}
