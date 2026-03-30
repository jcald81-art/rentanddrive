'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center px-4 max-w-lg">
            <div className="mb-8">
              <AlertTriangle className="h-24 w-24 mx-auto text-red-500" />
            </div>
            
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Something Went Wrong</h1>
            <p className="text-slate-600 mb-2">
              We encountered an unexpected error. Our team has been notified.
            </p>
            {error.digest && (
              <p className="text-sm text-slate-400 mb-8">
                Error ID: {error.digest}
              </p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={reset}
                className="bg-[#CC0000] hover:bg-[#AA0000]"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" asChild>
                <a href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </a>
              </Button>
            </div>
            
            <p className="text-sm text-slate-500 mt-8">
              If this problem persists, please contact{' '}
              <a href="mailto:support@rentanddrive.net" className="underline">
                support@rentanddrive.net
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
