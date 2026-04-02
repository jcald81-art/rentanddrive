'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { AuthPage } from '@/components/auth'

function SignInContent() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  
  return <AuthPage defaultMode="signin" redirectTo={redirectTo} />
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1C1F1A]" />}>
      <SignInContent />
    </Suspense>
  )
}
