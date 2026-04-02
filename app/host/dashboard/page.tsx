'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format, startOfMonth, addDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Car, DollarSign, Calendar, 
  Plus, Battery, Radio, Clock, Activity,
  Settings, ExternalLink, ChevronRight, 
  MessageSquare, Power, PowerOff, Navigation, 
  ArrowRight, Star, Check, Sun, Moon, User,
  HelpCircle, MapPin
} from 'lucide-react'
import { MFAHostPrompt } from '@/components/mfa-host-prompt'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  status: string
  listing_status: string
  daily_rate: number
  location_city?: string
  location_state?: string
  trip_count?: number
  rating?: number
  images?: string[]
  bouncie_device_id?: string
  drivetrain?: string
  category?: string
}

interface Booking {
  id: string
  vehicle_id: string
  guest_id: string
  status: string
  start_date: string
  end_date: string
  total_price: number
  created_at: string
  vehicles?: { year: number; make: string; model: string; images?: string[] }
  profiles?: { full_name: string; avatar_url?: string }
}

interface BouncieDevice {
  id: string
  vehicle_id: string
  imei?: string
  bouncie_device_id?: string
  nickname?: string
  is_active: boolean
  battery_voltage?: number
  last_location_lat?: number
  last_location_lng?: number
  last_seen_at?: string
}

interface EarningsData {
  totalEarnings: number
  thisMonth: number
  lastMonth: number
  pendingPayouts: number
  completedTrips: number
}

export default function HostDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bouncieDevices, setBouncieDevices] = useState<BouncieDevice[]>([])
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingPayouts: 0,
    completedTrips: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isDarkMode, setIsDarkMode] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in?redirectTo=/host/dashboard')
        return
      }
      setUser(user)

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      // Fetch vehicles
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })
      setVehicles(vehiclesData || [])

      // Fetch bookings with vehicle and guest info
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicles:vehicle_id (year, make, model, images),
          profiles:guest_id (full_name, avatar_url)
        `)
        .eq('host_id', user.id)
        .order('start_date', { ascending: false })
        .limit(20)
      setBookings(bookingsData || [])

      // Fetch Bouncie devices
      const vehicleIds = (vehiclesData || []).map(v => v.id)
      if (vehicleIds.length > 0) {
        const { data: devicesData } = await supabase
          .from('bouncie_devices')
          .select('*')
          .in('vehicle_id', vehicleIds)
        setBouncieDevices(devicesData || [])
      }

      // Calculate earnings
      const completedBookings = (bookingsData || []).filter(b => b.status === 'completed')
      const thisMonthStart = startOfMonth(new Date())
      const thisMonthBookings = completedBookings.filter(b => 
        new Date(b.end_date) >= thisMonthStart
      )
      const lastMonthStart = startOfMonth(addDays(thisMonthStart, -1))
      const lastMonthEnd = addDays(thisMonthStart, -1)
      const lastMonthBookings = completedBookings.filter(b => 
        new Date(b.end_date) >= lastMonthStart && new Date(b.end_date) <= lastMonthEnd
      )

      setEarnings({
        totalEarnings: completedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
        thisMonth: thisMonthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
        lastMonth: lastMonthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
        pendingPayouts: (bookingsData || []).filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.total_price || 0), 0),
        completedTrips: completedBookings.length
      })

      setLoading(false)
    }

    fetchData()
  }, [supabase, router])

  const toggleVehicleStatus = async (vehicleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    await supabase
      .from('vehicles')
      .update({ listing_status: newStatus, status: newStatus })
      .eq('id', vehicleId)
    
    setVehicles(prev => prev.map(v => 
      v.id === vehicleId ? { ...v, status: newStatus, listing_status: newStatus } : v
    ))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  const activeVehicles = vehicles.filter(v => v.status === 'active' || v.listing_status === 'active')
  const pendingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed')

  // Calculate average rating
  const vehiclesWithRating = vehicles.filter(v => v.rating && v.rating > 0)
  const averageRating = vehiclesWithRating.length > 0 
    ? (vehiclesWithRating.reduce((sum, v) => sum + (v.rating || 0), 0) / vehiclesWithRating.length).toFixed(1)
    : '—'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8 bg-white/10" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 bg-white/10" />)}
          </div>
          <Skeleton className="h-96 bg-white/10" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* MFA Prompt for Hosts */}
      <MFAHostPrompt />

      {/* Top Navigation Bar */}
      <header className="border-b border-white/10 bg-[#0d1117]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image 
                src="/images/logo.jpg" 
                alt="RAD" 
                width={120}
                height={32}
                className="h-7 w-auto object-contain"
              />
              <span className="font-bold text-white">RAD</span>
              <span className="text-xs bg-[#e50914] px-2 py-0.5 rounded font-semibold text-white">HOSTS</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
              <Link href="/search" className="hover:text-white transition-colors">Browse Vehicles</Link>
              <Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
              <Link href="/list-vehicle" className="hover:text-white transition-colors">List Your Car</Link>
              <Link href="/help" className="hover:text-white transition-colors flex items-center gap-1">
                <HelpCircle className="h-4 w-4" />
                Help
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/host/chat">
              <Button className="bg-[#e50914] hover:bg-[#c00810] text-white text-sm px-4 py-2 h-9 rounded-lg font-medium">
                Ask RAD
              </Button>
            </Link>
            
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-white/70" /> : <Moon className="h-4 w-4 text-white/70" />}
            </button>
            
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <User className="h-4 w-4 text-white/70" />
            </button>
            
            <Link href="/renter/suite">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 text-sm">
                RAD Renters
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - RAD Command and Control */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            {/* Left Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
                  RAD Command and Control
                </h1>
                <p className="text-[#e50914] text-xl font-semibold">
                  Single Pane of Glass Host Management Portal
                </p>
              </div>

              {/* Welcome Text */}
              <div className="space-y-4">
                <h2 className="text-2xl text-white font-medium">Welcome to RAD Hosts</h2>
                <p className="text-white/70 text-lg leading-relaxed max-w-2xl">
                  Your AI-powered command center. RAD handles fleet tracking, dynamic pricing, 
                  automated communications, and real-time analytics.
                </p>
              </div>

              {/* Feature List */}
              <div className="space-y-4 py-4">
                {[
                  'AI-optimized dynamic pricing',
                  'Real-time GPS fleet tracking',
                  'Automated guest communications',
                  'Gamified hosting with XP and levels',
                  'Morning briefs and market intelligence'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#e50914]/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-[#e50914]" />
                    </div>
                    <span className="text-white/90 text-lg">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/list-vehicle">
                  <Button className="bg-[#e50914] hover:bg-[#c00810] text-white px-8 py-6 h-auto text-lg font-semibold rounded-lg gap-2">
                    List Your Vehicle — It&apos;s Free
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/host/chat">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 h-auto text-lg rounded-lg gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Chat with RAD
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Sidebar - Estimated Earnings Card */}
            <div className="lg:col-span-2">
              <Card className="bg-[#151820] border-white/10 overflow-hidden">
                <CardHeader className="border-b border-white/10 pb-4">
                  <CardTitle className="text-white text-xl font-semibold">Estimated Earnings</CardTitle>
                  <p className="text-white/50 text-sm">Based on Reno market</p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-white/10">
                    <div className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Car className="h-5 w-5 text-white/50" />
                        <span className="text-white">Economy Car</span>
                      </div>
                      <span className="text-[#e50914] font-semibold">$400–600/mo</span>
                    </div>
                    <div className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Car className="h-5 w-5 text-white/50" />
                        <span className="text-white">SUV with AWD</span>
                      </div>
                      <span className="text-[#e50914] font-semibold">$800–1,200/mo</span>
                    </div>
                    <div className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Car className="h-5 w-5 text-white/50" />
                        <span className="text-white">Truck</span>
                      </div>
                      <span className="text-[#e50914] font-semibold">$600–900/mo</span>
                    </div>
                    <div className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Car className="h-5 w-5 text-white/50" />
                        <span className="text-white">Luxury Vehicle</span>
                      </div>
                      <span className="text-[#e50914] font-semibold">$1,500–2,500/mo</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Metrics Bar */}
      <div className="border-t border-white/10 bg-[#0d1117] py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">${earnings.totalEarnings.toLocaleString()}</p>
              <p className="text-white/50 text-sm mt-1">Total Earnings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{activeVehicles.length}</p>
              <p className="text-white/50 text-sm mt-1">Active Listings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{pendingBookings.length}</p>
              <p className="text-white/50 text-sm mt-1">Pending Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{averageRating}</p>
              <p className="text-white/50 text-sm mt-1">Average Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Management Section */}
      {vehicles.length > 0 && (
        <section className="py-12 border-t border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Your Fleet</h2>
                <p className="text-white/50 mt-1">Manage your vehicles and track performance</p>
              </div>
              <Link href="/host/vehicles/add/details">
                <Button className="bg-[#e50914] hover:bg-[#c00810] text-white gap-2">
                  <Plus className="h-4 w-4" />
                  Add Vehicle
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map(vehicle => {
                const isActive = vehicle.status === 'active' || vehicle.listing_status === 'active'
                const thumbnail = vehicle.images?.[0] || '/images/vehicle-placeholder.jpg'
                const device = bouncieDevices.find(d => d.vehicle_id === vehicle.id)
                
                return (
                  <Card 
                    key={vehicle.id}
                    className={`bg-[#151820] border-white/10 overflow-hidden transition-all hover:border-white/20 ${!isActive ? 'opacity-70' : ''}`}
                  >
                    {/* Vehicle Image */}
                    <div className="aspect-[16/10] relative bg-[#1a1f2e]">
                      <img 
                        src={thumbnail} 
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                      <Badge 
                        className={`absolute top-3 left-3 ${
                          isActive 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-amber-500 text-black'
                        }`}
                      >
                        {isActive ? 'Live' : 'Paused'}
                      </Badge>
                      {vehicle.rating && vehicle.rating > 0 && (
                        <Badge className="absolute top-3 right-3 bg-black/70 text-white gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {vehicle.rating.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      {/* Vehicle Info */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-white">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-white/50">
                            <MapPin className="h-3 w-3" />
                            {vehicle.location_city || 'Reno'}, {vehicle.location_state || 'NV'}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#e50914]">${vehicle.daily_rate}</p>
                          <p className="text-xs text-white/50">/day</p>
                        </div>
                      </div>

                      {/* Bouncie Status */}
                      {device && (
                        <div className="flex items-center gap-2 text-sm text-white/60 mb-4 p-2 bg-white/5 rounded-lg">
                          <Radio className={`h-4 w-4 ${device.is_active ? 'text-emerald-400' : 'text-red-400'}`} />
                          <span>{device.is_active ? 'GPS Online' : 'GPS Offline'}</span>
                          {device.battery_voltage && (
                            <>
                              <span className="text-white/30">|</span>
                              <Battery className="h-4 w-4" />
                              <span>{Math.round(device.battery_voltage)}%</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`flex-1 ${
                            isActive 
                              ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' 
                              : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          onClick={() => toggleVehicleStatus(vehicle.id, vehicle.listing_status || vehicle.status)}
                        >
                          {isActive ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Link href={`/host/vehicles/${vehicle.id}/availability`}>
                          <Button variant="outline" size="sm" className="border-white/10 text-white/70 hover:bg-white/5">
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/host/vehicles/${vehicle.id}/settings`}>
                          <Button variant="outline" size="sm" className="border-white/10 text-white/70 hover:bg-white/5">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/vehicles/${vehicle.id}`}>
                          <Button variant="outline" size="sm" className="border-white/10 text-white/70 hover:bg-white/5">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Bookings Section */}
      {bookings.length > 0 && (
        <section className="py-12 border-t border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Recent Bookings</h2>
                <p className="text-white/50 mt-1">Track your rental activity</p>
              </div>
            </div>

            <div className="space-y-4">
              {bookings.slice(0, 5).map(booking => (
                <Card key={booking.id} className="bg-[#151820] border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-14 rounded-lg bg-[#1a1f2e] overflow-hidden flex-shrink-0">
                        {booking.vehicles?.images?.[0] && (
                          <img 
                            src={booking.vehicles.images[0]} 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">
                          {booking.vehicles?.year} {booking.vehicles?.make} {booking.vehicles?.model}
                        </p>
                        <p className="text-sm text-white/50">
                          {booking.profiles?.full_name || 'Guest'} - {format(new Date(booking.start_date), 'MMM d')} to {format(new Date(booking.end_date), 'MMM d')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">${booking.total_price}</p>
                        <Badge className={`
                          ${booking.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                          ${booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' : ''}
                          ${booking.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : ''}
                          ${booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : ''}
                          border-0 capitalize
                        `}>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Devices Section */}
      {bouncieDevices.length > 0 && (
        <section className="py-12 border-t border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Connected Devices</h2>
                <p className="text-white/50 mt-1">GPS trackers and fleet telemetry</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bouncieDevices.map(device => {
                const vehicle = vehicles.find(v => v.id === device.vehicle_id)
                return (
                  <Card key={device.id} className="bg-[#151820] border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-white">
                            {vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}
                          </p>
                          <p className="text-sm text-white/50">{device.bouncie_device_id || device.imei}</p>
                        </div>
                        <Badge className={device.is_active ? 'bg-emerald-500' : 'bg-red-500'}>
                          {device.is_active ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-4 text-sm text-white/60">
                        {device.battery_voltage && (
                          <div className="flex items-center gap-1">
                            <Battery className="h-4 w-4" />
                            {Math.round(device.battery_voltage)}%
                          </div>
                        )}
                        {device.last_seen_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(device.last_seen_at), 'MMM d, h:mm a')}
                          </div>
                        )}
                        {device.last_location_lat && device.last_location_lng && (
                          <a 
                            href={`https://www.google.com/maps?q=${device.last_location_lat},${device.last_location_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#e50914] hover:underline"
                          >
                            <Navigation className="h-4 w-4" />
                            View Location
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
