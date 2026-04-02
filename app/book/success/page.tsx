'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ConciergeRequest } from '@/components/booking/concierge-request'
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Car, 
  Key,
  Phone,
  Mail,
  ArrowRight,
  Download,
  Share2,
} from 'lucide-react'

interface BookingDetails {
  id: string
  booking_number: string
  status: string
  start_date: string
  end_date: string
  total_amount: number
  lockbox_code?: string
  vehicle: {
    id: string
    make: string
    model: string
    year: number
    color?: string
    license_plate?: string
    thumbnail_url?: string
    location_address?: string
    location_city?: string
  }
  host: {
    full_name: string
    phone?: string
    email?: string
  }
}

export default function BookingSuccessPage() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('booking_id')
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (bookingId) {
      fetchBooking()
    }
  }, [bookingId])

  async function fetchBooking() {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`)
      if (response.ok) {
        const data = await response.json()
        setBooking(data.booking)
      }
    } catch (error) {
      console.error('Failed to fetch booking:', error)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#CC0000] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your booking...</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Booking not found</p>
            <Button asChild>
              <Link href="/vehicles">Browse Vehicles</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const vehicleAddress = booking.vehicle.location_address || `${booking.vehicle.location_city || 'Reno'}, NV`

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground">
            Your {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model} is reserved
          </p>
          <Badge className="mt-2 bg-[#CC0000]">
            Confirmation #{booking.booking_number}
          </Badge>
        </div>

        {/* Booking Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Booking Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vehicle Info */}
            <div className="flex gap-4">
              {booking.vehicle.thumbnail_url && (
                <img
                  src={booking.vehicle.thumbnail_url}
                  alt={`${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`}
                  className="w-32 h-24 object-cover rounded-lg"
                />
              )}
              <div>
                <h3 className="font-semibold text-lg">
                  {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                </h3>
                {booking.vehicle.color && (
                  <p className="text-sm text-muted-foreground">{booking.vehicle.color}</p>
                )}
                {booking.vehicle.license_plate && (
                  <Badge variant="outline" className="mt-1">
                    {booking.vehicle.license_plate}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Pickup</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-[#CC0000]" />
                  <span className="font-medium">
                    {new Date(booking.start_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Return</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-[#CC0000]" />
                  <span className="font-medium">
                    {new Date(booking.end_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location */}
            <div>
              <p className="text-sm text-muted-foreground">Pickup Location</p>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4 text-[#CC0000]" />
                <span>{vehicleAddress}</span>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vehicleAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#CC0000] hover:underline ml-6"
              >
                Get Directions
              </a>
            </div>

            {/* Lockbox Code - Shown prominently when available */}
            {booking.lockbox_code && (
              <>
                <Separator />
                <div className="bg-[#CC0000]/5 border border-[#CC0000]/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="h-5 w-5 text-[#CC0000]" />
                    <span className="font-medium">Lockbox Code</span>
                  </div>
                  <p className="text-3xl font-mono font-bold tracking-widest text-[#CC0000]">
                    {booking.lockbox_code}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Use this code to open the key lockbox at the vehicle location
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Paid</span>
              <span className="text-2xl font-bold text-[#CC0000]">
                ${booking.total_amount.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Concierge Ride Request */}
        <ConciergeRequest
          bookingId={booking.id}
          vehicleAddress={vehicleAddress}
          pickupDate={booking.start_date}
          dropoffDate={booking.end_date}
        />

        {/* Host Contact */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your Host</CardTitle>
            <CardDescription>Contact for pickup questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{booking.host.full_name}</p>
              </div>
              <div className="flex gap-2">
                {booking.host.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${booking.host.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </a>
                  </Button>
                )}
                {booking.host.email && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${booking.host.email}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-[#CC0000] hover:bg-[#CC0000]/90">
            <Link href={`/trip/${booking.id}`}>
              View Trip Instructions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/bookings">
              View All Bookings
            </Link>
          </Button>
        </div>

        {/* Support */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Questions? Contact us at{' '}
          <a href="mailto:admin@rentanddrive.net" className="text-[#CC0000] hover:underline">
            admin@rentanddrive.net
          </a>{' '}
          or call{' '}
          <a href="tel:+13187368723" className="text-[#CC0000] hover:underline">
            (318) RENT-RAD
          </a>
        </p>
      </div>
    </div>
  )
}
