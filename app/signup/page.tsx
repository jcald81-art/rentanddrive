'use client'

import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useEffect, Suspense } from 'react'

function SignupRedirect() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirect = searchParams.get('redirect') || '/host/dashboard'

  useEffect(() => {
    // Redirect to login page with signup mode
    router.replace(`/login?redirect=${encodeURIComponent(redirect)}&mode=signup`)
  }, [redirect, router])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="animate-spin h-6 w-6 border-2 border-white/20 border-t-white rounded-full" />
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <SignupRedirect />
    </Suspense>
  )
}
