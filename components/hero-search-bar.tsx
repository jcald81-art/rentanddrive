"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, addDays } from "date-fns"
import { MapPin, CalendarDays, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export function HeroSearchBar() {
  const router = useRouter()
  const [location, setLocation] = useState("Reno, NV")
  const [mounted, setMounted] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [startOpen, setStartOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)

  // Initialize dates only on client to avoid hydration mismatch
  useEffect(() => {
    setStartDate(addDays(new Date(), 1))
    setEndDate(addDays(new Date(), 4))
    setMounted(true)
  }, [])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (location) params.set("location", location)
    if (startDate) params.set("start_date", format(startDate, "yyyy-MM-dd"))
    if (endDate) params.set("end_date", format(endDate, "yyyy-MM-dd"))
    router.push(`/vehicles?${params.toString()}`)
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl border-2 border-gray-200 md:flex-row md:items-center md:gap-0 md:rounded-full">
        {/* Location */}
        <div className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 md:rounded-full md:border-r md:border-gray-200">
          <MapPin className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500">Where</p>
            <Input 
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, airport, or address"
              className="h-auto border-0 bg-transparent p-0 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus-visible:ring-0"
            />
          </div>
        </div>

        {/* Start Date */}
        <Popover open={startOpen} onOpenChange={setStartOpen}>
          <PopoverTrigger asChild>
            <button className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-gray-50 md:rounded-full md:border-r md:border-gray-200">
              <CalendarDays className="h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500">From</p>
                <p className={cn("text-sm font-medium", startDate ? "text-gray-900" : "text-gray-400")}>
                  {!mounted ? "Loading..." : startDate ? format(startDate, "MMM d, yyyy") : "Add date"}
                </p>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => {
                setStartDate(date)
                setStartOpen(false)
                if (date && (!endDate || date >= endDate)) {
                  setEndDate(addDays(date, 3))
                }
              }}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* End Date */}
        <Popover open={endOpen} onOpenChange={setEndOpen}>
          <PopoverTrigger asChild>
            <button className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-gray-50 md:rounded-full">
              <CalendarDays className="h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500">Until</p>
                <p className={cn("text-sm font-medium", endDate ? "text-gray-900" : "text-gray-400")}>
                  {!mounted ? "Loading..." : endDate ? format(endDate, "MMM d, yyyy") : "Add date"}
                </p>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={(date) => {
                setEndDate(date)
                setEndOpen(false)
              }}
              disabled={(date) => date < (startDate || new Date())}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Search Button */}
        <Button 
          size="lg" 
          onClick={handleSearch}
          className="mx-2 h-12 gap-2 rounded-full px-6"
        >
          <Search className="h-5 w-5" />
          <span className="md:inline">Search</span>
        </Button>
      </div>

      {/* Quick filters */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button 
          onClick={() => router.push("/vehicles?category=suv&awd=true")}
          className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          AWD for Tahoe
        </button>
        <button 
          onClick={() => router.push("/vehicles?ski_rack=true")}
          className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          Ski Rack
        </button>
        <button 
          onClick={() => router.push("/vehicles?category=truck")}
          className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          Trucks
        </button>
        <button 
          onClick={() => router.push("/vehicles?category=rv")}
          className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          RVs
        </button>
      </div>
    </div>
  )
}
