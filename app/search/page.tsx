'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Car, Star, Zap, Bluetooth, PawPrint, Baby, Users, SlidersHorizontal, X, MapPin, Calendar, Search } from 'lucide-react'
import { VerificationBadge } from '@/components/verification-badge'
import { NavHeader } from '@/components/nav-header'

// Mock vehicle data
const mockVehicles = [
  {
    id: '1',
    year: 2024,
    make: 'Toyota',
    model: '4Runner TRD Pro',
    dailyRate: 129,
    rating: 4.9,
    reviews: 47,
    category: 'SUV',
    features: ['Bluetooth', 'Pet Friendly', '4WD'],
    instantBook: true,
    hostVerified: true,
    seats: 5,
  },
  {
    id: '2',
    year: 2023,
    make: 'Tesla',
    model: 'Model Y',
    dailyRate: 149,
    rating: 4.8,
    reviews: 32,
    category: 'Electric',
    features: ['Autopilot', 'Premium Sound', 'AWD'],
    instantBook: true,
    hostVerified: true,
    seats: 5,
  },
  {
    id: '3',
    year: 2024,
    make: 'Jeep',
    model: 'Wrangler Rubicon',
    dailyRate: 119,
    rating: 4.7,
    reviews: 28,
    category: 'SUV',
    features: ['4WD', 'Removable Top', 'Trail Rated'],
    instantBook: false,
    hostVerified: true,
    seats: 4,
  },
  {
    id: '4',
    year: 2023,
    make: 'Ford',
    model: 'F-150 Lightning',
    dailyRate: 159,
    rating: 4.9,
    reviews: 19,
    category: 'Truck',
    features: ['Electric', 'Pro Power', 'Tow Package'],
    instantBook: true,
    hostVerified: false,
    seats: 5,
  },
  {
    id: '5',
    year: 2024,
    make: 'BMW',
    model: 'X5 M50i',
    dailyRate: 249,
    rating: 5.0,
    reviews: 15,
    category: 'Luxury',
    features: ['Premium Sound', 'AWD', 'Sport Package'],
    instantBook: false,
    hostVerified: true,
    seats: 5,
  },
  {
    id: '6',
    year: 2023,
    make: 'Subaru',
    model: 'Outback Wilderness',
    dailyRate: 89,
    rating: 4.6,
    reviews: 63,
    category: 'SUV',
    features: ['AWD', 'Roof Rack', 'Pet Friendly'],
    instantBook: true,
    hostVerified: true,
    seats: 5,
  },
]

const categories = ['Sedan', 'SUV', 'Truck', 'Luxury', 'Sports', 'Van', 'Electric']
const featureOptions = ['Bluetooth', 'Pet Friendly', 'Child Seat', 'AWD', '4WD', 'Roof Rack', 'GPS', 'Backup Camera']

export default function SearchPage() {
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [priceRange, setPriceRange] = useState([0, 500])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [minSeats, setMinSeats] = useState(1)
  const [instantBookOnly, setInstantBookOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filteredVehicles, setFilteredVehicles] = useState(mockVehicles)

  useEffect(() => {
    let results = mockVehicles

    // Filter by price
    results = results.filter(v => v.dailyRate >= priceRange[0] && v.dailyRate <= priceRange[1])

    // Filter by category
    if (selectedCategories.length > 0) {
      results = results.filter(v => selectedCategories.includes(v.category))
    }

    // Filter by seats
    results = results.filter(v => v.seats >= minSeats)

    // Filter by instant book
    if (instantBookOnly) {
      results = results.filter(v => v.instantBook)
    }

    setFilteredVehicles(results)
  }, [priceRange, selectedCategories, selectedFeatures, minSeats, instantBookOnly])

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const toggleFeature = (feat: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feat) ? prev.filter(f => f !== feat) : [...prev, feat]
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <NavHeader variant="dark" />

      {/* Sticky Search Bar */}
      <div className="sticky top-0 z-50 bg-[#111111] border-b border-[#222] shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Reno, Sparks, or Lake Tahoe"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD84D]"
              />
            </div>
            <div className="flex gap-3 flex-1 md:flex-none">
              <div className="relative flex-1 md:w-40">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD84D] [color-scheme:dark]"
                />
              </div>
              <div className="relative flex-1 md:w-40">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-[#FFD84D] [color-scheme:dark]"
                />
              </div>
            </div>
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-[#FFD84D] hover:bg-[#e6c344] text-black font-semibold rounded-lg transition-colors">
              <Search className="h-5 w-5" />
              Search
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center justify-center gap-2 px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg"
            >
              <SlidersHorizontal className="h-5 w-5" />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <aside className={`${showFilters ? 'fixed inset-0 z-50 bg-[#0a0a0a] p-6 overflow-y-auto' : 'hidden'} md:block md:relative md:w-64 md:flex-shrink-0`}>
            {showFilters && (
              <div className="flex items-center justify-between mb-6 md:hidden">
                <h2 className="text-xl font-bold">Filters</h2>
                <button onClick={() => setShowFilters(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
            )}

            <div className="space-y-6">
              {/* Price Range */}
              <div className="bg-[#111] border border-[#222] rounded-lg p-4">
                <h3 className="font-semibold mb-3">Price Range</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-400" style={{ fontFamily: 'DM Mono, monospace' }}>${priceRange[0]}</span>
                  <span className="text-gray-500">—</span>
                  <span className="text-sm text-gray-400" style={{ fontFamily: 'DM Mono, monospace' }}>${priceRange[1]}</span>
                  <span className="text-sm text-gray-500">/day</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full accent-[#FFD84D]"
                />
              </div>

              {/* Vehicle Category */}
              <div className="bg-[#111] border border-[#222] rounded-lg p-4">
                <h3 className="font-semibold mb-3">Vehicle Type</h3>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="w-4 h-4 rounded border-[#333] bg-[#1a1a1a] accent-[#FFD84D]"
                      />
                      <span className="text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="bg-[#111] border border-[#222] rounded-lg p-4">
                <h3 className="font-semibold mb-3">Features</h3>
                <div className="space-y-2">
                  {featureOptions.map(feat => (
                    <label key={feat} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFeatures.includes(feat)}
                        onChange={() => toggleFeature(feat)}
                        className="w-4 h-4 rounded border-[#333] bg-[#1a1a1a] accent-[#FFD84D]"
                      />
                      <span className="text-sm">{feat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Seats */}
              <div className="bg-[#111] border border-[#222] rounded-lg p-4">
                <h3 className="font-semibold mb-3">Minimum Seats</h3>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <select
                    value={minSeats}
                    onChange={(e) => setMinSeats(parseInt(e.target.value))}
                    className="flex-1 bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FFD84D]"
                  >
                    {[1, 2, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>{n}+ seats</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Instant Book */}
              <div className="bg-[#111] border border-[#222] rounded-lg p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#FFD84D]" />
                    <span className="font-semibold">Instant Book</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={instantBookOnly}
                    onChange={(e) => setInstantBookOnly(e.target.checked)}
                    className="w-5 h-5 rounded border-[#333] bg-[#1a1a1a] accent-[#FFD84D]"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">Book immediately without host approval</p>
              </div>

              {showFilters && (
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full py-3 bg-[#FFD84D] hover:bg-[#e6c344] text-black font-semibold rounded-lg md:hidden"
                >
                  Show {filteredVehicles.length} Results
                </button>
              )}
            </div>
          </aside>

          {/* Results Grid */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold">{filteredVehicles.length} vehicles available</h1>
              <select className="bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FFD84D]">
                <option>Sort: Recommended</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Rating: High to Low</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map(vehicle => (
                <Link
                  key={vehicle.id}
                  href={`/vehicle/${vehicle.id}`}
                  className="bg-[#111] border border-[#222] rounded-xl overflow-hidden hover:border-[#FFD84D]/50 transition-colors group"
                >
                  {/* Photo Placeholder */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center">
                    <Car className="h-16 w-16 text-[#333]" />
                    {vehicle.instantBook && (
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-[#FFD84D] text-black text-xs font-semibold rounded">
                        <Zap className="h-3 w-3" />
                        Instant Book
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold group-hover:text-[#FFD84D] transition-colors">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Star className="h-4 w-4 fill-[#FFD84D] text-[#FFD84D]" />
                          <span>{vehicle.rating}</span>
                          <span>({vehicle.reviews} reviews)</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-[#FFD84D]" style={{ fontFamily: 'DM Mono, monospace' }}>
                          ${vehicle.dailyRate}
                        </div>
                        <div className="text-xs text-gray-500">/day</div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {vehicle.features.slice(0, 3).map(feat => (
                        <span
                          key={feat}
                          className="px-2 py-1 bg-[#1a1a1a] text-xs text-gray-400 rounded"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>

                    {/* Host Verification */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#222]">
                      <VerificationBadge verified={vehicle.hostVerified} />
                      <span className="text-sm text-[#FFD84D] group-hover:underline">View Car →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
