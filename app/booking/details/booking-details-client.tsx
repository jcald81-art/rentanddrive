'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Car, Clock, MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { BookingProgressBar } from '@/components/booking/BookingProgressBar'
import { BookingSummaryCard } from '@/components/booking/BookingSummaryCard'
import { TrustBadges } from '@/components/booking/TrustBadges'

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
  carfidelity_certified?: boolean
  smoking_policy?: string
  fuel_type?: string
  mileage_included_per_day?: number
}

interface BookingDetailsClientProps {
  vehicle: Vehicle
  startDate: Date
  endDate: Date
}

export function BookingDetailsClient({
  vehicle,
  startDate,
  endDate,
}: BookingDetailsClientProps) {
  const router = useRouter()
  const [promoCode, setPromoCode] = useState('')
  const [addOns, setAddOns] = useState({
    lyftPickup: false,
    lyftReturn: false,
    unlimitedMiles: false,
  })
  const [pickupAddress, setPickupAddress] = useState('')
  const [returnAddress, setReturnAddress] = useState('')

  const handleContinue = () => {
    const params = new URLSearchParams({
      vehicle_id: vehicle.id,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      ...(addOns.lyftPickup && { lyft_pickup: 'true' }),
      ...(addOns.lyftReturn && { lyft_return: 'true' }),
      ...(addOns.unlimitedMiles && { unlimited_miles: 'true' }),
      ...(promoCode && { promo: promoCode }),
      ...(pickupAddress && { pickup_address: pickupAddress }),
      ...(returnAddress && { return_address: returnAddress }),
    })
    router.push(`/booking/verify?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Back Link */}
        <Link
          href={`/vehicles/${vehicle.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4" />
          Back to vehicle
        </Link>

        {/* Progress Bar */}
        <BookingProgressBar currentStep={1} />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Trip Details</h1>
              <p className="text-muted-foreground mt-1">
                Review your trip and add any extras
              </p>
            </div>

            {/* Trip Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="size-5" />
                  Your Trip
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="size-4" />
                      Pick-up
                    </div>
                    <p className="font-medium">
                      {startDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">10:00 AM</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="size-4" />
                      Return
                    </div>
                    <p className="font-medium">
                      {endDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">10:00 AM</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span>
                    Pick-up location: {vehicle.location_city}, {vehicle.location_state}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Includes {vehicle.mileage_included_per_day || 200} miles/day
                </p>
              </CardContent>
            </Card>

            {/* Add-ons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="size-5" />
                  Trip Add-ons
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lyft Pickup */}
                <div className="flex items-start gap-4 p-4 rounded-lg border">
                  <Checkbox
                    id="lyft-pickup"
                    checked={addOns.lyftPickup}
                    onCheckedChange={(checked) =>
                      setAddOns((prev) => ({ ...prev, lyftPickup: checked === true }))
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="lyft-pickup" className="font-medium cursor-pointer">
                      Lyft pickup to vehicle — $25
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      We&apos;ll send a Lyft to bring you to your rental
                    </p>
                    {addOns.lyftPickup && (
                      <Input
                        placeholder="Your pickup address"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        className="mt-3"
                      />
                    )}
                  </div>
                </div>

                {/* Lyft Return */}
                <div className="flex items-start gap-4 p-4 rounded-lg border">
                  <Checkbox
                    id="lyft-return"
                    checked={addOns.lyftReturn}
                    onCheckedChange={(checked) =>
                      setAddOns((prev) => ({ ...prev, lyftReturn: checked === true }))
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="lyft-return" className="font-medium cursor-pointer">
                      Lyft return from vehicle — $25
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      We&apos;ll send a Lyft after you drop off
                    </p>
                    {addOns.lyftReturn && (
                      <Input
                        placeholder="Your drop-off destination"
                        value={returnAddress}
                        onChange={(e) => setReturnAddress(e.target.value)}
                        className="mt-3"
                      />
                    )}
                  </div>
                </div>

                {/* Unlimited Miles */}
                <div className="flex items-start gap-4 p-4 rounded-lg border">
                  <Checkbox
                    id="unlimited-miles"
                    checked={addOns.unlimitedMiles}
                    onCheckedChange={(checked) =>
                      setAddOns((prev) => ({ ...prev, unlimitedMiles: checked === true }))
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor="unlimited-miles" className="font-medium cursor-pointer">
                      Unlimited miles — $15/day
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Drive without worrying about mileage limits
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Promo Code */}
            <Card>
              <CardContent className="pt-6">
                <Label htmlFor="promo" className="text-sm font-medium">
                  Promo Code
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="promo"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  />
                  <Button variant="outline">Apply</Button>
                </div>
              </CardContent>
            </Card>

            {/* Continue Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleContinue}
            >
              Continue to Verification
            </Button>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <BookingSummaryCard
              vehicle={vehicle}
              startDate={startDate}
              endDate={endDate}
              addOns={addOns}
              promoCode={promoCode || null}
              promoDiscount={promoCode === 'RAD10' ? 10 : 0}
            />
            <TrustBadges />
          </div>
        </div>
      </div>
    </div>
  )
}
