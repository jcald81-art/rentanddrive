import { Suspense } from 'react'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { CheckCircle2, Calendar, MapPin, Car, Clock, Phone, Shield, Navigation, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface SearchParams {
  booking_id?: string
  session_id?: string
}

async function getBookingDetails(bookingId: string) {
  const supabase = await createClient()
  
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicles (
        id, make, model, year, photos, thumbnail,
        location_city, location_state, fuel_type,
        carfidelity_certified
      ),
      profiles!bookings_host_id_fkey (
        full_name, avatar_url, phone
      )
    `)
    .eq('id', bookingId)
    .single()

  if (error || !booking) return null
  return booking
}

function ConfirmationContent({ booking }: { booking: any }) {
  const vehicle = booking.vehicles
  const host = booking.profiles
  const startDate = new Date(booking.start_date)
  const endDate = new Date(booking.end_date)
  
  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center size-20 rounded-full bg-green-500/20 mb-6">
            <CheckCircle2 className="size-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Booking Confirmed!</h1>
          <p className="text-gray-400">
            Your trip is all set. We&apos;ve sent confirmation details to your email.
          </p>
          <div className="mt-4">
            <Badge variant="outline" className="text-[#e63946] border-[#e63946] text-lg px-4 py-1">
              {booking.booking_ref || `RAD-${booking.id.slice(0, 6).toUpperCase()}`}
            </Badge>
          </div>
        </div>

        {/* Vehicle Card */}
        <Card className="bg-[#111827] border-gray-800 mb-6 overflow-hidden">
          <div className="relative h-48 md:h-64">
            <Image
              src={vehicle.thumbnail || vehicle.photos?.[0] || '/placeholder-car.jpg'}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-2xl font-bold text-white">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
              <div className="flex items-center gap-2 text-gray-300 mt-1">
                <MapPin className="size-4" />
                <span>{vehicle.location_city}, {vehicle.location_state}</span>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6">
            {/* Trip Dates */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#1f2937] rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Calendar className="size-4" />
                  Pick-up
                </div>
                <p className="text-white font-semibold">
                  {startDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-gray-400 text-sm">10:00 AM</p>
              </div>
              <div className="bg-[#1f2937] rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Calendar className="size-4" />
                  Return
                </div>
                <p className="text-white font-semibold">
                  {endDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-gray-400 text-sm">10:00 AM</p>
              </div>
            </div>

            <Separator className="bg-gray-800 mb-6" />

            {/* Host Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative size-14 rounded-full overflow-hidden bg-gray-700">
                {host?.avatar_url ? (
                  <Image
                    src={host.avatar_url}
                    alt={host.full_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-white text-xl font-bold">
                    {host?.full_name?.charAt(0) || 'H'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-gray-400 text-sm">Your host</p>
                <p className="text-white font-semibold">{host?.full_name || 'RAD Host'}</p>
              </div>
              {host?.phone && (
                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                  <Phone className="size-4 mr-2" />
                  Contact
                </Button>
              )}
            </div>

            {/* Price Summary */}
            <div className="bg-[#1f2937] rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Total paid</span>
                <span className="text-2xl font-bold text-[#e63946]">
                  ${(booking.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Includes {booking.protection_plan_name || 'Standard'} Protection
              </p>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="bg-[#111827] border-gray-800 mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">What&apos;s Next</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center size-8 rounded-full bg-[#e63946]/20 text-[#e63946] text-sm font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="text-white font-medium">Check your email</p>
                  <p className="text-gray-400 text-sm">
                    We&apos;ve sent you a confirmation email with all the details.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center size-8 rounded-full bg-[#e63946]/20 text-[#e63946] text-sm font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="text-white font-medium">Get pickup instructions</p>
                  <p className="text-gray-400 text-sm">
                    24 hours before your trip, you&apos;ll receive the vehicle location and unlock code.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center size-8 rounded-full bg-[#e63946]/20 text-[#e63946] text-sm font-bold shrink-0">
                  3
                </div>
                <div>
                  <p className="text-white font-medium">Pick up your vehicle</p>
                  <p className="text-gray-400 text-sm">
                    Use the igloohome code to unlock the lockbox and get your keys. Go RAD!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111827] rounded-lg p-4 text-center border border-gray-800">
            <Shield className="size-6 text-green-500 mx-auto mb-2" />
            <p className="text-gray-300 text-sm">Protected</p>
          </div>
          <div className="bg-[#111827] rounded-lg p-4 text-center border border-gray-800">
            <Navigation className="size-6 text-blue-500 mx-auto mb-2" />
            <p className="text-gray-300 text-sm">GPS Tracked</p>
          </div>
          <div className="bg-[#111827] rounded-lg p-4 text-center border border-gray-800">
            <Car className="size-6 text-[#e63946] mx-auto mb-2" />
            <p className="text-gray-300 text-sm">Certified</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/renter/trips" className="flex-1">
            <Button className="w-full bg-[#e63946] hover:bg-[#d62d3a] text-white">
              View My Trips
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </Link>
          <Link href="/vehicles" className="flex-1">
            <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800">
              Browse More Vehicles
            </Button>
          </Link>
        </div>

        {/* Cancellation Note */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Free cancellation up to 24 hours before pick-up. See our{' '}
          <Link href="/cancellation-policy" className="text-[#e63946] hover:underline">
            cancellation policy
          </Link>{' '}
          for details.
        </p>
      </div>
    </div>
  )
}

export default async function BookingConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { booking_id } = params

  if (!booking_id) {
    redirect('/vehicles')
  }

  const booking = await getBookingDetails(booking_id)
  
  if (!booking) {
    notFound()
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0f1e]" />}>
      <ConfirmationContent booking={booking} />
    </Suspense>
  )
}
