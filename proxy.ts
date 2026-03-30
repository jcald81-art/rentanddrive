import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

async function proxy(request: NextRequest) {
  return await updateSession(request)
}

// Export both named and default for Next.js 16 proxy compatibility
export { proxy }
export default proxy

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
