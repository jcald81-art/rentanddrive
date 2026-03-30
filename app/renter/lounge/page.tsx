'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { format, addDays, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns'
import { 
  Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer,
  Calendar, Clock, MapPin, Star, Radar, Shield, ChevronRight,
  Search, AlertTriangle, Mountain, Ticket, Car
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarUI } from '@/components/ui/calendar'
import type { DateRange } from 'react-day-picker'

interface WeatherData {
  temp: string
  condition: string
  icon: 'sun' | 'cloud' | 'rain' | 'snow' | 'wind'
  location: string
}

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  daily_rate: number
  images: string[]
  rating: number
  review_count: number
  has_bouncie: boolean
}

const WEATHER_ICONS = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
  snow: CloudSnow,
  wind: Wind,
}

export default function LoungePage() {
  const router = useRouter()
  const [userName, setUserName] = useState('Adventurer')
  const [roadScore, setRoadScore] = useState(85)
  const [weather, setWeather] = useState<WeatherData[]>([
    { temp: '45°F', condition: 'Partly Cloudy', icon: 'cloud', location: 'Reno' },
    { temp: '32°F', condition: 'Snow', icon: 'snow', location: 'Lake Tahoe' },
  ])
  const [nextTrip, setNextTrip] = useState<{
    startDate: string
    vehicle: string
    daysAway: number
    hoursAway: number
    minutesAway: number
  } | null>(null)
  const [featuredVehicles, setFeaturedVehicles] = useState<Vehicle[]>([])
  const [awdAvailable, setAwdAvailable] = useState(5)
  const [mounted, setMounted] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  useEffect(() => {
    setMounted(true)
    const tomorrow = addDays(new Date(), 1)
    setDateRange({ from: tomorrow, to: addDays(tomorrow, 3) })

    // Fetch user data
    const fetchData = async () => {
      try {
        // Fetch weather from wttr.in
        const weatherRes = await fetch('https://wttr.in/Reno?format=j1')
        if (weatherRes.ok) {
          const data = await weatherRes.json()
          const current = data.current_condition[0]
          setWeather([
            {
              temp: `${current.temp_F}°F`,
              condition: current.weatherDesc[0].value,
              icon: getWeatherIcon(current.weatherCode),
              location: 'Reno'
            },
            {
              temp: `${parseInt(current.temp_F) - 15}°F`,
              condition: 'Snow Likely',
              icon: 'snow',
              location: 'Lake Tahoe'
            }
          ])
        }
      } catch (e) {
        // Use defaults
      }

      // Fetch featured vehicles
      try {
        const vehiclesRes = await fetch('/api/vehicles?limit=4&sort=rating')
        if (vehiclesRes.ok) {
          const data = await vehiclesRes.json()
          setFeaturedVehicles(data.vehicles || [])
        }
      } catch (e) {
        // Use mock data
        setFeaturedVehicles([
          { id: '1', make: 'Toyota', model: '4Runner', year: 2023, daily_rate: 89, images: ['/placeholder.svg'], rating: 4.9, review_count: 47, has_bouncie: true },
          { id: '2', make: 'Jeep', model: 'Wrangler', year: 2024, daily_rate: 95, images: ['/placeholder.svg'], rating: 4.8, review_count: 32, has_bouncie: true },
          { id: '3', make: 'Ford', model: 'Bronco', year: 2023, daily_rate: 99, images: ['/placeholder.svg'], rating: 4.7, review_count: 28, has_bouncie: true },
          { id: '4', make: 'Subaru', model: 'Outback', year: 2024, daily_rate: 65, images: ['/placeholder.svg'], rating: 4.9, review_count: 53, has_bouncie: true },
        ])
      }

      // Fetch next trip
      try {
        const tripRes = await fetch('/api/bookings/upcoming')
        if (tripRes.ok) {
          const data = await tripRes.json()
          if (data.booking) {
            const startDate = new Date(data.booking.start_date)
            setNextTrip({
              startDate: data.booking.start_date,
              vehicle: `${data.booking.vehicle.year} ${data.booking.vehicle.make} ${data.booking.vehicle.model}`,
              daysAway: differenceInDays(startDate, new Date()),
              hoursAway: differenceInHours(startDate, new Date()) % 24,
              minutesAway: differenceInMinutes(startDate, new Date()) % 60,
            })
          }
        }
      } catch (e) {
        // No upcoming trip
      }
    }

    fetchData()
  }, [])

  const getWeatherIcon = (code: string): 'sun' | 'cloud' | 'rain' | 'snow' | 'wind' => {
    const codeNum = parseInt(code)
    if (codeNum >= 200 && codeNum < 400) return 'rain'
    if (codeNum >= 600 && codeNum < 700) return 'snow'
    if (codeNum >= 800 && codeNum < 803) return 'sun'
    return 'cloud'
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (dateRange?.from) params.set('start_date', format(dateRange.from, 'yyyy-MM-dd'))
    if (dateRange?.to) params.set('end_date', format(dateRange.to, 'yyyy-MM-dd'))
    router.push(`/renter/garage?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 space-y-6">
      {/* Personalized Greeting */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome back, {userName}!
          </h1>
          <p className="text-slate-400 mt-1">Ready for your next adventure?</p>
        </div>
        
        {/* Road Score Gauge */}
        <div className="flex items-center gap-4 bg-slate-900 rounded-2xl p-4 border border-slate-800">
          <div className="relative h-20 w-20">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#1e293b"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#CC0000"
                strokeWidth="8"
                strokeDasharray={`${(roadScore / 100) * 251.2} 251.2`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{roadScore}</span>
            </div>
          </div>
          <div>
            <p className="font-semibold text-white">Road Score</p>
            <p className="text-sm text-slate-400">Top 15% of renters</p>
          </div>
        </div>
      </section>

      {/* Quick Search */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                  >
                    <Calendar className="mr-2 h-4 w-4 text-[#CC0000]" />
                    {mounted && dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                        </>
                      ) : (
                        format(dateRange.from, 'MMM d, yyyy')
                      )
                    ) : (
                      'Pick your dates'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700" align="start">
                  <CalendarUI
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    disabled={{ before: new Date() }}
                    className="rounded-md"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button 
              className="bg-[#CC0000] hover:bg-[#AA0000] text-white"
              onClick={handleSearch}
            >
              <Search className="h-4 w-4 mr-2" />
              Find Your Ride
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weather + Next Trip Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weather Widget */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-[#CC0000]" />
              Current Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {weather.map((w) => {
              const WeatherIcon = WEATHER_ICONS[w.icon]
              return (
                <div key={w.location} className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
                  <WeatherIcon className="h-8 w-8 text-[#CC0000]" />
                  <div>
                    <p className="font-semibold text-white">{w.temp}</p>
                    <p className="text-xs text-slate-400">{w.location}</p>
                    <p className="text-xs text-slate-500">{w.condition}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Next Trip Countdown */}
        {nextTrip ? (
          <Card className="bg-gradient-to-br from-[#CC0000] to-red-800 border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Your Next Adventure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80 mb-2">{nextTrip.vehicle}</p>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{nextTrip.daysAway}</p>
                  <p className="text-xs text-white/60">days</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{nextTrip.hoursAway}</p>
                  <p className="text-xs text-white/60">hours</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{nextTrip.minutesAway}</p>
                  <p className="text-xs text-white/60">mins</p>
                </div>
              </div>
              <Button asChild className="mt-4 bg-white text-[#CC0000] hover:bg-white/90">
                <Link href="/renter/trips">View Trip Details</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-900 border-slate-800 flex items-center justify-center">
            <CardContent className="text-center py-8">
              <Car className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No upcoming trips</p>
              <Button asChild className="mt-4 bg-[#CC0000] hover:bg-[#AA0000]">
                <Link href="/renter/garage">Book Your Adventure</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AWD Alert */}
      {awdAvailable < 5 && (
        <Card className="bg-amber-900/20 border-amber-700">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-400">Weekend AWD Alert</p>
              <p className="text-sm text-amber-300/80">
                Only {awdAvailable} AWD vehicles available this weekend. Book now for Tahoe trips!
              </p>
            </div>
            <Button asChild className="ml-auto bg-amber-600 hover:bg-amber-700">
              <Link href="/renter/garage?awd=true">View AWD</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Featured Vehicles */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Top Rated Rides</h2>
          <Button variant="ghost" asChild className="text-[#CC0000] hover:text-[#AA0000]">
            <Link href="/renter/garage">
              See All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {featuredVehicles.map((vehicle) => (
            <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`}>
              <Card className="bg-slate-900 border-slate-800 hover:border-[#CC0000] transition-colors overflow-hidden">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={vehicle.images[0] || '/placeholder.svg'}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    fill
                    className="object-cover"
                  />
                  {vehicle.has_bouncie && (
                    <Badge className="absolute top-2 left-2 bg-[#CC0000]/90">
                      <Radar className="h-3 w-3 mr-1" />
                      Eagle
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="font-semibold text-white truncate">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      <span className="text-sm text-slate-400">{vehicle.rating}</span>
                    </div>
                    <p className="text-[#CC0000] font-bold">${vehicle.daily_rate}/day</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Tahoe Conditions */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Mountain className="h-5 w-5 text-[#CC0000]" />
            Tahoe Conditions Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">24&quot;</p>
              <p className="text-xs text-slate-400">Base Depth</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">6&quot;</p>
              <p className="text-xs text-slate-400">New Snow 24hr</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">R2</p>
              <p className="text-xs text-slate-400">Chain Control</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-400">Open</p>
              <p className="text-xs text-slate-400">I-80 Status</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Updated by Command&Control at {mounted ? format(new Date(), 'h:mm a') : '--:--'}
          </p>
        </CardContent>
      </Card>

      {/* Local Events */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Ticket className="h-5 w-5 text-[#CC0000]" />
            This Week in Reno-Tahoe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: 'Hot August Nights Preview', date: 'Fri-Sun', location: 'Downtown Reno' },
            { name: 'Tahoe Reggae Festival', date: 'Saturday', location: 'Squaw Valley' },
            { name: 'Reno Aces vs Las Vegas', date: 'Sunday', location: 'Greater Nevada Field' },
          ].map((event, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-800 rounded-lg p-3">
              <div>
                <p className="font-medium text-white">{event.name}</p>
                <p className="text-xs text-slate-400">{event.location}</p>
              </div>
              <Badge variant="outline" className="border-slate-600 text-slate-300">
                {event.date}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
