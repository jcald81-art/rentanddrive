'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import {
  Car,
  Calendar,
  MapPin,
  Shield,
  Clock,
  Phone,
  Check,
  ChevronRight,
  ChevronLeft,
  Star,
  Zap,
  Tag,
  AlertCircle,
  Wallet,
  CreditCard,
} from 'lucide-react'
import { CryptoPaymentOption } from '@/components/crypto'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  daily_rate: number
  thumbnail_url?: string
  location_city: string
  location_state?: string
  is_awd?: boolean
  has_ski_rack?: boolean
  seats?: number
  instant_book?: boolean
  rating?: number
  review_count?: number
  host?: {
    id: string
    full_name: string
    avatar_url?: string
    created_at: string
  }
}

interface BookingCheckoutProps {
  vehicle: Vehicle
  initialStartDate: string
  initialEndDate: string
}

const MILEAGE_PLANS = [
  { id: 'standard', name: 'Standard', miles: 150, pricePerDay: 0, description: '150 miles/day included' },
  { id: 'unlimited', name: 'Unlimited', miles: -1, pricePerDay: 15, description: 'Drive as much as you want' },
  { id: 'road_trip', name: 'Road Trip', miles: 300, pricePerDay: 8, description: '300 miles/day for longer drives' },
]

const TRUST_BADGES = [
  { icon: Shield, label: '$1M Insurance', description: 'Every trip is protected' },
  { icon: Zap, label: 'Instant Book', description: 'Confirm immediately' },
  { icon: Phone, label: '24/7 Support', description: 'Always here to help' },
]

export default function BookingCheckout({ vehicle, initialStartDate, initialEndDate }: BookingCheckoutProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Step 1: Dates & Mileage
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)
  const [mileagePlan, setMileagePlan] = useState('standard')
  
  // Step 2: Add-ons
  const [lyftPickup, setLyftPickup] = useState(false)
  const [lyftReturn, setLyftReturn] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState<{
    code: string
    discount: number
    message: string
  } | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [validatingPromo, setValidatingPromo] = useState(false)
  
  // Step 4: Payment
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [bookingData, setBookingData] = useState<any>(null)

  // Calculate pricing
  const days = Math.max(1, Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  ))
  const selectedPlan = MILEAGE_PLANS.find(p => p.id === mileagePlan)!
  const subtotal = vehicle.daily_rate * days
  const mileageFee = selectedPlan.pricePerDay * days
  const cleaningFee = 25
  const platformFee = Math.round(subtotal * 0.10)
  const lyftPickupFee = lyftPickup ? 20 : 0
  const lyftReturnFee = lyftReturn ? 20 : 0
  const discount = promoApplied?.discount || 0
  const total = subtotal + mileageFee + cleaningFee + platformFee + lyftPickupFee + lyftReturnFee - discount

  // Calculate Turo comparison
  const turoEstimate = Math.round(total * 1.15) // Turo typically charges ~15% more in fees
  const savings = turoEstimate - total
  const savingsPercent = Math.round((savings / turoEstimate) * 100)

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return
    
    setValidatingPromo(true)
    setPromoError(null)
    
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, subtotal }),
      })
      const data = await res.json()
      
      if (data.valid) {
        setPromoApplied({
          code: data.code,
          discount: data.calculated_discount,
          message: data.message,
        })
      } else {
        setPromoError(data.message || 'Invalid promo code')
      }
    } catch {
      setPromoError('Failed to validate promo code')
    } finally {
      setValidatingPromo(false)
    }
  }

  const createBooking = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: vehicle.id,
          start_date: startDate,
          end_date: endDate,
          mileage_plan: mileagePlan,
          lyft_pickup: lyftPickup,
          lyft_return: lyftReturn,
          promo_code: promoApplied?.code || null,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }
      
      setClientSecret(data.payment_intent_client_secret)
      setBookingData(data.booking)
      setCurrentStep(4)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep === 3) {
      createBooking()
    } else {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Savings Banner */}
      <div className="bg-[#D62828] text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium">
            You&apos;re saving {savingsPercent}% vs Turo by booking direct — that&apos;s {formatCurrency(savings)} in your pocket!
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/vehicles/${vehicle.id}`} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 mb-4">
            <ChevronLeft className="h-4 w-4" />
            Back to vehicle
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Complete your booking</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl">
            {['Dates & Mileage', 'Add-ons', 'Review', 'Payment'].map((label, index) => (
              <div key={label} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  currentStep > index + 1 
                    ? 'bg-[#D62828] text-white' 
                    : currentStep === index + 1 
                      ? 'bg-[#0D0D0D] text-white' 
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {currentStep > index + 1 ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`ml-2 text-sm hidden sm:block ${
                  currentStep === index + 1 ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}>
                  {label}
                </span>
                {index < 3 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-2 ${
                    currentStep > index + 1 ? 'bg-[#D62828]' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Dates & Mileage */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#D62828]" />
                    Trip Dates & Mileage Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Pick-up Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">Return Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                      />
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      Trip duration: <span className="font-medium text-foreground">{days} day{days !== 1 ? 's' : ''}</span>
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-base font-medium">Mileage Plan</Label>
                    <RadioGroup value={mileagePlan} onValueChange={setMileagePlan} className="space-y-3">
                      {MILEAGE_PLANS.map((plan) => (
                        <label
                          key={plan.id}
                          className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                            mileagePlan === plan.id 
                              ? 'border-[#D62828] bg-[#D62828]/5' 
                              : 'border-border hover:border-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={plan.id} />
                            <div>
                              <p className="font-medium">{plan.name}</p>
                              <p className="text-sm text-muted-foreground">{plan.description}</p>
                            </div>
                          </div>
                          <span className="font-medium">
                            {plan.pricePerDay === 0 ? 'Included' : `+$${plan.pricePerDay}/day`}
                          </span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Add-ons */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-[#D62828]" />
                    Add-ons & Promo Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Lyft Ride Services</h3>
                    <p className="text-sm text-muted-foreground">
                      Get picked up or dropped off hassle-free with our Lyft integration.
                    </p>
                    
                    <div className="space-y-3">
                      <div className={`flex items-center justify-between p-4 rounded-lg border ${
                        lyftPickup ? 'border-[#D62828] bg-[#D62828]/5' : 'border-border'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                            <Car className="h-5 w-5 text-pink-600" />
                          </div>
                          <div>
                            <p className="font-medium">Lyft Pickup</p>
                            <p className="text-sm text-muted-foreground">We&apos;ll send a Lyft to pick you up</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium">+$20</span>
                          <Switch checked={lyftPickup} onCheckedChange={setLyftPickup} />
                        </div>
                      </div>

                      <div className={`flex items-center justify-between p-4 rounded-lg border ${
                        lyftReturn ? 'border-[#D62828] bg-[#D62828]/5' : 'border-border'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                            <Car className="h-5 w-5 text-pink-600" />
                          </div>
                          <div>
                            <p className="font-medium">Lyft Return</p>
                            <p className="text-sm text-muted-foreground">Get a Lyft home after drop-off</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium">+$20</span>
                          <Switch checked={lyftReturn} onCheckedChange={setLyftReturn} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Promo Code</h3>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value.toUpperCase())
                          setPromoError(null)
                        }}
                        className="flex-1"
                        disabled={!!promoApplied}
                      />
                      {promoApplied ? (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setPromoApplied(null)
                            setPromoCode('')
                          }}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button 
                          onClick={validatePromoCode} 
                          disabled={!promoCode.trim() || validatingPromo}
                          variant="outline"
                        >
                          {validatingPromo ? <Spinner className="h-4 w-4" /> : 'Apply'}
                        </Button>
                      )}
                    </div>
                    {promoError && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {promoError}
                      </p>
                    )}
                    {promoApplied && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                        <Check className="h-4 w-4" />
                        {promoApplied.message} — Saving {formatCurrency(promoApplied.discount)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-[#D62828]" />
                    Review Your Trip
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Vehicle Summary */}
                  <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {vehicle.thumbnail_url ? (
                        <Image
                          src={vehicle.thumbnail_url}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {vehicle.location_city}{vehicle.location_state ? `, ${vehicle.location_state}` : ''}
                      </p>
                      {vehicle.instant_book && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Instant Book
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Trip Details</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Pick-up</p>
                        <p className="font-medium">{new Date(startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Return</p>
                        <p className="font-medium">{new Date(endDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Mileage Plan</p>
                      <p className="font-medium">{selectedPlan.name} — {selectedPlan.description}</p>
                    </div>
                  </div>

                  {/* Add-ons Summary */}
                  {(lyftPickup || lyftReturn) && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Add-ons</h4>
                      <div className="space-y-2">
                        {lyftPickup && (
                          <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                            <span className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-pink-600" />
                              Lyft Pickup
                            </span>
                            <span className="font-medium">$20.00</span>
                          </div>
                        )}
                        {lyftReturn && (
                          <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                            <span className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-pink-600" />
                              Lyft Return
                            </span>
                            <span className="font-medium">$20.00</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Itemized Pricing */}
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>{formatCurrency(vehicle.daily_rate)} × {days} day{days !== 1 ? 's' : ''}</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {mileageFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>{selectedPlan.name} mileage ({days} days)</span>
                        <span>{formatCurrency(mileageFee * 100)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>Cleaning fee</span>
                      <span>{formatCurrency(cleaningFee * 100)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Platform fee (10%)</span>
                      <span>{formatCurrency(platformFee)}</span>
                    </div>
                    {lyftPickupFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Lyft Pickup</span>
                        <span>{formatCurrency(lyftPickupFee * 100)}</span>
                      </div>
                    )}
                    {lyftReturnFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Lyft Return</span>
                        <span>{formatCurrency(lyftReturnFee * 100)}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Promo: {promoApplied?.code}</span>
                        <span>-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  {/* Turo Comparison */}
                  <div className="bg-[#D62828]/5 border border-[#D62828]/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#D62828]">You&apos;re saving {savingsPercent}% vs Turo</p>
                        <p className="text-sm text-muted-foreground">Estimated Turo price: {formatCurrency(turoEstimate)}</p>
                      </div>
                      <span className="text-2xl font-bold text-[#D62828]">-{formatCurrency(savings)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Payment */}
            {currentStep === 4 && clientSecret && (
              <div className="space-y-6">
                {/* Payment Method Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-[#D62828]" />
                      Choose Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Card Payment Option */}
                    <div className="p-4 border-2 border-[#D62828] rounded-xl bg-[#D62828]/5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-[#D62828] rounded-lg">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Credit / Debit Card</h3>
                          <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex, Discover</p>
                        </div>
                      </div>
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret,
                          appearance: {
                            theme: 'stripe',
                            variables: {
                              colorPrimary: '#D62828',
                              borderRadius: '8px',
                            },
                          },
                        }}
                      >
                        <PaymentForm 
                          total={total} 
                          bookingId={bookingData?.id}
                          onSuccess={() => router.push('/dashboard?booking=success')}
                        />
                      </Elements>
                    </div>

                    {/* Crypto Payment Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-3 bg-background text-sm text-muted-foreground">or pay with stablecoins</span>
                      </div>
                    </div>

                    {/* Crypto Payment Option */}
                    <div className="p-4 border rounded-xl bg-[#1C1F1A]">
                      <CryptoPaymentOption
                        amount={total / 100}
                        currency="USD"
                        onPaymentInitiated={(method) => {
                          console.log('Crypto payment initiated:', method)
                        }}
                        onPaymentComplete={(txHash) => {
                          router.push(`/dashboard?booking=success&crypto=true&tx=${txHash}`)
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            {currentStep < 4 && (
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={isLoading}
                  className="bg-[#D62828] hover:bg-[#D62828]/90 text-white"
                >
                  {isLoading ? (
                    <Spinner className="h-4 w-4 mr-2" />
                  ) : null}
                  {currentStep === 3 ? 'Continue to Payment' : 'Continue'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vehicle Card */}
            <Card>
              <CardContent className="p-4">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted mb-4">
                  {vehicle.thumbnail_url ? (
                    <Image
                      src={vehicle.thumbnail_url}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-lg">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {vehicle.location_city}
                </p>
                {vehicle.rating && (
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{vehicle.rating.toFixed(1)}</span>
                    {vehicle.review_count && (
                      <span className="text-muted-foreground text-sm">({vehicle.review_count} reviews)</span>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {vehicle.is_awd && <Badge variant="secondary">AWD</Badge>}
                  {vehicle.has_ski_rack && <Badge variant="secondary">Ski Rack</Badge>}
                  {vehicle.seats && <Badge variant="secondary">{vehicle.seats} seats</Badge>}
                </div>
              </CardContent>
            </Card>

            {/* Price Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Price Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{formatCurrency(vehicle.daily_rate)} × {days} days</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {mileageFee > 0 && (
                  <div className="flex justify-between">
                    <span>Mileage upgrade</span>
                    <span>{formatCurrency(mileageFee * 100)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Fees</span>
                  <span>{formatCurrency((cleaningFee + platformFee / 100) * 100)}</span>
                </div>
                {(lyftPickupFee + lyftReturnFee) > 0 && (
                  <div className="flex justify-between">
                    <span>Lyft services</span>
                    <span>{formatCurrency((lyftPickupFee + lyftReturnFee) * 100)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <Card>
              <CardContent className="p-4 space-y-4">
                {TRUST_BADGES.map((badge) => (
                  <div key={badge.label} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#D62828]/10 flex items-center justify-center flex-shrink-0">
                      <badge.icon className="h-5 w-5 text-[#D62828]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{badge.label}</p>
                      <p className="text-xs text-muted-foreground">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Host Info */}
            {vehicle.host && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {vehicle.host.avatar_url ? (
                        <Image
                          src={vehicle.host.avatar_url}
                          alt={vehicle.host.full_name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-muted-foreground">
                          {vehicle.host.full_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{vehicle.host.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Host since {new Date(vehicle.host.created_at).getFullYear()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Payment Form Component
function PaymentForm({ 
  total, 
  bookingId,
  onSuccess 
}: { 
  total: number
  bookingId: string
  onSuccess: () => void 
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsProcessing(true)
    setPaymentError(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?booking=success`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setPaymentError(error.message || 'Payment failed. Please try again.')
      setIsProcessing(false)
    } else {
      onSuccess()
    }
  }

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {paymentError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {paymentError}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-[#D62828] hover:bg-[#D62828]/90 text-white h-12 text-base font-semibold"
      >
        {isProcessing ? (
          <>
            <Spinner className="h-5 w-5 mr-2" />
            Processing...
          </>
        ) : (
          <>
            <Shield className="h-5 w-5 mr-2" />
            Pay {formatCurrency(total)}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Your payment is secured with 256-bit SSL encryption
      </p>
    </form>
  )
}
