'use client'

import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Car,
  FileText,
  MessageSquare,
  ArrowRight,
  Download,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BookingProgressBar } from '@/components/booking/BookingProgressBar'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  thumbnail?: string
  photos?: string[]
  daily_rate: number
  location_city?: string
  location_state?: string
  inspektlabs_certified?: boolean
  smoking_policy?: string
}

interface Booking {
  id: string
  booking_ref?: string
  start_date: string
  end_date: string
  total_price: number
  status: string
  vehicles: Vehicle
}

interface BookingConfirmedClientProps {
  booking: Booking | null
}

export function BookingConfirmedClient({ booking }: BookingConfirmedClientProps) {
  // Generate a demo booking ref if not provided
  const bookingRef = booking?.booking_ref || `RAD-${Date.now().toString(36).toUpperCase()}`

  // Demo data if no booking
  const vehicle = booking?.vehicles || {
    id: 'demo',
    make: 'Audi',
    model: 'Q5 Premium Plus',
    year: 2014,
    thumbnail: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800',
    location_city: 'Reno',
    location_state: 'NV',
  }

  const startDate = booking?.start_date ? new Date(booking.start_date) : new Date()
  const endDate = booking?.end_date ? new Date(booking.end_date) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const total = booking?.total_price || 405

  const imageUrl = vehicle.thumbnail || vehicle.photos?.[0] || '/placeholder-car.jpg'

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Progress Bar */}
        <BookingProgressBar currentStep={4} />

        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-green-100 dark:bg-green-950 mb-4">
            <CheckCircle2 className="size-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Booking Confirmed
          </h1>
          <p className="text-muted-foreground">
            Your trip is booked. Check your email for confirmation details.
          </p>
        </div>

        {/* Booking Reference */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Booking Reference</p>
                <p className="text-2xl font-mono font-bold text-foreground">
                  {bookingRef}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="size-4 mr-2" />
                  Receipt
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="size-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trip Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="size-5" />
              Trip Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Vehicle */}
            <div className="flex gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={imageUrl}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="size-3" />
                  <span>{vehicle.location_city}, {vehicle.location_state}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Pick-up</p>
                  <p className="font-medium">
                    {format(startDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">10:00 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="size-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Return</p>
                  <p className="font-medium">
                    {format(endDate, 'EEEE, MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">10:00 AM</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Paid</span>
              <span className="text-xl font-bold">${total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What&apos;s Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium">Check your email</p>
                  <p className="text-sm text-muted-foreground">
                    We&apos;ve sent confirmation details and your igloohome access code.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium">Arrive at pick-up location</p>
                  <p className="text-sm text-muted-foreground">
                    Use the access code to unlock the igloohome key box. No host meetup needed.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium">Complete pre-trip inspection</p>
                  <p className="text-sm text-muted-foreground">
                    Use the RAD app to photograph the vehicle before you drive.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                  4
                </div>
                <div>
                  <p className="font-medium">Enjoy your trip</p>
                  <p className="text-sm text-muted-foreground">
                    Hit the road. RAD Fleet GPS tracks your journey for safety.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/renter/trips">
            <Button variant="outline" className="w-full">
              <FileText className="size-4 mr-2" />
              View My Trips
            </Button>
          </Link>
          <Link href="/ask-rad">
            <Button variant="outline" className="w-full">
              <MessageSquare className="size-4 mr-2" />
              Ask RAD
            </Button>
          </Link>
        </div>

        {/* Back to Browse */}
        <div className="text-center mt-8">
          <Link
            href="/vehicles"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Browse more vehicles
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
