import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

// Next.js 16 proxy function - handles session refresh for Supabase auth
export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request)
  } catch {
    // If updateSession fails, continue without session update
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
