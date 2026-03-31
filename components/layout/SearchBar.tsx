'use client'

import { useState, useEffect } from 'react'
import { MapPin, Calendar, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const LOCATIONS = [
  { value: 'reno', label: 'Reno, NV' },
  { value: 'sparks', label: 'Sparks, NV' },
  { value: 'tahoe', label: 'Lake Tahoe, NV' },
]

export function SearchBar() {
  const [location, setLocation] = useState('reno')
  const [pickupDate, setPickupDate] = useState('')
  const [returnDate, setReturnDate] = useState('')

  // Set default dates on mount
  useEffect(() => {
    const today = new Date()
    const pickup = new Date(today)
    pickup.setDate(pickup.getDate() + 1)
    const returnD = new Date(pickup)
    returnD.setDate(returnD.getDate() + 3)
    
    setPickupDate(pickup.toISOString().split('T')[0])
    setReturnDate(returnD.toISOString().split('T')[0])
  }, [])

  const handleSearch = () => {
    const params = new URLSearchParams({
      location,
      start: pickupDate,
      end: returnDate,
    })
    // Use window.location for navigation to avoid router initialization issues
    window.location.href = `/vehicles?${params.toString()}`
  }

  return (
    <div 
      className="sticky top-16 z-50 bg-white dark:bg-[#1a1d1a] border-b border-black/[0.08] dark:border-white/10 shadow-sm"
    >
      <div className="max-w-[1400px] mx-auto px-6 py-3">
        {/* Desktop: Horizontal layout */}
        <div className="hidden md:flex items-center justify-center">
          <div className="flex items-center bg-card dark:bg-[#252923] rounded-full p-1.5 shadow-lg border border-border max-w-[780px] w-full">
            {/* Location */}
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 border-r border-border">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="border-0 p-0 h-auto shadow-none focus:ring-0 text-foreground font-medium text-sm bg-transparent">
                  <SelectValue placeholder="Select location" />
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

            {/* Pickup Date */}
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 border-r border-border">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full bg-transparent text-foreground font-medium text-sm focus:outline-none"
              />
            </div>

            {/* Return Date */}
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 border-r border-border">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-transparent text-foreground font-medium text-sm focus:outline-none"
              />
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-6 py-2.5 rounded-full ml-1"
            >
              Search
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile: Stacked vertical layout */}
        <div className="md:hidden flex flex-col gap-3">
          {/* Location */}
          <div className="flex items-center gap-3 bg-card dark:bg-[#252923] rounded-xl px-4 py-3 border border-border">
            <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="border-0 p-0 h-auto shadow-none focus:ring-0 text-foreground font-medium bg-transparent flex-1">
                <SelectValue placeholder="Select location" />
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

          {/* Dates row */}
          <div className="flex gap-3">
            {/* Pickup Date */}
            <div className="flex-1 flex items-center gap-3 bg-card dark:bg-[#252923] rounded-xl px-4 py-3 border border-border">
              <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full bg-transparent text-foreground font-medium focus:outline-none text-sm"
              />
            </div>

            {/* Return Date */}
            <div className="flex-1 flex items-center gap-3 bg-card dark:bg-[#252923] rounded-xl px-4 py-3 border border-border">
              <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-transparent text-foreground font-medium focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Search Button - Full width */}
          <Button
            onClick={handleSearch}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-full"
          >
            Search
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
