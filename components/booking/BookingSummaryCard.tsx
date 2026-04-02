'use client'

import Image from 'next/image'
import { differenceInDays } from 'date-fns'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { MapPin, Calendar, Shield, Fuel } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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
  fuel_type?: string
}

interface BookingSummaryCardProps {
  vehicle: Vehicle
  startDate: Date
  endDate: Date
  addOns?: {
    lyftPickup?: boolean
    lyftReturn?: boolean
    unlimitedMiles?: boolean
  }
  promoCode?: string | null
  promoDiscount?: number
  showPricing?: boolean
}

export function BookingSummaryCard({
  vehicle,
  startDate,
  endDate,
  addOns,
  promoCode,
  promoDiscount = 0,
  showPricing = true,
}: BookingSummaryCardProps) {
  // Use UTC to ensure consistent date handling between server and client
  const utcStart = toZonedTime(startDate, 'UTC')
  const utcEnd = toZonedTime(endDate, 'UTC')
  const days = differenceInDays(utcEnd, utcStart) || 1
  const basePrice = vehicle.daily_rate * days
  const serviceFee = Math.round(basePrice * 0.10) // 10% service fee
  const lyftPickupFee = addOns?.lyftPickup ? 25 : 0
  const lyftReturnFee = addOns?.lyftReturn ? 25 : 0
  const unlimitedMilesFee = addOns?.unlimitedMiles ? 15 * days : 0
  const subtotal = basePrice + serviceFee + lyftPickupFee + lyftReturnFee + unlimitedMilesFee
  const discount = promoDiscount
  const total = subtotal - discount

  const imageUrl = vehicle.thumbnail || vehicle.photos?.[0] || '/placeholder-car.jpg'

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Trip Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vehicle Info */}
        <div className="flex gap-4">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg">
            <Image
              src={imageUrl}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="size-3" />
              <span>{vehicle.location_city}, {vehicle.location_state}</span>
            </div>
            <div className="flex gap-2 mt-2">
              {vehicle.inspektlabs_certified && (
                <Badge variant="secondary" className="text-xs bg-green-600/10 text-green-600">
                  <Shield className="size-3 mr-1" />
                  Certified
                </Badge>
              )}
              {vehicle.smoking_policy === 'clean' && (
                <Badge variant="secondary" className="text-xs">
                  RAD Clean
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Trip Dates */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="font-medium">Trip Dates</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Pick-up</p>
              <p className="font-medium" suppressHydrationWarning>{formatInTimeZone(startDate, 'UTC', 'MMM d, yyyy')}</p>
              <p className="text-muted-foreground">10:00 AM</p>
            </div>
            <div>
              <p className="text-muted-foreground">Return</p>
              <p className="font-medium" suppressHydrationWarning>{formatInTimeZone(endDate, 'UTC', 'MMM d, yyyy')}</p>
              <p className="text-muted-foreground">10:00 AM</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {days} day{days !== 1 ? 's' : ''} total
          </p>
        </div>

        {showPricing && (
          <>
            <Separator />

            {/* Pricing Breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  ${vehicle.daily_rate}/day x {days} day{days !== 1 ? 's' : ''}
                </span>
                <span>${basePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service fee</span>
                <span>${serviceFee.toFixed(2)}</span>
              </div>
              {addOns?.lyftPickup && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lyft pickup</span>
                  <span>${lyftPickupFee.toFixed(2)}</span>
                </div>
              )}
              {addOns?.lyftReturn && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lyft return</span>
                  <span>${lyftReturnFee.toFixed(2)}</span>
                </div>
              )}
              {addOns?.unlimitedMiles && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unlimited miles</span>
                  <span>${unlimitedMilesFee.toFixed(2)}</span>
                </div>
              )}
              {promoCode && discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Promo: {promoCode}</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Turo Comparison */}
            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3 text-sm">
              <p className="font-medium text-green-700 dark:text-green-400">
                You save ~${Math.round(total * 0.12)} vs. Turo
              </p>
              <p className="text-green-600 dark:text-green-500 text-xs mt-1">
                RAD charges 10% vs. Turo&apos;s 20-35% fees
              </p>
            </div>
          </>
        )}

        {/* Fuel Type */}
        {vehicle.fuel_type && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Fuel className="size-4" />
            <span className="capitalize">{vehicle.fuel_type}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
