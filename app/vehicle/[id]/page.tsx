'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Car, Star, MapPin, Calendar, Users, Fuel, Settings, Palette, ChevronLeft, MessageCircle, Shield, Zap, Bluetooth, Camera, Navigation, Check } from 'lucide-react'
import CheckoutButton from '@/components/checkout-button'
import { VerificationBadge } from '@/components/verification-badge'

// Mock vehicle data
const mockVehicle = {
  id: '1',
  year: 2024,
  make: 'Toyota',
  model: '4Runner TRD Pro',
  color: 'Army Green',
  transmission: 'Automatic',
  seats: 5,
  category: 'SUV',
  dailyRate: 129,
  weeklyRate: 749,
  rating: 4.9,
  reviews: 47,
  description: 'Experience the ultimate adventure vehicle! This 2024 Toyota 4Runner TRD Pro is perfect for exploring Lake Tahoe and the Sierra Nevada mountains. Features include a lifted suspension, all-terrain tires, and a roof rack for your gear. Whether you\'re hitting the slopes or exploring backcountry trails, this vehicle has you covered.',
  features: ['4WD', 'Bluetooth', 'Backup Camera', 'Roof Rack', 'All-Terrain Tires', 'USB Charging', 'Pet Friendly', 'Ski Rack Compatible'],
  instantBook: true,
  host: {
    name: 'Mike T.',
    avatar: null,
    memberSince: 2022,
    responseRate: 98,
    verified: true,
  },
  hasGPS: true,
  hasSnapprPhotos: true,
  location: 'Reno, NV',
}

const mockReviews = [
  {
    id: '1',
    name: 'Sarah M.',
    date: 'January 2024',
    rating: 5,
    comment: 'Amazing vehicle for our Tahoe ski trip! Mike was super responsive and the 4Runner handled the mountain roads perfectly. Highly recommend!',
  },
  {
    id: '2',
    name: 'James K.',
    date: 'December 2023',
    rating: 5,
    comment: 'Perfect rental experience. Vehicle was spotless and fully equipped. The GPS monitoring gave us peace of mind on remote trails.',
  },
  {
    id: '3',
    name: 'Emily R.',
    date: 'November 2023',
    rating: 4,
    comment: 'Great vehicle, very capable off-road. Only minor issue was finding parking at pickup location, but Mike helped us out.',
  },
]

export default function VehicleDetailPage() {
  const params = useParams()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState(0)

  const vehicle = mockVehicle // In real app, fetch by params.id

  // Calculate duration and pricing
  const duration = useMemo(() => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, diff)
  }, [startDate, endDate])

  const subtotal = duration * vehicle.dailyRate
  const platformFee = Math.round(subtotal * 0.15)
  const total = subtotal + platformFee

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Back Navigation */}
      <div className="container mx-auto px-4 py-4">
        <Link href="/search" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
          Back to Search
        </Link>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Photos & Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Photo Gallery */}
            <div className="space-y-3">
              {/* Main Photo */}
              <div className="relative aspect-[16/10] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-xl flex items-center justify-center overflow-hidden">
                <Car className="h-32 w-32 text-[#333]" />
                {vehicle.hasSnapprPhotos && (
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur rounded-full text-sm">
                    <Camera className="h-4 w-4 text-[#FFD84D]" />
                    Pro Photos by Snappr
                  </div>
                )}
                {vehicle.instantBook && (
                  <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1.5 bg-[#FFD84D] text-black text-sm font-semibold rounded-full">
                    <Zap className="h-4 w-4" />
                    Instant Book
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPhoto(i)}
                    className={`aspect-[4/3] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-lg flex items-center justify-center border-2 transition-colors ${
                      selectedPhoto === i ? 'border-[#FFD84D]' : 'border-transparent hover:border-[#333]'
                    }`}
                  >
                    <Car className="h-8 w-8 text-[#333]" />
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Info */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-400">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-[#FFD84D] text-[#FFD84D]" />
                      <span className="font-semibold text-white">{vehicle.rating}</span>
                      <span>({vehicle.reviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {vehicle.location}
                    </div>
                  </div>
                </div>
              </div>

              {/* Host Info */}
              <div className="flex items-center gap-4 p-4 bg-[#111] border border-[#222] rounded-xl mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-[#333] to-[#1a1a1a] rounded-full flex items-center justify-center text-xl font-bold">
                  {vehicle.host.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Hosted by {vehicle.host.name}</span>
                    <VerificationBadge verified={vehicle.host.verified} />
                  </div>
                  <p className="text-sm text-gray-400">
                    Member since {vehicle.host.memberSince} · {vehicle.host.responseRate}% response rate
                  </p>
                </div>
              </div>

              {/* Bouncie GPS Badge */}
              {vehicle.hasGPS && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222] rounded-xl mb-6">
                  <div className="w-10 h-10 bg-[#FFD84D]/10 rounded-full flex items-center justify-center">
                    <Navigation className="h-5 w-5 text-[#FFD84D]" />
                  </div>
                  <div>
                    <p className="font-semibold">GPS & Diagnostics Monitored</p>
                    <p className="text-sm text-gray-400">Real-time tracking via Bouncie for safety & security</p>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Specs */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Vehicle Specs</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-400">Year</p>
                    <p className="font-semibold">{vehicle.year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-400">Make & Model</p>
                    <p className="font-semibold">{vehicle.make} {vehicle.model}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Palette className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-400">Color</p>
                    <p className="font-semibold">{vehicle.color}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-400">Transmission</p>
                    <p className="font-semibold">{vehicle.transmission}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-400">Seats</p>
                    <p className="font-semibold">{vehicle.seats}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Fuel className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-400">Category</p>
                    <p className="font-semibold">{vehicle.category}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {vehicle.features.map(feat => (
                  <div key={feat} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-[#FFD84D]" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Description</h2>
              <p className="text-gray-300 leading-relaxed">{vehicle.description}</p>
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-xl font-bold mb-4">Reviews</h2>
              <div className="space-y-4">
                {mockReviews.map(review => (
                  <div key={review.id} className="bg-[#111] border border-[#222] rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#333] to-[#1a1a1a] rounded-full flex items-center justify-center font-bold">
                          {review.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold">{review.name}</p>
                          <p className="text-sm text-gray-500">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'fill-[#FFD84D] text-[#FFD84D]' : 'text-[#333]'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-300">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Widget */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-6">
                {/* Price */}
                <div className="text-center pb-4 border-b border-[#222]">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-[#FFD84D]" style={{ fontFamily: 'DM Mono, monospace' }}>
                      ${vehicle.dailyRate}
                    </span>
                    <span className="text-gray-400">/day</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    ${vehicle.weeklyRate}/week
                  </p>
                </div>

                {/* Date Pickers */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD84D] [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD84D] [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Duration */}
                {duration > 0 && (
                  <div className="text-center py-2 bg-[#0a0a0a] rounded-lg">
                    <span className="text-sm text-gray-400">Duration: </span>
                    <span className="font-semibold" style={{ fontFamily: 'DM Mono, monospace' }}>
                      {duration} {duration === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                )}

                {/* Price Breakdown */}
                {duration > 0 && (
                  <div className="space-y-2 py-4 border-t border-b border-[#222]">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        ${vehicle.dailyRate} × {duration} days
                      </span>
                      <span style={{ fontFamily: 'DM Mono, monospace' }}>${subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Platform fee (15%)</span>
                      <span style={{ fontFamily: 'DM Mono, monospace' }}>${platformFee}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2">
                      <span>Total</span>
                      <span className="text-[#FFD84D]" style={{ fontFamily: 'DM Mono, monospace' }}>
                        ${total}
                      </span>
                    </div>
                  </div>
                )}

                {/* Book Button */}
                {duration > 0 ? (
                  <CheckoutButton
                    rentalId={`rental-${vehicle.id}-${Date.now()}`}
                    amount={total * 100}
                    vehicleLabel={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    vehicleId={vehicle.id}
                    startDate={startDate}
                    endDate={endDate}
                    className="w-full py-4 text-lg"
                  />
                ) : (
                  <button
                    disabled
                    className="w-full py-4 bg-[#333] text-gray-500 font-semibold rounded-lg cursor-not-allowed"
                  >
                    Select dates to book
                  </button>
                )}

                {/* Message Host */}
                <button className="w-full flex items-center justify-center gap-2 py-3 border border-[#333] text-gray-300 hover:text-white hover:border-[#444] rounded-lg transition-colors">
                  <MessageCircle className="h-5 w-5" />
                  Message Host
                </button>

                {/* Trust Signals */}
                <div className="pt-4 border-t border-[#222] space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Shield className="h-4 w-4 text-[#FFD84D]" />
                    <span>$1M liability coverage included</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Zap className="h-4 w-4 text-[#FFD84D]" />
                    <span>Free cancellation up to 24h before</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
