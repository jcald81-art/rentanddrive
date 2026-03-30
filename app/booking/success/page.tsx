'use client'
// Booking Success Page - Wrapped in Suspense for useSearchParams
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, Calendar, MapPin, Phone, Copy, CheckCircle, ExternalLink, Home, ChevronRight } from 'lucide-react'
import { NavHeader } from '@/components/nav-header'

function BookingSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [copied, setCopied] = useState(false)

  // Mock booking data - in real app, fetch from session_id
  const booking = {
    reference: 'RND-2024-X7K9M',
    vehicle: {
      year: 2024,
      make: 'Toyota',
      model: '4Runner TRD Pro',
    },
    dates: {
      start: 'January 15, 2024',
      end: 'January 18, 2024',
    },
    pickup: {
      address: '255 N Virginia St, Reno, NV 89501',
      time: '10:00 AM',
      instructions: 'Meet at the main lobby. Look for the Igloo lockbox near the entrance.',
    },
    host: {
      name: 'Mike T.',
      phone: '(775) ***-**89',
    },
    total: 532,
  }

  const copyReference = () => {
    navigator.clipboard.writeText(booking.reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <NavHeader variant="dark" />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-64px)]">
      <div className="w-full max-w-lg">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
            <div className="relative w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="h-10 w-10 text-white" strokeWidth={3} />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-gray-400">Your vehicle is reserved and ready for pickup.</p>
        </div>

        {/* Booking Reference */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Booking Reference</p>
              <p className="text-2xl font-bold text-[#FFD84D]" style={{ fontFamily: 'DM Mono, monospace' }}>
                {booking.reference}
              </p>
            </div>
            <button
              onClick={copyReference}
              className="p-3 bg-[#1a1a1a] hover:bg-[#222] rounded-lg transition-colors"
            >
              {copied ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Copy className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Vehicle Summary */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 mb-4">
          <h2 className="font-semibold mb-4">Vehicle</h2>
          <div className="flex items-center gap-4">
            <div className="w-20 h-14 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-lg flex items-center justify-center">
              <svg className="h-8 w-8 text-[#333]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                <path d="M17 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                <path d="M5 17H3v-6l2-4h10l4 4v6h-2" />
                <path d="M9 17h6" />
              </svg>
            </div>
            <div>
              <p className="font-semibold">{booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}</p>
              <p className="text-sm text-gray-400">
                {booking.dates.start} → {booking.dates.end}
              </p>
            </div>
          </div>
        </div>

        {/* Pickup Details */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 mb-4">
          <h2 className="font-semibold mb-4">Pickup Details</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-[#FFD84D] mt-0.5" />
              <div>
                <p className="font-medium">{booking.pickup.address}</p>
                <p className="text-sm text-gray-400">{booking.pickup.instructions}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-[#FFD84D]" />
              <div>
                <p className="font-medium">{booking.dates.start} at {booking.pickup.time}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Host Contact */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Host Contact</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#333] to-[#1a1a1a] rounded-full flex items-center justify-center font-bold">
                {booking.host.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium">{booking.host.name}</p>
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {booking.host.phone}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between p-4 bg-[#FFD84D]/10 border border-[#FFD84D]/20 rounded-xl mb-6">
          <span className="font-semibold">Total Charged</span>
          <span className="text-2xl font-bold text-[#FFD84D]" style={{ fontFamily: 'DM Mono, monospace' }}>
            ${booking.total}
          </span>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Link
            href="/renter/bookings"
            className="flex items-center justify-center gap-2 w-full py-4 bg-[#FFD84D] hover:bg-[#e6c344] text-black font-semibold rounded-lg transition-colors"
          >
            View My Bookings
          </Link>
          <button className="flex items-center justify-center gap-2 w-full py-4 border border-[#333] text-gray-300 hover:text-white hover:border-[#444] rounded-lg transition-colors">
            <Calendar className="h-5 w-5" />
            Add to Calendar
          </button>
        </div>

        {/* Receipt Link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          A receipt has been sent to your email.{' '}
          <a href="#" className="text-[#FFD84D] hover:underline inline-flex items-center gap-1">
            View receipt <ExternalLink className="h-3 w-3" />
          </a>
        </p>

        {/* Navigation Links */}
        <div className="flex justify-center gap-4 mt-8">
          <Link href="/bookings" className="text-sm text-[#FFD84D] hover:underline">
            View My Bookings
          </Link>
          <span className="text-gray-600">|</span>
          <Link href="/" className="text-sm text-gray-400 hover:text-white">
            Back to Home
          </Link>
        </div>
      </div>
      </div>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#FFD84D] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading your booking...</p>
        </div>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  )
}
