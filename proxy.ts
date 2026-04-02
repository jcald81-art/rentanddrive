import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

// Next.js 16 proxy function - handles session refresh for Supabase auth
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
