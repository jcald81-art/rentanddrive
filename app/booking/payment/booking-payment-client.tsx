'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Bitcoin, Loader2 } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookingProgressBar } from '@/components/booking/BookingProgressBar'
import { BookingSummaryCard } from '@/components/booking/BookingSummaryCard'
import { TrustBadges } from '@/components/booking/TrustBadges'
import { differenceInDays } from 'date-fns'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

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
  }
}

interface BookingPaymentClientProps {
  vehicle: Vehicle
  startDate: Date
  endDate: Date
  addOns: {
    lyftPickup: boolean
    lyftReturn: boolean
    unlimitedMiles: boolean
  }
  promoCode: string | null
  user: User
  pickupAddress?: string
  returnAddress?: string
}

function StripePaymentForm({
  onSuccess,
  isProcessing,
  setIsProcessing,
}: {
  onSuccess: () => void
  isProcessing: boolean
  setIsProcessing: (v: boolean) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsProcessing(true)
    setError(null)

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/confirmed`,
      },
      redirect: 'if_required',
    })

    if (submitError) {
      setError(submitError.message || 'Payment failed')
      setIsProcessing(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={!stripe || isProcessing}>
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Complete Booking'
        )}
      </Button>
    </form>
  )
}

export function BookingPaymentClient({
  vehicle,
  startDate,
  endDate,
  addOns,
  promoCode,
  user,
  pickupAddress,
  returnAddress,
}: BookingPaymentClientProps) {
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'crypto'>('card')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Calculate total
  const days = differenceInDays(endDate, startDate) || 1
  const basePrice = vehicle.daily_rate * days
  const serviceFee = Math.round(basePrice * 0.10)
  const lyftPickupFee = addOns.lyftPickup ? 25 : 0
  const lyftReturnFee = addOns.lyftReturn ? 25 : 0
  const unlimitedMilesFee = addOns.unlimitedMiles ? 15 * days : 0
  const promoDiscount = promoCode === 'RAD10' ? 10 : 0
  const total = basePrice + serviceFee + lyftPickupFee + lyftReturnFee + unlimitedMilesFee - promoDiscount

  const initializePayment = async () => {
    if (clientSecret) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/bookings/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          addOns,
          promoCode,
          amount: Math.round(total * 100), // cents
        }),
      })

      const data = await response.json()
      if (data.clientSecret) {
        setClientSecret(data.clientSecret)
      }
    } catch (err) {
      console.error('[v0] Error creating payment intent:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = async () => {
    // Create the booking
    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          addOns,
          promoCode,
          totalAmount: total,
          pickupAddress,
          returnAddress,
        }),
      })

      const data = await response.json()
      if (data.bookingId) {
        router.push(`/booking/confirmed?booking_id=${data.bookingId}`)
      } else {
        router.push('/booking/confirmed')
      }
    } catch {
      router.push('/booking/confirmed')
    }
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
    return `/booking/verify?${params.toString()}`
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
          Back to verification
        </Link>

        {/* Progress Bar */}
        <BookingProgressBar currentStep={3} />

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Payment</h1>
              <p className="text-muted-foreground mt-1">
                Complete your booking with a secure payment
              </p>
            </div>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'card' | 'crypto')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="card" className="flex items-center gap-2">
                      <CreditCard className="size-4" />
                      Card
                    </TabsTrigger>
                    <TabsTrigger value="crypto" className="flex items-center gap-2">
                      <Bitcoin className="size-4" />
                      Crypto
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="card" className="mt-6">
                    {!clientSecret ? (
                      <Button
                        onClick={initializePayment}
                        disabled={isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Enter Card Details'
                        )}
                      </Button>
                    ) : (
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret,
                          appearance: {
                            theme: 'stripe',
                            variables: {
                              colorPrimary: '#2D4A2D',
                            },
                          },
                        }}
                      >
                        <StripePaymentForm
                          onSuccess={handlePaymentSuccess}
                          isProcessing={isProcessing}
                          setIsProcessing={setIsProcessing}
                        />
                      </Elements>
                    )}
                  </TabsContent>

                  <TabsContent value="crypto" className="mt-6">
                    <div className="text-center py-8">
                      <Bitcoin className="size-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold mb-2">Pay with Cryptocurrency</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        We accept BTC, ETH, USDC, and USDT
                      </p>
                      <Button variant="outline" disabled>
                        Coming Soon
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <p className="text-xs text-muted-foreground text-center">
              Your payment is processed securely by Stripe. RAD never stores your card details.
            </p>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <BookingSummaryCard
              vehicle={vehicle}
              startDate={startDate}
              endDate={endDate}
              addOns={addOns}
              promoCode={promoCode}
              promoDiscount={promoDiscount}
            />
            <TrustBadges />
          </div>
        </div>
      </div>
    </div>
  )
}
