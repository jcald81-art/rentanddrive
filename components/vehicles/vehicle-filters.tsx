'use client'

/**
 * Vehicle Filters Component
 * Hydration-safe: All dates initialized client-side only
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon, SlidersHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'

const categories = [
  { value: 'all', label: 'All Vehicles' },
  { value: 'car', label: 'Cars' },
  { value: 'suv', label: 'SUVs & Trucks' },
  { value: 'motorcycle', label: 'Motorcycles' },
  { value: 'rv', label: 'RVs & Campervans' },
  { value: 'atv', label: 'ATVs & Side-by-Sides' },
]

function VehicleFiltersInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isClient, setIsClient] = useState(false)
  const [category, setCategory] = useState(searchParams.get('category') || 'all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // Only run on client to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true)
    const start = searchParams.get('start_date')
    const end = searchParams.get('end_date')
    if (start && end) {
      setDateRange({ from: new Date(start), to: new Date(end) })
    }
  }, [searchParams])

  // Helper function for date display - returns static string during SSR
  const getDateDisplay = (): string => {
    if (!isClient) return 'Pick dates'
    if (!dateRange?.from) return 'Pick dates'
    if (dateRange.to) {
      return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
    }
    return format(dateRange.from, 'MMM d, yyyy')
  }

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (category !== 'all') {
      params.set('category', category)
    } else {
      params.delete('category')
    }

    if (dateRange?.from) {
      params.set('start_date', dateRange.from.toISOString().split('T')[0])
    } else {
      params.delete('start_date')
    }

    if (dateRange?.to) {
      params.set('end_date', dateRange.to.toISOString().split('T')[0])
    } else {
      params.delete('end_date')
    }

    router.push(`/vehicles?${params.toString()}`)
  }

  const clearFilters = () => {
    setCategory('all')
    setDateRange(undefined)
    router.push('/vehicles')
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-5 text-muted-foreground" />
        <h3 className="font-semibold">Filters</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter - Hydration Safe */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Dates</label>
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
                <div className="p-4 text-sm text-muted-foreground">Loading...</div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Action Buttons */}
        <div className="flex items-end gap-2">
          <Button onClick={applyFilters} className="flex-1">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  )
}

export function VehicleFilters() {
  return (
    <Suspense fallback={<VehicleFiltersSkeleton />}>
      <VehicleFiltersInner />
    </Suspense>
  )
}

function VehicleFiltersSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="size-5 animate-pulse rounded bg-muted" />
        <div className="h-5 w-16 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-10 animate-pulse rounded bg-muted" />
        <div className="h-10 animate-pulse rounded bg-muted" />
        <div className="h-10 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
