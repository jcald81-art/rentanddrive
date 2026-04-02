'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, ChevronLeft, ChevronRight, Clock, DollarSign, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

// Generate calendar days for a month
function generateCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()
  
  const days: (number | null)[] = []
  
  // Add empty slots for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  
  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }
  
  return days
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

interface AvailabilityData {
  blockedDates: string[]
  minimumTrip: number
  maximumTrip: number
  advanceBooking: number
  instantBook: boolean
  weekendPremium: number
  weeklyDiscount: number
  monthlyDiscount: number
}

export default function AvailabilityPage() {
  const router = useRouter()
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [listingData, setListingData] = useState<Record<string, unknown> | null>(null)
  
  const [availability, setAvailability] = useState<AvailabilityData>({
    blockedDates: [],
    minimumTrip: 1,
    maximumTrip: 30,
    advanceBooking: 90,
    instantBook: true,
    weekendPremium: 0,
    weeklyDiscount: 10,
    monthlyDiscount: 20,
  })

  // Load draft
  useEffect(() => {
    const draft = localStorage.getItem('rad-listing-draft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        setListingData(parsed)
        if (parsed.availability) {
          setAvailability(prev => ({ ...prev, ...parsed.availability }))
        }
      } catch {}
    }
  }, [])

  // Save draft
  const saveDraft = useCallback(() => {
    if (listingData) {
      localStorage.setItem('rad-listing-draft', JSON.stringify({
        ...listingData,
        availability,
      }))
    }
  }, [listingData, availability])

  useEffect(() => {
    const timeout = setTimeout(saveDraft, 500)
    return () => clearTimeout(timeout)
  }, [availability, saveDraft])

  const calendarDays = generateCalendarDays(currentYear, currentMonth)

  const toggleBlockedDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setAvailability(prev => ({
      ...prev,
      blockedDates: prev.blockedDates.includes(dateStr)
        ? prev.blockedDates.filter(d => d !== dateStr)
        : [...prev.blockedDates, dateStr]
    }))
  }

  const isBlocked = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return availability.blockedDates.includes(dateStr)
  }

  const isPast = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return date < todayStart
  }

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(prev => prev - 1)
    } else {
      setCurrentMonth(prev => prev - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(prev => prev + 1)
    } else {
      setCurrentMonth(prev => prev + 1)
    }
  }

  const handleContinue = () => {
    saveDraft()
    router.push('/host/vehicles/add/settings')
  }

  // Calculate earnings with discounts
  const dailyRate = listingData?.daily_rate ? parseFloat(String(listingData.daily_rate)) : 0
  const weeklyRate = dailyRate * 7 * (1 - availability.weeklyDiscount / 100)
  const monthlyRate = dailyRate * 30 * (1 - availability.monthlyDiscount / 100)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Set Your Availability</h1>
        <p className="text-white/60">
          Block dates when your vehicle isn&apos;t available and set trip length limits.
        </p>
      </div>

      {/* Calendar */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#e63946]" />
            Block Unavailable Dates
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={goToPreviousMonth}
              className="border-white/20 text-white hover:bg-white/10 h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-white font-medium min-w-[140px] text-center">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <Button 
              variant="outline" 
              size="icon"
              onClick={goToNextMonth}
              className="border-white/20 text-white hover:bg-white/10 h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-white/40 text-xs font-medium py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                disabled={day === null || isPast(day)}
                onClick={() => day && toggleBlockedDate(day)}
                className={`
                  aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all
                  ${day === null 
                    ? 'invisible' 
                    : isPast(day)
                      ? 'text-white/20 cursor-not-allowed'
                      : isBlocked(day)
                        ? 'bg-red-500/30 text-red-400 border border-red-500/50'
                        : 'bg-white/5 text-white hover:bg-white/10 border border-transparent hover:border-white/20'
                  }
                `}
              >
                {day}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white/5 border border-white/20" />
              <span className="text-white/60">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50" />
              <span className="text-white/60">Blocked</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trip Length Settings */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#e63946]" />
            Trip Length Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-white/80">Minimum Trip (days)</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={availability.minimumTrip}
                onChange={(e) => setAvailability(prev => ({ 
                  ...prev, 
                  minimumTrip: parseInt(e.target.value) || 1 
                }))}
                className="bg-white/10 border-white/20 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-white/80">Maximum Trip (days)</Label>
              <Input
                type="number"
                min="1"
                max="90"
                value={availability.maximumTrip}
                onChange={(e) => setAvailability(prev => ({ 
                  ...prev, 
                  maximumTrip: parseInt(e.target.value) || 30 
                }))}
                className="bg-white/10 border-white/20 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-white/80">Advance Booking (days)</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={availability.advanceBooking}
                onChange={(e) => setAvailability(prev => ({ 
                  ...prev, 
                  advanceBooking: parseInt(e.target.value) || 90 
                }))}
                className="bg-white/10 border-white/20 text-white mt-1"
              />
              <p className="text-white/40 text-xs mt-1">How far in advance can renters book</p>
            </div>
          </div>

          {/* Instant Book Toggle */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="text-white font-medium">Instant Book</p>
              <p className="text-white/60 text-sm">Allow renters to book without your approval</p>
            </div>
            <Switch
              checked={availability.instantBook}
              onCheckedChange={(checked) => setAvailability(prev => ({ ...prev, instantBook: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Adjustments */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#e63946]" />
            Dynamic Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-white/80">Weekend Premium (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={availability.weekendPremium}
                onChange={(e) => setAvailability(prev => ({ 
                  ...prev, 
                  weekendPremium: parseInt(e.target.value) || 0 
                }))}
                className="bg-white/10 border-white/20 text-white mt-1"
              />
              <p className="text-white/40 text-xs mt-1">Extra charge for Fri-Sun</p>
            </div>
            <div>
              <Label className="text-white/80">Weekly Discount (%)</Label>
              <Input
                type="number"
                min="0"
                max="50"
                value={availability.weeklyDiscount}
                onChange={(e) => setAvailability(prev => ({ 
                  ...prev, 
                  weeklyDiscount: parseInt(e.target.value) || 0 
                }))}
                className="bg-white/10 border-white/20 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-white/80">Monthly Discount (%)</Label>
              <Input
                type="number"
                min="0"
                max="50"
                value={availability.monthlyDiscount}
                onChange={(e) => setAvailability(prev => ({ 
                  ...prev, 
                  monthlyDiscount: parseInt(e.target.value) || 0 
                }))}
                className="bg-white/10 border-white/20 text-white mt-1"
              />
            </div>
          </div>

          {/* Earnings Preview */}
          {dailyRate > 0 && (
            <div className="bg-black/30 rounded-lg p-4 space-y-3">
              <p className="text-white/60 text-sm">Effective rates:</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-white/40 text-xs">Daily</p>
                  <p className="text-xl font-bold text-white">${dailyRate}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs">Weekly ({availability.weeklyDiscount}% off)</p>
                  <p className="text-xl font-bold text-green-400">${Math.round(weeklyRate)}</p>
                </div>
                <div>
                  <p className="text-white/40 text-xs">Monthly ({availability.monthlyDiscount}% off)</p>
                  <p className="text-xl font-bold text-green-400">${Math.round(monthlyRate)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-white font-medium">Pro Tip</p>
            <p className="text-white/70 text-sm">
              Vehicles with Instant Book enabled get 40% more bookings. You can always review 
              renter profiles before trips start.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pb-20 sm:pb-0">
        <Button
          variant="outline"
          onClick={() => router.push('/host/vehicles/add/photos')}
          className="border-white/20 text-white hover:bg-white/10"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          size="lg"
          className="bg-[#e63946] hover:bg-[#e63946]/80 text-white px-8"
        >
          Continue to Settings
        </Button>
      </div>
    </div>
  )
}
