'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Calendar, ChevronLeft, ChevronRight, Clock, DollarSign, AlertCircle, Check, ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

// Generate calendar days for a month
function generateCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()
  
  const days: (number | null)[] = []
  
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }
  
  return days
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  daily_rate: number
  minimum_trip_days?: number
  maximum_trip_days?: number
  maximum_advance_booking?: number
  instant_book?: boolean
  weekly_rate_cents?: number
  monthly_rate_cents?: number
}

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

export default function VehicleAvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: vehicleId } = use(params)
  const router = useRouter()
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch vehicle data
  useEffect(() => {
    const fetchVehicle = async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single()

      if (!error && data) {
        setVehicle(data)
        // Populate availability from vehicle data
        setAvailability(prev => ({
          ...prev,
          minimumTrip: data.minimum_trip_days || 1,
          maximumTrip: data.maximum_trip_days || 30,
          advanceBooking: data.maximum_advance_booking || 90,
          instantBook: data.instant_book !== false,
          weeklyDiscount: data.weekly_rate_cents 
            ? Math.round((1 - (data.weekly_rate_cents / (data.daily_rate * 7 * 100))) * 100)
            : 10,
          monthlyDiscount: data.monthly_rate_cents
            ? Math.round((1 - (data.monthly_rate_cents / (data.daily_rate * 30 * 100))) * 100)
            : 20,
        }))
      }
      setLoading(false)
    }

    fetchVehicle()
  }, [vehicleId, supabase])

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

  const handleSave = async () => {
    setSaving(true)
    
    const dailyRate = vehicle?.daily_rate || 0
    const weeklyRateCents = Math.round(dailyRate * 7 * (1 - availability.weeklyDiscount / 100) * 100)
    const monthlyRateCents = Math.round(dailyRate * 30 * (1 - availability.monthlyDiscount / 100) * 100)

    const { error } = await supabase
      .from('vehicles')
      .update({
        minimum_trip_days: availability.minimumTrip,
        maximum_trip_days: availability.maximumTrip,
        maximum_advance_booking: availability.advanceBooking,
        instant_book: availability.instantBook,
        weekly_rate_cents: weeklyRateCents,
        monthly_rate_cents: monthlyRateCents,
      })
      .eq('id', vehicleId)

    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  // Calculate earnings with discounts
  const dailyRate = vehicle?.daily_rate || 0
  const weeklyRate = dailyRate * 7 * (1 - availability.weeklyDiscount / 100)
  const monthlyRate = dailyRate * 30 * (1 - availability.monthlyDiscount / 100)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Vehicle Not Found</h2>
          <Link href="/hostslab/rad-fleet-command">
            <Button>Back to Fleet Command</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/hostslab/rad-fleet-command">
              <Button variant="outline" size="icon" className="border-white/20 text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-white/60">Availability & Pricing</p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-[#e63946] hover:bg-[#e63946]/80"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
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
      </div>
    </div>
  )
}
