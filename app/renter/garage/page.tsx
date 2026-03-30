'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format, addDays } from 'date-fns'
import {
  Search, MapPin, Calendar, Filter, Star, Radar, Shield, Tag,
  ChevronDown, X, Check, ArrowUpDown, Snowflake, Zap, Users
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarUI } from '@/components/ui/calendar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { DateRange } from 'react-day-picker'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  daily_rate: number
  images: string[]
  rating: number
  review_count: number
  has_bouncie: boolean
  has_carfidelity: boolean
  sell_while_renting: boolean
  category: string
  seats: number
  is_awd: boolean
  has_ski_rack: boolean
  instant_book: boolean
}

function GarageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [location, setLocation] = useState(searchParams.get('location') || 'Reno, NV')
  const [mounted, setMounted] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [compareList, setCompareList] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  
  // Filters
  const [awd, setAwd] = useState(searchParams.get('awd') === 'true')
  const [skiRack, setSkiRack] = useState(searchParams.get('ski_rack') === 'true')
  const [instantBook, setInstantBook] = useState(searchParams.get('instant_book') === 'true')
  const [priceRange, setPriceRange] = useState([0, 200])
  const [minSeats, setMinSeats] = useState(1)
  const [categories, setCategories] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('rating')

  useEffect(() => {
    setMounted(true)
    const start = searchParams.get('start_date')
    const end = searchParams.get('end_date')
    if (start && end) {
      setDateRange({ from: new Date(start), to: new Date(end) })
    } else {
      const tomorrow = addDays(new Date(), 1)
      setDateRange({ from: tomorrow, to: addDays(tomorrow, 3) })
    }
    fetchVehicles()
  }, [searchParams])

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (awd) params.set('awd', 'true')
      if (skiRack) params.set('ski_rack', 'true')
      if (instantBook) params.set('instant_book', 'true')
      params.set('sort', sortBy)
      
      const res = await fetch(`/api/vehicles?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setVehicles(data.vehicles || [])
      }
    } catch (e) {
      // Mock data
      setVehicles([
        { id: '1', make: 'Toyota', model: '4Runner', year: 2023, daily_rate: 89, images: ['/placeholder.svg'], rating: 4.9, review_count: 47, has_bouncie: true, has_carfidelity: true, sell_while_renting: false, category: 'suv', seats: 5, is_awd: true, has_ski_rack: true, instant_book: true },
        { id: '2', make: 'Jeep', model: 'Wrangler', year: 2024, daily_rate: 95, images: ['/placeholder.svg'], rating: 4.8, review_count: 32, has_bouncie: true, has_carfidelity: false, sell_while_renting: true, category: 'suv', seats: 4, is_awd: true, has_ski_rack: false, instant_book: true },
        { id: '3', make: 'Ford', model: 'Bronco', year: 2023, daily_rate: 99, images: ['/placeholder.svg'], rating: 4.7, review_count: 28, has_bouncie: true, has_carfidelity: true, sell_while_renting: false, category: 'suv', seats: 5, is_awd: true, has_ski_rack: true, instant_book: false },
        { id: '4', make: 'Subaru', model: 'Outback', year: 2024, daily_rate: 65, images: ['/placeholder.svg'], rating: 4.9, review_count: 53, has_bouncie: true, has_carfidelity: true, sell_while_renting: false, category: 'wagon', seats: 5, is_awd: true, has_ski_rack: false, instant_book: true },
        { id: '5', make: 'Tesla', model: 'Model Y', year: 2024, daily_rate: 110, images: ['/placeholder.svg'], rating: 4.6, review_count: 19, has_bouncie: true, has_carfidelity: false, sell_while_renting: false, category: 'suv', seats: 5, is_awd: true, has_ski_rack: false, instant_book: true },
        { id: '6', make: 'Honda', model: 'CR-V', year: 2023, daily_rate: 55, images: ['/placeholder.svg'], rating: 4.8, review_count: 61, has_bouncie: true, has_carfidelity: true, sell_while_renting: true, category: 'suv', seats: 5, is_awd: true, has_ski_rack: true, instant_book: true },
      ])
    }
    setLoading(false)
  }

  const toggleCompare = (id: string) => {
    if (compareList.includes(id)) {
      setCompareList(compareList.filter(v => v !== id))
    } else if (compareList.length < 3) {
      setCompareList([...compareList, id])
    }
  }

  const clearFilters = () => {
    setAwd(false)
    setSkiRack(false)
    setInstantBook(false)
    setPriceRange([0, 200])
    setMinSeats(1)
    setCategories([])
  }

  const FilterContent = () => (
    <div className="space-y-6">
      {/* AWD */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Snowflake className="h-4 w-4 text-[#CC0000]" />
          <span className="text-white">AWD/4WD Only</span>
        </div>
        <Checkbox 
          checked={awd} 
          onCheckedChange={(c) => setAwd(!!c)}
          className="border-slate-600 data-[state=checked]:bg-[#CC0000]"
        />
      </div>

      {/* Ski Rack */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⛷️</span>
          <span className="text-white">Ski Rack</span>
        </div>
        <Checkbox 
          checked={skiRack} 
          onCheckedChange={(c) => setSkiRack(!!c)}
          className="border-slate-600 data-[state=checked]:bg-[#CC0000]"
        />
      </div>

      {/* Instant Book */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-white">Instant Book</span>
        </div>
        <Checkbox 
          checked={instantBook} 
          onCheckedChange={(c) => setInstantBook(!!c)}
          className="border-slate-600 data-[state=checked]:bg-[#CC0000]"
        />
      </div>

      {/* Price Range */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white">Price Range</span>
          <span className="text-slate-400 text-sm">${priceRange[0]} - ${priceRange[1]}</span>
        </div>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={300}
          step={10}
          className="[&_[role=slider]]:bg-[#CC0000]"
        />
      </div>

      {/* Minimum Seats */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-white">Minimum Seats</span>
          <span className="text-slate-400 text-sm">{minSeats}+</span>
        </div>
        <div className="flex gap-2">
          {[2, 4, 5, 7].map(n => (
            <Button
              key={n}
              variant="outline"
              size="sm"
              className={cn(
                'flex-1 border-slate-600',
                minSeats === n ? 'bg-[#CC0000] border-[#CC0000] text-white' : 'text-slate-300'
              )}
              onClick={() => setMinSeats(n)}
            >
              {n}+
            </Button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <p className="text-white mb-2">Category</p>
        <div className="grid grid-cols-2 gap-2">
          {['SUV', 'Car', 'Truck', 'Van', 'Luxury', 'Sports'].map(cat => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={categories.includes(cat.toLowerCase())}
                onCheckedChange={(c) => {
                  if (c) setCategories([...categories, cat.toLowerCase()])
                  else setCategories(categories.filter(x => x !== cat.toLowerCase()))
                }}
                className="border-slate-600 data-[state=checked]:bg-[#CC0000]"
              />
              <span className="text-slate-300 text-sm">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button variant="outline" className="flex-1 border-slate-600 text-slate-300" onClick={clearFilters}>
          Clear All
        </Button>
        <Button className="flex-1 bg-[#CC0000] hover:bg-[#AA0000]" onClick={() => {
          setFiltersOpen(false)
          fetchVehicles()
        }}>
          Apply Filters
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black">
      {/* Search Header */}
      <div className="sticky top-14 md:top-16 z-40 bg-black/95 backdrop-blur border-b border-slate-800 p-4">
        <div className="flex flex-col md:flex-row gap-3 max-w-7xl mx-auto">
          {/* Location */}
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#CC0000]" />
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
              placeholder="Location"
            />
          </div>

          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start bg-slate-800 border-slate-700 text-white hover:bg-slate-700 md:w-64"
              >
                <Calendar className="mr-2 h-4 w-4 text-[#CC0000]" />
                {mounted && dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                    </>
                  ) : (
                    format(dateRange.from, 'MMM d, yyyy')
                  )
                ) : (
                  'Pick dates'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700" align="start">
              <CalendarUI
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                disabled={{ before: new Date() }}
              />
            </PopoverContent>
          </Popover>

          {/* Search Button */}
          <Button className="bg-[#CC0000] hover:bg-[#AA0000]" onClick={fetchVehicles}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>

          {/* Mobile Filters */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden border-slate-700 text-white">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-black border-slate-800 h-[80vh]">
              <SheetHeader>
                <SheetTitle className="text-white">Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6 overflow-y-auto">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 max-w-7xl mx-auto">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'rounded-full whitespace-nowrap',
              awd ? 'bg-[#CC0000] border-[#CC0000] text-white' : 'border-slate-600 text-slate-300'
            )}
            onClick={() => setAwd(!awd)}
          >
            <Snowflake className="h-3 w-3 mr-1" />
            AWD
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'rounded-full whitespace-nowrap',
              skiRack ? 'bg-[#CC0000] border-[#CC0000] text-white' : 'border-slate-600 text-slate-300'
            )}
            onClick={() => setSkiRack(!skiRack)}
          >
            ⛷️ Ski Rack
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'rounded-full whitespace-nowrap',
              instantBook ? 'bg-[#CC0000] border-[#CC0000] text-white' : 'border-slate-600 text-slate-300'
            )}
            onClick={() => setInstantBook(!instantBook)}
          >
            <Zap className="h-3 w-3 mr-1" />
            Instant Book
          </Button>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32 h-8 rounded-full border-slate-600 text-slate-300 text-sm">
              <ArrowUpDown className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="price_asc">Price: Low</SelectItem>
              <SelectItem value="price_desc">Price: High</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block w-64 p-4 border-r border-slate-800 sticky top-32 h-[calc(100vh-8rem)] overflow-y-auto">
          <h3 className="font-semibold text-white mb-4">Filters</h3>
          <FilterContent />
        </aside>

        {/* Results Grid */}
        <main className="flex-1 p-4">
          {/* Compare Bar */}
          {compareList.length > 0 && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 mb-4 flex items-center justify-between">
              <span className="text-white">
                {compareList.length} vehicle{compareList.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-slate-600 text-slate-300" onClick={() => setCompareList([])}>
                  Clear
                </Button>
                <Button size="sm" className="bg-[#CC0000] hover:bg-[#AA0000]" disabled={compareList.length < 2}>
                  Compare ({compareList.length}/3)
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="bg-slate-900 border-slate-800 animate-pulse">
                  <div className="aspect-[4/3] bg-slate-800" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-5 bg-slate-800 rounded w-3/4" />
                    <div className="h-4 bg-slate-800 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((vehicle) => (
                <Card
                  key={vehicle.id}
                  className={cn(
                    'bg-slate-900 border-slate-800 hover:border-[#CC0000] transition-colors overflow-hidden group',
                    compareList.includes(vehicle.id) && 'ring-2 ring-[#CC0000]'
                  )}
                >
                  <Link href={`/vehicles/${vehicle.id}`}>
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={vehicle.images[0] || '/placeholder.svg'}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {vehicle.has_bouncie && (
                          <Badge className="bg-[#CC0000]/90">
                            <Radar className="h-3 w-3 mr-1" />
                            Eagle
                          </Badge>
                        )}
{vehicle.has_carfidelity && (
  <Badge className="bg-green-600/90">
  <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      {vehicle.sell_while_renting && (
                        <Badge className="absolute bottom-2 right-2 bg-[#CC0000]/90">
                          <Tag className="h-3 w-3 mr-1" />
                          For Sale
                        </Badge>
                      )}
                      {vehicle.instant_book && (
                        <Badge className="absolute top-2 right-2 bg-amber-500/90">
                          <Zap className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-white">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            <span className="text-sm text-slate-400">{vehicle.rating}</span>
                          </div>
                          <span className="text-slate-600">•</span>
                          <span className="text-sm text-slate-400">{vehicle.review_count} trips</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Users className="h-3 w-3 text-slate-500" />
                          <span className="text-xs text-slate-500">{vehicle.seats} seats</span>
                          {vehicle.is_awd && (
                            <>
                              <span className="text-slate-600">•</span>
                              <Snowflake className="h-3 w-3 text-blue-400" />
                              <span className="text-xs text-slate-500">AWD</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#CC0000]">${vehicle.daily_rate}</p>
                        <p className="text-xs text-slate-500">/day</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'w-full mt-3 border-slate-700',
                        compareList.includes(vehicle.id) ? 'bg-[#CC0000] border-[#CC0000] text-white' : 'text-slate-300'
                      )}
                      onClick={(e) => {
                        e.preventDefault()
                        toggleCompare(vehicle.id)
                      }}
                    >
                      {compareList.includes(vehicle.id) ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Selected
                        </>
                      ) : (
                        'Compare'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default function GaragePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-[#CC0000] border-t-transparent rounded-full" />
    </div>}>
      <GarageContent />
    </Suspense>
  )
}
