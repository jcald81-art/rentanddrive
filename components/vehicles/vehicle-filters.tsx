'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const [category, setCategory] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  useEffect(() => {
    setIsClient(true)
    setCategory(searchParams.get('category') || 'all')
    const start = searchParams.get('start_date')
    const end = searchParams.get('end_date')
    if (start && end) {
      setDateRange({ from: new Date(start), to: new Date(end) })
    }
  }, [searchParams])

  const getDateDisplay = (): string => {
    if (!isClient || !dateRange?.from) return 'Pick dates'
    if (dateRange.to) {
      return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
    }
    return format(dateRange.from, 'MMM d, yyyy')
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (category !== 'all') params.set('category', category)
    if (dateRange?.from) params.set('start_date', dateRange.from.toISOString().split('T')[0])
    if (dateRange?.to) params.set('end_date', dateRange.to.toISOString().split('T')[0])
    router.push(`/vehicles?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-5 text-muted-foreground" />
        <h3 className="font-semibold">Filters</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Dates</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !dateRange && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 size-4" />
                {getDateDisplay()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              {isClient ? (
                <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} disabled={{ before: new Date() }} />
              ) : (
                <div className="p-4 text-sm text-muted-foreground">Loading...</div>
              )}
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={applyFilters} className="flex-1">Apply Filters</Button>
          <Button variant="outline" onClick={() => { setCategory('all'); setDateRange(undefined); router.push('/vehicles') }}>Clear</Button>
        </div>
      </div>
    </div>
  )
}

export function VehicleFilters() {
  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-lg border bg-muted" />}>
      <VehicleFiltersInner />
    </Suspense>
  )
}
