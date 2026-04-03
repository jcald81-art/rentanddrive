'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[#e50914]/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-[#e50914]" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-white/60 mb-6">
          We encountered an error loading your dashboard. This has been logged and we&apos;re working on it.
        </p>

        {error.digest && (
          <p className="text-xs text-white/40 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={reset}
            className="bg-[#e50914] hover:bg-[#c00810] text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>

        <div className="mt-8 p-4 bg-white/5 rounded-lg text-left">
          <p className="text-sm text-white/60 mb-2">Need help?</p>
          <ul className="text-sm text-white/40 space-y-1">
            <li>Try refreshing the page</li>
            <li>Clear your browser cache</li>
            <li>Contact support if the issue persists</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
