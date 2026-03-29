'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Car, Truck, Bike, Caravan, SlidersHorizontal } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { DateRange } from 'react-day-picker'

const categories = [
  { value: '', label: 'All Vehicles', icon: SlidersHorizontal },
  { value: 'car', label: 'Cars', icon: Car },
  { value: 'suv', label: 'SUVs', icon: Truck },
  { value: 'motorcycle', label: 'Motorcycles', icon: Bike },
  { value: 'rv', label: 'RVs', icon: Caravan },
  { value: 'atv', label: 'ATVs', icon: Bike },
]

export function VehicleFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const start = searchParams.get('start_date')
    const end = searchParams.get('end_date')
    if (start && end) {
      return { from: new Date(start), to: new Date(end) }
    }
    return undefined
  })
  const [awd, setAwd] = useState(searchParams.get('awd') === 'true')
  const [skiRack, setSkiRack] = useState(searchParams.get('ski_rack') === 'true')
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseInt(searchParams.get('min_rate') || '0'),
    parseInt(searchParams.get('max_rate') || '500'),
  ])

  useEffect(() => {
    const params = new URLSearchParams()

    if (category) params.set('category', category)
    if (dateRange?.from) params.set('start_date', format(dateRange.from, 'yyyy-MM-dd'))
    if (dateRange?.to) params.set('end_date', format(dateRange.to, 'yyyy-MM-dd'))
    if (awd) params.set('awd', 'true')
    if (skiRack) params.set('ski_rack', 'true')
    if (priceRange[0] > 0) params.set('min_rate', priceRange[0].toString())
    if (priceRange[1] < 500) params.set('max_rate', priceRange[1].toString())

    router.push(`/vehicles?${params.toString()}`, { scroll: false })
  }, [category, dateRange, awd, skiRack, priceRange, router])

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

        {/* Date Range */}
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
                {dateRange?.from ? (
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
            setCategory('')
            setDateRange(undefined)
            setAwd(false)
            setSkiRack(false)
            setPriceRange([0, 500])
          }}
        >
          Clear All Filters
        </Button>
      </div>
    </aside>
  )
}
