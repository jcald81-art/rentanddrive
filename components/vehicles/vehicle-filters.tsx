'use client'

/**
 * Vehicle Filters Component
 * Uses hydration-safe date handling to prevent SSR/CSR mismatch
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Car, Truck, Bike, Caravan, SlidersHorizontal } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { DateRange } from 'react-day-picker'

const categories = [
  { value: 'all', label: 'All Vehicles', icon: SlidersHorizontal },
  { value: 'car', label: 'Cars', icon: Car },
  { value: 'suv', label: 'SUVs', icon: Truck },
  { value: 'motorcycle', label: 'Motorcycles', icon: Bike },
  { value: 'rv', label: 'RVs', icon: Caravan },
  { value: 'atv', label: 'ATVs', icon: Bike },
]

function VehicleFiltersInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // CRITICAL: Track client-side mount to prevent hydration mismatch
  const [isClient, setIsClient] = useState(false)
  
  const [category, setCategory] = useState(searchParams.get('category') || 'all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [awd, setAwd] = useState(searchParams.get('awd') === 'true')
  const [skiRack, setSkiRack] = useState(searchParams.get('ski_rack') === 'true')
  const [towHitch, setTowHitch] = useState(searchParams.get('tow_hitch') === 'true')
  const [minSeats, setMinSeats] = useState(searchParams.get('min_seats') || '')
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseInt(searchParams.get('min_rate') || '0'),
    parseInt(searchParams.get('max_rate') || '500'),
  ])

  // Initialize date range and mark as client-side ONLY after mount
  useEffect(() => {
    const start = searchParams.get('start_date')
    const end = searchParams.get('end_date')
    if (start && end) {
      setDateRange({ from: new Date(start), to: new Date(end) })
    }
    setIsClient(true)
  }, [searchParams])

  // Update URL when filters change
  useEffect(() => {
    if (!isClient) return // Don't update URL until client-side
    
    const params = new URLSearchParams()

    if (category && category !== 'all') params.set('category', category)
    if (dateRange?.from) params.set('start_date', format(dateRange.from, 'yyyy-MM-dd'))
    if (dateRange?.to) params.set('end_date', format(dateRange.to, 'yyyy-MM-dd'))
    if (awd) params.set('awd', 'true')
    if (skiRack) params.set('ski_rack', 'true')
    if (towHitch) params.set('tow_hitch', 'true')
    if (minSeats) params.set('min_seats', minSeats)
    if (priceRange[0] > 0) params.set('min_rate', priceRange[0].toString())
    if (priceRange[1] < 500) params.set('max_rate', priceRange[1].toString())

    router.push(`/vehicles?${params.toString()}`, { scroll: false })
  }, [category, dateRange, awd, skiRack, towHitch, minSeats, priceRange, router, isClient])

  // Format date range display - returns static string on server
  const getDateDisplay = (): string => {
    if (!isClient) return 'Pick dates'
    if (!dateRange?.from) return 'Pick dates'
    if (dateRange.to) {
      return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
    }
    return format(dateRange.from, 'MMM d, yyyy')
  }

  return (
    <aside className="flex w-full flex-col gap-6 lg:w-72">
      <div className="rounded-lg border bg-card p-5">
        <h2 className="mb-4 font-semibold text-foreground">Filters</h2>

        {/* Category */}
        <div className="mb-6">
          <Label className="mb-3 block text-sm font-medium">Category</Label>
          <div className="flex flex-col gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    category === cat.value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <Icon className="size-4" />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Date Range - HYDRATION SAFE */}
        <div className="mb-6">
          <Label className="mb-3 block text-sm font-medium">Dates</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !dateRange && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 size-4" />
                {getDateDisplay()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              {isClient ? (
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={{ before: new Date() }}
                />
              ) : (
                <div className="p-4 text-center text-muted-foreground">Loading...</div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* AWD Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <Label htmlFor="awd-toggle" className="text-sm font-medium">
            AWD / 4WD Only
          </Label>
          <Switch
            id="awd-toggle"
            checked={awd}
            onCheckedChange={setAwd}
          />
        </div>

        {/* Ski Rack Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <Label htmlFor="ski-rack-toggle" className="text-sm font-medium">
            Ski Rack Included
          </Label>
          <Switch
            id="ski-rack-toggle"
            checked={skiRack}
            onCheckedChange={setSkiRack}
          />
        </div>

        {/* Tow Hitch Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <Label htmlFor="tow-hitch-toggle" className="text-sm font-medium">
            Tow Hitch
          </Label>
          <Switch
            id="tow-hitch-toggle"
            checked={towHitch}
            onCheckedChange={setTowHitch}
          />
        </div>

        {/* Seats Filter */}
        <div className="mb-6">
          <Label htmlFor="seats-select" className="mb-3 block text-sm font-medium">
            Minimum Seats
          </Label>
          <select
            id="seats-select"
            value={minSeats}
            onChange={(e) => setMinSeats(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Any</option>
            <option value="2">2+ seats</option>
            <option value="4">4+ seats</option>
            <option value="5">5+ seats</option>
            <option value="6">6+ seats</option>
            <option value="7">7+ seats</option>
            <option value="8">8+ seats</option>
          </select>
        </div>

        {/* Price Range */}
        <div className="mb-2">
          <Label className="mb-3 block text-sm font-medium">
            Price Range: ${priceRange[0]} - ${priceRange[1]}+
          </Label>
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={0}
            max={500}
            step={10}
            className="mt-4"
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>$0</span>
            <span>$500+</span>
          </div>
        </div>

        {/* Clear Filters */}
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={() => {
            setCategory('all')
            setDateRange(undefined)
            setAwd(false)
            setSkiRack(false)
            setTowHitch(false)
            setMinSeats('')
            setPriceRange([0, 500])
          }}
        >
          Clear All Filters
        </Button>
      </div>
    </aside>
  )
}

function VehicleFiltersFallback() {
  return (
    <aside className="flex w-full flex-col gap-6 lg:w-72">
      <div className="rounded-lg border bg-card p-5">
        <Skeleton className="h-6 w-20 mb-4" />
        <div className="mb-6">
          <Skeleton className="h-4 w-16 mb-3" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        </div>
        <div className="mb-6">
          <Skeleton className="h-4 w-12 mb-3" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-10" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

export function VehicleFilters() {
  return (
    <Suspense fallback={<VehicleFiltersFallback />}>
      <VehicleFiltersInner />
    </Suspense>
  )
}
