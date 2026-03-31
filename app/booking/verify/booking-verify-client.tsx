'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BookingProgressBar } from '@/components/booking/BookingProgressBar'
import { BookingSummaryCard } from '@/components/booking/BookingSummaryCard'
import { TrustBadges } from '@/components/booking/TrustBadges'
import { AuthModal } from '@/components/auth/AuthModal'

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
}

interface User {
  id: string
  email?: string
  profile?: {
    full_name?: string
    rad_verified?: boolean
    drivers_license_verified?: boolean
  }
}

interface BookingVerifyClientProps {
  vehicle: Vehicle
  startDate: Date
  endDate: Date
  addOns: {
    lyftPickup: boolean
    lyftReturn: boolean
    unlimitedMiles: boolean
  }
  promoCode: string | null
  user: User | null
  pickupAddress?: string
  returnAddress?: string
}

export function BookingVerifyClient({
  vehicle,
  startDate,
  endDate,
  addOns,
  promoCode,
  user,
  pickupAddress,
  returnAddress,
}: BookingVerifyClientProps) {
  const router = useRouter()
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [cancellationAccepted, setCancellationAccepted] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const isVerified = user?.profile?.rad_verified || user?.profile?.drivers_license_verified
  const canContinue = user && termsAccepted && cancellationAccepted

  const handleContinue = () => {
    if (!user) {
      setAuthModalOpen(true)
      return
    }

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
    router.push(`/booking/payment?${params.toString()}`)
  }

  const buildBackUrl = () => {
    const params = new URLSearchParams({
      vehicle_id: vehicle.id,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      ...(addOns.lyftPickup && { lyft_pickup: 'true' }),
      ...(addOns.lyftReturn && { lyft_return: 'true' }),
      ...(addOns.unlimitedMiles && { unlimited_miles: 'true' }),
      ...(promoCode && { promo: promoCode }),
    })
    return `/booking/details?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Back Link */}
        <Link
          href={buildBackUrl()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="size-4" />
          Back to details
        </Link>

        {/* Progress Bar */}
        <BookingProgressBar currentStep={2} />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Verify Your Identity</h1>
              <p className="text-muted-foreground mt-1">
                Complete verification to proceed with your booking
              </p>
            </div>

            {/* Authentication Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5" />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                      <CheckCircle2 className="size-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-400">
                          Signed in as {user.email}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-500">
                          {user.profile?.full_name || 'RAD Member'}
                        </p>
                      </div>
                    </div>

                    {isVerified ? (
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                        <CheckCircle2 className="size-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-400">
                            RAD Verified
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-500">
                            Your identity has been verified
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="size-4" />
                        <AlertDescription>
                          Complete RAD verification to unlock instant booking on future trips.
                          You can still proceed with this booking.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="size-4" />
                      <AlertDescription>
                        Please sign in or create an account to continue with your booking.
                      </AlertDescription>
                    </Alert>
                    <Button onClick={() => setAuthModalOpen(true)} className="w-full">
                      Sign In or Create Account
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Terms & Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-5" />
                  Terms & Agreements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg border">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    disabled={!user}
                  />
                  <div className="flex-1">
                    <Label htmlFor="terms" className="font-medium cursor-pointer">
                      I agree to the Terms of Service
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      By checking this box, you agree to RAD&apos;s{' '}
                      <Link href="/terms" className="text-primary hover:underline" target="_blank">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg border">
                  <Checkbox
                    id="cancellation"
                    checked={cancellationAccepted}
                    onCheckedChange={(checked) => setCancellationAccepted(checked === true)}
                    disabled={!user}
                  />
                  <div className="flex-1">
                    <Label htmlFor="cancellation" className="font-medium cursor-pointer">
                      I understand the Cancellation Policy
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Free cancellation up to 48 hours before pick-up. See our{' '}
                      <Link
                        href="/cancellation-policy"
                        className="text-primary hover:underline"
                        target="_blank"
                      >
                        full cancellation policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Continue Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleContinue}
              disabled={!canContinue}
            >
              {user ? 'Continue to Payment' : 'Sign In to Continue'}
            </Button>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <BookingSummaryCard
              vehicle={vehicle}
              startDate={startDate}
              endDate={endDate}
              addOns={addOns}
              promoCode={promoCode}
              promoDiscount={promoCode === 'RAD10' ? 10 : 0}
            />
            <TrustBadges />
          </div>
        </div>
      </div>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultMode="signin"
      />
    </div>
  )
}
