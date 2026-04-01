'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ShieldAlert, Shield } from 'lucide-react'

// Hard-coded platform manager emails
const PLATFORM_MANAGERS = [
  'caldwell_joey@hotmail.com',
  'jcald81@gmail.com', // Break-glass admin with full access
]

// Break-glass admin has elevated privileges
const BREAK_GLASS_ADMIN = 'jcald81@gmail.com'

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const [isBreakGlass, setIsBreakGlass] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!mounted) return
      
      if (!user || !user.email) {
        window.location.href = '/login?redirect=/management'
        return
      }

      // Hard-coded email check - only these emails can access management
      const email = user.email.toLowerCase()
      if (!PLATFORM_MANAGERS.includes(email)) {
        window.location.href = '/dashboard'
        return
      }

      setUserEmail(email)
      setIsBreakGlass(email === BREAK_GLASS_ADMIN)
      setAuthorized(true)
      setChecking(false)
    }

    const timeoutId = setTimeout(check, 0)
    return () => {
      mounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <ShieldAlert className="h-10 w-10 mx-auto text-[#CC0000]" />
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verifying platform manager access...</p>
        </div>
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Admin break-glass banner */}
      <div className={`text-white text-xs text-center py-1.5 font-medium tracking-wide flex items-center justify-center gap-2 ${isBreakGlass ? 'bg-amber-600' : 'bg-[#CC0000]'}`}>
        {isBreakGlass && <Shield className="h-3 w-3" />}
        {isBreakGlass ? 'BREAK-GLASS ADMIN MODE' : 'PLATFORM MANAGER MODE'} — {userEmail} — All actions are logged.
      </div>
      {children}
    </div>
  )
}
