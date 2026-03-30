'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format, addDays } from 'date-fns'
import { Calendar as CalendarIcon, MapPin, Search } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { DateRange } from 'react-day-picker'

const LOCATIONS = [
  { value: 'reno', label: 'Reno, NV' },
  { value: 'sparks', label: 'Sparks, NV' },
  { value: 'tahoe', label: 'Lake Tahoe, NV' },
  { value: 'carson', label: 'Carson City, NV' },
  { value: 'truckee', label: 'Truckee, CA' },
]

const CATEGORIES = [
  { value: 'all', label: 'All Vehicles' },
  { value: 'car', label: 'Cars' },
  { value: 'suv', label: 'SUVs' },
  { value: 'truck', label: 'Trucks' },
  { value: 'motorcycle', label: 'Motorcycles' },
  { value: 'rv', label: 'RVs' },
  { value: 'atv', label: 'ATVs' },
]

function HeroSearchBarInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [location, setLocation] = useState(searchParams.get('location') || 'reno')
  const [category, setCategory] = useState(searchParams.get('category') || 'all')
  const [mounted, setMounted] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // Initialize date range only on client to avoid hydration mismatch
  useEffect(() => {
    const start = searchParams.get('start_date')
    const end = searchParams.get('end_date')
    if (start && end) {
      setDateRange({ from: new Date(start), to: new Date(end) })
    } else {
      // Default to tomorrow for 3 days
      const tomorrow = addDays(new Date(), 1)
      setDateRange({ from: tomorrow, to: addDays(tomorrow, 3) })
    }
    setMounted(true)
  }, [searchParams])

  function handleSearch() {
    const params = new URLSearchParams()
    
    if (location) params.set('location', location)
    if (category && category !== 'all') params.set('category', category)
    if (dateRange?.from) params.set('start_date', format(dateRange.from, 'yyyy-MM-dd'))
    if (dateRange?.to) params.set('end_date', format(dateRange.to, 'yyyy-MM-dd'))

    router.push(`/vehicles?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-4 md:p-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Location */}
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Location</label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="h-12 text-left">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#CC0000]" />
                <SelectValue placeholder="Select location" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((loc) => (
                <SelectItem key={loc.value} value={loc.value}>
                  {loc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Dates</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-12 w-full justify-start text-left font-normal',
                  !dateRange && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-[#CC0000]" />
                {!mounted ? (
                  'Loading...'
                ) : dateRange?.from ? (
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
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                disabled={{ before: new Date() }}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Category */}
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Vehicle Type</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="All Vehicles" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <Button 
            onClick={handleSearch}
            className="h-12 px-8 bg-[#CC0000] hover:bg-[#CC0000]/90"
          >
            <Search className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Search</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

function HeroSearchBarFallback() {
  return (
    <div className="bg-white rounded-lg shadow-xl p-4 md:p-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-4 w-12 mb-1" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="flex items-end">
          <Skeleton className="h-12 w-24" />
        </div>
      </div>
    </div>
  )
}

export function HeroSearchBar() {
  return (
    <Suspense fallback={<HeroSearchBarFallback />}>
      <HeroSearchBarInner />
    </Suspense>
  )
}
