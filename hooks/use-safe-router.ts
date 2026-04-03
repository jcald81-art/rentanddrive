'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'

/**
 * A safe wrapper around Next.js App Router's useRouter hook.
 * Prevents "Router action dispatched before initialization" errors
 * by falling back to window.location when the router isn't ready.
 */
export function useSafeRouter() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const push = useCallback((url: string) => {
    if (isMounted && typeof window !== 'undefined') {
      try {
        router.push(url)
      } catch {
        // Fallback to window.location if router fails
        window.location.href = url
      }
    } else if (typeof window !== 'undefined') {
      window.location.href = url
    }
  }, [isMounted, router])

  const replace = useCallback((url: string) => {
    if (isMounted && typeof window !== 'undefined') {
      try {
        router.replace(url)
      } catch {
        window.location.replace(url)
      }
    } else if (typeof window !== 'undefined') {
      window.location.replace(url)
    }
  }, [isMounted, router])

  const back = useCallback(() => {
    if (isMounted && typeof window !== 'undefined') {
      try {
        router.back()
      } catch {
        window.history.back()
      }
    } else if (typeof window !== 'undefined') {
      window.history.back()
    }
  }, [isMounted, router])

  const refresh = useCallback(() => {
    if (isMounted) {
      try {
        router.refresh()
      } catch {
        window.location.reload()
      }
    } else if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }, [isMounted, router])

  return {
    push,
    replace,
    back,
    refresh,
    isMounted,
    // Expose original router for prefetch and other methods
    router,
  }
}
