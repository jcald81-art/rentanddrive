'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, ChevronDown, X } from 'lucide-react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { value: 'all', label: 'All Types' },
  { value: 'car', label: 'Cars' },
  { value: 'suv', label: 'SUVs' },
  { value: 'truck', label: 'Trucks' },
  { value: 'motorcycle', label: 'Motorcycles' },
  { value: 'rv', label: 'RVs' },
  { value: 'atv', label: 'ATVs' },
]

const PRICE_RANGES = [
  { value: 'all', label: 'Any Price' },
  { value: '0-50', label: 'Under $50/day' },
  { value: '50-100', label: '$50 - $100/day' },
  { value: '100-150', label: '$100 - $150/day' },
  { value: '150-200', label: '$150 - $200/day' },
  { value: '200+', label: '$200+/day' },
]

const FEATURES = [
  { value: 'awd', label: 'AWD/4WD' },
  { value: 'ski_rack', label: 'Ski Rack' },
  { value: 'tow_hitch', label: 'Tow Hitch' },
  { value: 'pet_friendly', label: 'Pet Friendly' },
]

function VehicleFiltersInner() {
  const searchParams = useSearchParams()
  const [isClient, setIsClient] = useState(false)
  
  // Filter states
  const [mode, setMode] = useState<'rent' | 'buy'>('rent')
  const [category, setCategory] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [features, setFeatures] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  useEffect(() => {
    setIsClient(true)
    setCategory(searchParams.get('category') || 'all')
    setMode((searchParams.get('mode') as 'rent' | 'buy') || 'rent')
    
    // Parse price range
    const minRate = searchParams.get('min_rate')
    const maxRate = searchParams.get('max_rate')
    if (minRate && maxRate) {
      setPriceRange(`${minRate}-${maxRate}`)
    } else if (maxRate) {
      setPriceRange(`0-${maxRate}`)
    } else if (minRate) {
      setPriceRange(`${minRate}+`)
    }
    
    // Parse features
    const activeFeatures: string[] = []
    if (searchParams.get('awd') === 'true') activeFeatures.push('awd')
    if (searchParams.get('ski_rack') === 'true') activeFeatures.push('ski_rack')
    if (searchParams.get('tow_hitch') === 'true') activeFeatures.push('tow_hitch')
    if (searchParams.get('pet_friendly') === 'true') activeFeatures.push('pet_friendly')
    setFeatures(activeFeatures)
    
    // Parse dates
    const start = searchParams.get('start_date')
    const end = searchParams.get('end_date')
    if (start && end) {
      setDateRange({ from: new Date(start), to: new Date(end) })
    }
  }, [searchParams])

  const toggleFeature = (feature: string) => {
    setFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    )
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    
    params.set('mode', mode)
    if (category !== 'all') params.set('category', category)
    
    // Parse and apply price range
    if (priceRange !== 'all') {
      if (priceRange.endsWith('+')) {
        params.set('min_rate', priceRange.replace('+', ''))
      } else {
        const [min, max] = priceRange.split('-')
        if (min !== '0') params.set('min_rate', min)
        params.set('max_rate', max)
      }
    }
    
    // Apply features
    features.forEach(f => params.set(f, 'true'))
    
    // Apply dates
    if (dateRange?.from) params.set('start_date', dateRange.from.toISOString().split('T')[0])
    if (dateRange?.to) params.set('end_date', dateRange.to.toISOString().split('T')[0])
    
    window.location.href = `/vehicles?${params.toString()}`
  }

  const clearFilters = () => {
    setCategory('all')
    setPriceRange('all')
    setFeatures([])
    setDateRange(undefined)
    window.location.href = '/vehicles'
  }

  const hasActiveFilters = category !== 'all' || priceRange !== 'all' || features.length > 0 || dateRange?.from

  return (
    <div className="w-full">
      {/* Compact horizontal filter bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-card border border-border rounded-lg">
        {/* Rent/Buy Toggle */}
        <div className="flex rounded-full bg-muted p-0.5">
          <button
            onClick={() => setMode('rent')}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-full transition-colors',
              mode === 'rent' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Rent
          </button>
          <button
            onClick={() => setMode('buy')}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-full transition-colors',
              mode === 'buy' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Buy
          </button>
        </div>

        <div className="h-6 w-px bg-border hidden sm:block" />

        {/* Category */}
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 w-auto min-w-[100px] border-0 bg-transparent text-sm font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Price Range */}
        <Select value={priceRange} onValueChange={setPriceRange}>
          <SelectTrigger className="h-8 w-auto min-w-[120px] border-0 bg-transparent text-sm font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRICE_RANGES.map(range => (
              <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range (for rent mode) */}
        {mode === 'rent' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className={cn(
                  'h-8 text-sm font-medium',
                  dateRange?.from && 'text-primary'
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                {isClient && dateRange?.from ? (
                  dateRange.to 
                    ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                    : format(dateRange.from, 'MMM d')
                ) : 'Dates'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              {isClient && (
                <Calendar 
                  mode="range" 
                  selected={dateRange} 
                  onSelect={setDateRange} 
                  numberOfMonths={2} 
                  disabled={{ before: new Date() }} 
                />
              )}
            </PopoverContent>
          </Popover>
        )}

        {/* Features Dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className={cn(
                'h-8 text-sm font-medium',
                features.length > 0 && 'text-primary'
              )}
            >
              Features
              {features.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5">
                  {features.length}
                </span>
              )}
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            {FEATURES.map(feature => (
              <button
                key={feature.value}
                onClick={() => toggleFeature(feature.value)}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                  features.includes(feature.value)
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'hover:bg-muted'
                )}
              >
                {feature.label}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <div className="flex-1" />

        {/* Apply Button */}
        <Button onClick={applyFilters} size="sm" className="h-8">
          Search
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button 
            onClick={clearFilters} 
            variant="ghost" 
            size="sm" 
            className="h-8 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}

export function VehicleFilters() {
  return (
    <Suspense fallback={<div className="h-12 animate-pulse rounded-lg border bg-muted" />}>
      <VehicleFiltersInner />
    </Suspense>
  )
}
