'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ArrowLeft, Car, Check, MapPin, Calendar, Shield, Phone, Zap, 
  Star, User, Camera, Truck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export default function DriveMonthlyVehiclePage() {
  const params = useParams()
  const router = useRouter()
  const vehicleId = params.vehicleId as string

  const [duration, setDuration] = useState<30 | 60 | 90>(60)
  const [startDate, setStartDate] = useState('')
  const [deliveryEnabled, setDeliveryEnabled] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [pricing, setPricing] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [vehicle, setVehicle] = useState<any>(null)

  // Mock vehicle data
  useEffect(() => {
    setVehicle({
      id: vehicleId,
      year: 2024,
      make: 'Tesla',
      model: 'Model 3',
      trim: 'Long Range AWD',
      daily_rate: 65,
      images: [],
      host: {
        name: 'Michael R.',
        verified: true,
        rating: 4.9,
        trips: 127,
      },
      features: ['Autopilot', 'Premium Audio', 'Heated Seats', 'Glass Roof'],
      description: 'Experience the future of driving with this Tesla Model 3. Perfect for commuting or road trips to Lake Tahoe.',
    })
  }, [vehicleId])

  // Calculate pricing when duration changes
  useEffect(() => {
    const calculatePricing = async () => {
      if (!vehicle) return
      
      const discountRate = duration === 30 ? 0.07 : duration === 60 ? 0.15 : 0.25
      const baseTotal = vehicle.daily_rate * duration
      const discount = baseTotal * discountRate
      const total = baseTotal - discount
      const deliveryFee = deliveryEnabled ? 49 : 0

      setPricing({
        dailyRate: vehicle.daily_rate,
        discountPercent: Math.round(discountRate * 100),
        monthlyTotal: total + deliveryFee,
        deliveryFee,
        mileageAllowance: 1500 * Math.ceil(duration / 30),
        leaseComparison: Math.round(total * 1.57 / (duration / 30)), // 57% more expensive
      })
    }
    calculatePricing()
  }, [vehicle, duration, deliveryEnabled])

  const handleBooking = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          rentalType: 'monthly',
          duration,
          startDate,
          deliveryEnabled,
          deliveryAddress: deliveryEnabled ? deliveryAddress : null,
          totalAmount: pricing?.monthlyTotal,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Booking error:', error)
    }
    setLoading(false)
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          <Link href="/drivemonthly" className="inline-flex items-center text-zinc-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to DriveMonthly
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Vehicle Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Photo Gallery */}
            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-4 md:col-span-3 aspect-[16/10] bg-zinc-900 rounded-xl relative overflow-hidden">
                {vehicle.images?.[0] ? (
                  <Image src={vehicle.images[0]} alt={vehicle.model} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Car className="h-20 w-20 text-zinc-700" />
                  </div>
                )}
                <Badge className="absolute bottom-3 right-3 bg-black/70 text-white border-0">
                  <Camera className="h-3 w-3 mr-1" /> Snappr Verified
                </Badge>
              </div>
              <div className="hidden md:flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square bg-zinc-900 rounded-lg flex items-center justify-center">
                    <Car className="h-8 w-8 text-zinc-700" />
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Title */}
            <div>
              <Badge className="mb-2 bg-[#FFD84D] text-black font-mono text-xs">MONTHLY AVAILABLE</Badge>
              <h1 className="text-3xl font-bold mb-2">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-zinc-400">{vehicle.trim}</p>
            </div>

            {/* Host Info */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
                    <User className="h-7 w-7 text-zinc-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{vehicle.host.name}</span>
                      {vehicle.host.verified && (
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                          <Check className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1">
                      <span className="flex items-center">
                        <Star className="h-4 w-4 text-[#FFD84D] mr-1" />
                        {vehicle.host.rating}
                      </span>
                      <span>{vehicle.host.trips} trips</span>
                    </div>
                  </div>
                  <Button variant="outline" className="border-zinc-700">
                    Message Host
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bouncie GPS Badge */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#FFD84D]/10 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-[#FFD84D]" />
                  </div>
                  <div>
                    <p className="font-semibold">Bouncie GPS Monitored</p>
                    <p className="text-sm text-zinc-400">Real-time tracking for safety and security</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {vehicle.features.map((feature: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="h-4 w-4 text-[#FFD84D]" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <p className="text-zinc-400">{vehicle.description}</p>
            </div>

            {/* What's Included */}
            <div>
              <h2 className="text-xl font-semibold mb-4">What&apos;s Included</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: Shield, label: 'Liability Insurance', desc: 'Full coverage included' },
                  { icon: Phone, label: 'Roadside Assistance', desc: '24/7 support' },
                  { icon: Calendar, label: 'Free Cancellation', desc: 'Up to 72 hours before' },
                  { icon: Car, label: 'Mileage Included', desc: `${pricing?.mileageAllowance || 1500} miles (extra $0.25/mi)` },
                  { icon: Zap, label: 'Bouncie GPS', desc: 'Safety monitoring' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-zinc-900 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-[#FFD84D]/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-[#FFD84D]" />
                    </div>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-zinc-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Monthly Pricing</h3>

                  {/* Duration Selector */}
                  <div className="flex bg-zinc-800 rounded-lg p-1 mb-6">
                    {[30, 60, 90].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d as 30 | 60 | 90)}
                        className={cn(
                          "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          duration === d 
                            ? "bg-[#FFD84D] text-black" 
                            : "text-zinc-400 hover:text-white"
                        )}
                      >
                        {d} days
                      </button>
                    ))}
                  </div>

                  {/* Price Breakdown */}
                  {pricing && (
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Daily rate</span>
                        <span className="font-mono">${pricing.dailyRate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Monthly discount</span>
                        <span className="font-mono text-green-400">-{pricing.discountPercent}%</span>
                      </div>
                      {deliveryEnabled && (
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-400">Delivery fee</span>
                          <span className="font-mono">$49</span>
                        </div>
                      )}
                      <div className="border-t border-zinc-800 pt-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-zinc-400">Total</span>
                          <span className="text-3xl font-bold font-mono text-[#FFD84D]">
                            ${Math.round(pricing.monthlyTotal)}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 text-right">for {duration} days</p>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">vs. leasing same vehicle</span>
                        <span className="font-mono text-zinc-500 line-through">
                          ${pricing.leaseComparison}/mo
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Start Date */}
                  <div className="mb-4">
                    <label className="text-sm text-zinc-400 block mb-2">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Delivery Toggle */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm">Delivery to my address</span>
                      </div>
                      <Switch
                        checked={deliveryEnabled}
                        onCheckedChange={setDeliveryEnabled}
                        className="data-[state=checked]:bg-[#FFD84D]"
                      />
                    </div>
                    {deliveryEnabled && (
                      <Input
                        placeholder="Enter delivery address"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white mt-2"
                      />
                    )}
                    {deliveryEnabled && (
                      <p className="text-xs text-zinc-500 mt-1">+$49 delivery fee</p>
                    )}
                  </div>

                  {/* Book Button */}
                  <Button 
                    onClick={handleBooking}
                    disabled={loading || !startDate}
                    className="w-full bg-[#FFD84D] hover:bg-[#FFD84D]/90 text-black font-semibold h-12"
                  >
                    {loading ? 'Processing...' : 'Book Monthly'}
                  </Button>

                  <p className="text-xs text-zinc-500 text-center mt-4">
                    Free cancellation up to 72 hours before pickup
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
