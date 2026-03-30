'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Shield, RefreshCw, Home, ArrowLeft, MessageSquare } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('[Error]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center px-4 max-w-lg">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-[#CC0000]/10 flex items-center justify-center">
            <Shield className="h-10 w-10 text-[#CC0000]" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-2">SecureLink is on it</h2>
        <p className="text-muted-foreground mb-6">
          We hit an unexpected bump in the road. Our team has been notified and is working on it.
        </p>
        
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="bg-[#CC0000] hover:bg-[#AA0000]">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-8">
          Still having trouble?{' '}
          <Link href="/contact" className="text-[#CC0000] hover:underline inline-flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  )
}
