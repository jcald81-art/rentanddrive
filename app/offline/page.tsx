'use client'

import { Car, WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#CC0000] text-white">
              <Car className="h-7 w-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              Rent<span className="text-[#CC0000]">&</span>Drive
            </span>
          </div>
        </div>

        {/* Offline Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <WifiOff className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>

        {/* Message */}
        <h1 className="mb-4 text-2xl font-bold tracking-tight">
          You&apos;re Offline
        </h1>
        <p className="mb-8 text-muted-foreground">
          It looks like you&apos;ve lost your internet connection. 
          Please check your WiFi or cellular data and try again.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full bg-[#CC0000] hover:bg-[#CC0000]/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              Go to Homepage
            </Link>
          </Button>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-muted-foreground">
          Need help? Call us at{' '}
          <a href="tel:+17755551234" className="text-[#CC0000] hover:underline">
            (775) 555-1234
          </a>
        </p>
      </div>
    </div>
  )
}
