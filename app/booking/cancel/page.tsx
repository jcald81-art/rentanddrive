'use client'

import Link from 'next/link'
import { XCircle, ArrowLeft, Search, RefreshCw } from 'lucide-react'

export default function BookingCancelPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Cancel Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-full mb-6">
          <XCircle className="h-10 w-10 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Booking Not Completed</h1>
        <p className="text-gray-400 mb-8">
          Your payment was cancelled or could not be processed. Don&apos;t worry — your card was not charged.
        </p>

        {/* Info Box */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-4 mb-8 text-left">
          <h3 className="font-semibold mb-2">What happened?</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• You may have cancelled the checkout</li>
            <li>• Your card may have been declined</li>
            <li>• The session may have timed out</li>
          </ul>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 w-full py-4 bg-[#FFD84D] hover:bg-[#e6c344] text-black font-semibold rounded-lg transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>
          <Link
            href="/search"
            className="flex items-center justify-center gap-2 w-full py-4 border border-[#333] text-gray-300 hover:text-white hover:border-[#444] rounded-lg transition-colors"
          >
            <Search className="h-5 w-5" />
            Browse Other Cars
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-3 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Support */}
        <p className="text-sm text-gray-500 mt-8">
          Need help?{' '}
          <a href="mailto:admin@rentanddrive.net" className="text-[#FFD84D] hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  )
}
