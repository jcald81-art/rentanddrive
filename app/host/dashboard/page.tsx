'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format, startOfMonth, addDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Car, DollarSign, Calendar, Plus, Battery, Radio, Clock, Activity,
  Settings, ExternalLink, ChevronRight, MessageSquare, Power, PowerOff, 
  Navigation, ArrowRight, Star, Check, Sun, Moon, User, HelpCircle, MapPin,
  LayoutDashboard, List, CreditCard, BarChart3, Mail, Cog, X,
  Edit, Trash2, Eye, CalendarDays, TrendingUp, TrendingDown,
  ChevronDown, Upload, Camera, Menu
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
  description?: string
  features?: string[]
  mileage?: number
  transmission?: string
  fuel_type?: string
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
  profiles?: { full_name: string; avatar_url?: string; email?: string }
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

type ActiveSection = 'overview' | 'fleet' | 'bookings' | 'pricing' | 'earnings' | 'messages' | 'analytics' | 'settings'

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
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview')
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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
          profiles:guest_id (full_name, avatar_url, email)
        `)
        .eq('host_id', user.id)
        .order('start_date', { ascending: false })
        .limit(50)
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

  const activeVehicles = vehicles.filter(v => v.status === 'active' || v.listing_status === 'active')
  const pendingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed')
  const activeTrips = bookings.filter(b => b.status === 'active')

  // Calculate average rating
  const vehiclesWithRating = vehicles.filter(v => v.rating && v.rating > 0)
  const averageRating = vehiclesWithRating.length > 0 
    ? (vehiclesWithRating.reduce((sum, v) => sum + (v.rating || 0), 0) / vehiclesWithRating.length).toFixed(1)
    : '—'

  const earningsChange = earnings.lastMonth > 0 
    ? ((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth * 100).toFixed(0)
    : 0

  // Navigation items for sidebar
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'fleet', label: 'My Fleet', icon: Car },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'pricing', label: 'Pricing & Calendar', icon: CalendarDays },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'messages', label: 'Messages', icon: Mail },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="flex">
          <div className="w-64 bg-[#0d1117] h-screen p-4">
            <Skeleton className="h-8 w-32 mb-8 bg-white/10" />
            {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-10 mb-2 bg-white/10" />)}
          </div>
          <div className="flex-1 p-8">
            <Skeleton className="h-12 w-64 mb-8 bg-white/10" />
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 bg-white/10" />)}
            </div>
            <Skeleton className="h-96 bg-white/10" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* MFA Prompt for Hosts */}
      <MFAHostPrompt />

      {/* Left Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-[#0d1117] border-r border-white/10 flex flex-col transition-all duration-300 fixed h-screen z-40`}>
        {/* Logo */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-white text-lg">RAD</span>
              <Badge className="bg-[#e50914] text-white text-xs">HOSTS</Badge>
            </Link>
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu className="h-4 w-4 text-white/70" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as ActiveSection)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-[#e50914] text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link href="/host/chat" className="block">
            <Button className={`${sidebarCollapsed ? 'w-10 p-0' : 'w-full'} bg-[#e50914] hover:bg-[#c00810] text-white`}>
              <MessageSquare className="h-4 w-4" />
              {!sidebarCollapsed && <span className="ml-2">Ask RAD</span>}
            </Button>
          </Link>
          {!sidebarCollapsed && (
            <Link href="/" className="block">
              <Button variant="ghost" className="w-full text-white/60 hover:text-white text-sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Public Site
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white capitalize">
                {activeSection === 'overview' ? 'RAD Command Center' : navItems.find(n => n.id === activeSection)?.label}
              </h1>
              <p className="text-white/50 text-sm mt-0.5">
                {activeSection === 'overview' && 'Single Pane of Glass Host Management'}
                {activeSection === 'fleet' && `${vehicles.length} vehicles in your fleet`}
                {activeSection === 'bookings' && `${bookings.length} total bookings`}
                {activeSection === 'earnings' && `$${earnings.totalEarnings.toLocaleString()} lifetime earnings`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/host/vehicles/add/details">
                <Button className="bg-[#e50914] hover:bg-[#c00810] text-white gap-2">
                  <Plus className="h-4 w-4" />
                  Add Vehicle
                </Button>
              </Link>
              <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-white/70" />
                </div>
                <span className="text-sm text-white/70">{profile?.full_name || user?.email?.split('@')[0]}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-[#151820] border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/50 text-sm">This Month</p>
                        <p className="text-2xl font-bold text-white mt-1">${earnings.thisMonth.toLocaleString()}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {Number(earningsChange) >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-400" />
                          )}
                          <span className={`text-xs ${Number(earningsChange) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {earningsChange}% vs last month
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-[#e50914]/20 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-[#e50914]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#151820] border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/50 text-sm">Active Listings</p>
                        <p className="text-2xl font-bold text-white mt-1">{activeVehicles.length}</p>
                        <p className="text-xs text-white/40 mt-1">{vehicles.length - activeVehicles.length} paused</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Car className="h-6 w-6 text-emerald-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#151820] border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/50 text-sm">Pending Bookings</p>
                        <p className="text-2xl font-bold text-white mt-1">{pendingBookings.length}</p>
                        <p className="text-xs text-white/40 mt-1">{activeTrips.length} active trips</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#151820] border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/50 text-sm">Average Rating</p>
                        <p className="text-2xl font-bold text-white mt-1">{averageRating}</p>
                        <p className="text-xs text-white/40 mt-1">{earnings.completedTrips} trips completed</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <Star className="h-6 w-6 text-yellow-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="bg-[#151820] border-white/10 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => setActiveSection('fleet')}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg bg-zinc-900 hover:bg-red-600 transition-colors"
                    >
                      <Car className="h-6 w-6 text-white" />
                      <span className="text-sm text-white font-medium">My Fleet</span>
                    </button>
                    <button
                      onClick={() => setActiveSection('bookings')}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg bg-zinc-900 hover:bg-red-600 transition-colors"
                    >
                      <Calendar className="h-6 w-6 text-white" />
                      <span className="text-sm text-white font-medium">Bookings</span>
                    </button>
                    <button
                      onClick={() => setActiveSection('pricing')}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg bg-zinc-900 hover:bg-red-600 transition-colors"
                    >
                      <CalendarDays className="h-6 w-6 text-white" />
                      <span className="text-sm text-white font-medium">Calendar</span>
                    </button>
                    <button
                      onClick={() => setActiveSection('earnings')}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg bg-zinc-900 hover:bg-red-600 transition-colors"
                    >
                      <DollarSign className="h-6 w-6 text-white" />
                      <span className="text-sm text-white font-medium">Earnings</span>
                    </button>
                  </CardContent>
                </Card>

                {/* Upcoming Bookings Preview */}
                <Card className="bg-[#151820] border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Upcoming</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pendingBookings.slice(0, 3).map(booking => (
                      <div key={booking.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                        <div className="w-10 h-10 rounded-lg bg-white/10 overflow-hidden">
                          <img 
                            src={booking.vehicles?.images?.[0] || '/images/vehicle-placeholder.jpg'} 
                            alt={`${booking.vehicles?.year || ''} ${booking.vehicles?.make || ''} ${booking.vehicles?.model || 'Vehicle'}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">
                            {booking.profiles?.full_name || 'Guest'}
                          </p>
                          <p className="text-xs text-white/50">
                            {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d')}
                          </p>
                        </div>
                        <Badge className={`${
                          booking.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                    {pendingBookings.length === 0 && (
                      <p className="text-white/40 text-sm text-center py-4">No upcoming bookings</p>
                    )}
                    {pendingBookings.length > 3 && (
                      <button 
                        onClick={() => setActiveSection('bookings')}
                        className="w-full text-center text-sm text-[#e50914] hover:underline py-2"
                      >
                        View all {pendingBookings.length} bookings
                      </button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Fleet Preview */}
              {vehicles.length > 0 && (
                <Card className="bg-[#151820] border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Your Fleet</CardTitle>
                      <CardDescription className="text-white/50">Quick overview of your vehicles</CardDescription>
                    </div>
                    <Button variant="ghost" onClick={() => setActiveSection('fleet')} className="text-[#e50914]">
                      View All <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {vehicles.slice(0, 3).map(vehicle => {
                        const isActive = vehicle.status === 'active' || vehicle.listing_status === 'active'
                        return (
                    <div key={vehicle.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                      <div className="w-16 h-12 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                        <img
                          src={vehicle.images?.[0] || '/images/vehicle-placeholder.jpg'}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                  {isActive ? 'Live' : 'Paused'}
                                </Badge>
                                <span className="text-sm text-[#e50914] font-semibold">${vehicle.daily_rate}/day</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Fleet Section */}
          {activeSection === 'fleet' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Input 
                    placeholder="Search vehicles..." 
                    className="w-64 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map(vehicle => {
                  const isActive = vehicle.status === 'active' || vehicle.listing_status === 'active'
                  const device = bouncieDevices.find(d => d.vehicle_id === vehicle.id)
                  
                  return (
              <Card key={vehicle.id} className="bg-[#151820] border-white/10 overflow-hidden">
                <div className="aspect-[16/10] relative bg-[#1a1f2e]">
                  <img
                    src={vehicle.images?.[0] || '/images/vehicle-placeholder.jpg'}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                        <Badge className={`absolute top-3 left-3 ${isActive ? 'bg-emerald-500' : 'bg-amber-500 text-black'}`}>
                          {isActive ? 'Live' : 'Paused'}
                        </Badge>
                        {vehicle.rating && vehicle.rating > 0 && (
                          <Badge className="absolute top-3 right-3 bg-black/70 gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {vehicle.rating.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-white">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </h3>
                            <p className="text-sm text-white/50 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {vehicle.location_city || 'Reno'}, {vehicle.location_state || 'NV'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-[#e50914]">${vehicle.daily_rate}</p>
                            <p className="text-xs text-white/50">/day</p>
                          </div>
                        </div>

                        {device && (
                          <div className="flex items-center gap-2 text-xs text-white/60 mb-3 p-2 bg-white/5 rounded">
                            <Radio className={`h-3 w-3 ${device.is_active ? 'text-emerald-400' : 'text-red-400'}`} />
                            <span>{device.is_active ? 'GPS Online' : 'GPS Offline'}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => toggleVehicleStatus(vehicle.id, vehicle.listing_status || vehicle.status)}
                            className={`flex-1 ${isActive 
                              ? 'bg-amber-600 hover:bg-amber-700 text-white border-0' 
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-0'
                            }`}
                          >
                            {isActive ? <PowerOff className="h-4 w-4 mr-1" /> : <Power className="h-4 w-4 mr-1" />}
                            {isActive ? 'Pause' : 'Activate'}
                          </Button>
                          <Link href={`/host/vehicles/${vehicle.id}/settings`}>
                            <Button size="sm" className="bg-zinc-800 hover:bg-[#e50914] text-white border border-zinc-700 hover:border-[#e50914]">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/host/vehicles/${vehicle.id}/availability`}>
                            <Button size="sm" className="bg-zinc-800 hover:bg-[#e50914] text-white border border-zinc-700 hover:border-[#e50914]">
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/vehicles/${vehicle.id}`}>
                            <Button size="sm" className="bg-zinc-800 hover:bg-[#e50914] text-white border border-zinc-700 hover:border-[#e50914]">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                {/* Add Vehicle Card */}
                <Link href="/host/vehicles/add/details">
                  <Card className="bg-[#151820] border-white/10 border-dashed h-full min-h-[300px] hover:border-[#e50914]/50 transition-colors cursor-pointer">
                    <CardContent className="h-full flex flex-col items-center justify-center gap-4 p-6">
                      <div className="w-16 h-16 rounded-full bg-[#e50914]/20 flex items-center justify-center">
                        <Plus className="h-8 w-8 text-[#e50914]" />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-semibold">Add New Vehicle</p>
                        <p className="text-sm text-white/50 mt-1">List your car and start earning</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          )}

          {/* Bookings Section */}
          {activeSection === 'bookings' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button className="bg-[#e50914] hover:bg-[#c00810] text-white font-medium">
                  Pending ({pendingBookings.length})
                </Button>
                <Button className="bg-zinc-800 hover:bg-[#e50914] text-white border border-zinc-700 hover:border-[#e50914] font-medium">
                  Confirmed ({bookings.filter(b => b.status === 'confirmed').length})
                </Button>
                <Button className="bg-zinc-800 hover:bg-[#e50914] text-white border border-zinc-700 hover:border-[#e50914] font-medium">
                  Completed ({bookings.filter(b => b.status === 'completed').length})
                </Button>
              </div>

              <Card className="bg-[#151820] border-white/10">
                <CardContent className="p-0">
                  <div className="divide-y divide-white/10">
                {bookings.map(booking => (
                  <div key={booking.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                    <div className="w-16 h-12 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                      <img
                        src={booking.vehicles?.images?.[0] || '/images/vehicle-placeholder.jpg'}
                        alt={`${booking.vehicles?.year || ''} ${booking.vehicles?.make || ''} ${booking.vehicles?.model || 'Vehicle'}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium">
                            {booking.vehicles?.year} {booking.vehicles?.make} {booking.vehicles?.model}
                          </p>
                          <p className="text-sm text-white/50">
                            {format(new Date(booking.start_date), 'MMM d, yyyy')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/70">{booking.profiles?.full_name || 'Guest'}</p>
                          <p className="text-sm text-white/40">{booking.profiles?.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#e50914] font-semibold">${booking.total_price}</p>
                        </div>
                        <Badge className={`${
                          booking.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                          booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                          booking.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                    {bookings.length === 0 && (
                      <div className="p-12 text-center">
                        <Calendar className="h-12 w-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/40">No bookings yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pricing & Calendar Section */}
          {activeSection === 'pricing' && (
            <div className="space-y-6">
              <Card className="bg-[#151820] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Pricing & Availability Calendar</CardTitle>
                  <CardDescription className="text-white/50">
                    Manage your vehicle availability and pricing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {vehicles.map(vehicle => (
                  <div key={vehicle.id} className="p-4 rounded-lg bg-white/5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-9 rounded bg-white/10 overflow-hidden">
                        <img
                          src={vehicle.images?.[0] || '/images/vehicle-placeholder.jpg'}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-white font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                            <p className="text-sm text-[#e50914]">${vehicle.daily_rate}/day</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/host/vehicles/${vehicle.id}/availability`} className="flex-1">
                            <Button className="w-full bg-zinc-800 hover:bg-[#e50914] text-white border border-zinc-700 hover:border-[#e50914] transition-colors">
                              <Calendar className="h-4 w-4 mr-2" />
                              Edit Calendar
                            </Button>
                          </Link>
                          <Link href={`/host/vehicles/${vehicle.id}/settings`} className="flex-1">
                            <Button className="w-full bg-zinc-800 hover:bg-[#e50914] text-white border border-zinc-700 hover:border-[#e50914] transition-colors">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Edit Pricing
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Earnings Section */}
          {activeSection === 'earnings' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="bg-[#151820] border-white/10">
                  <CardContent className="p-6">
                    <p className="text-white/50 text-sm">Total Earnings</p>
                    <p className="text-3xl font-bold text-white mt-2">${earnings.totalEarnings.toLocaleString()}</p>
                    <p className="text-sm text-white/40 mt-1">{earnings.completedTrips} trips completed</p>
                  </CardContent>
                </Card>
                <Card className="bg-[#151820] border-white/10">
                  <CardContent className="p-6">
                    <p className="text-white/50 text-sm">This Month</p>
                    <p className="text-3xl font-bold text-white mt-2">${earnings.thisMonth.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {Number(earningsChange) >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                      <span className={`text-sm ${Number(earningsChange) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {earningsChange}% vs last month
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#151820] border-white/10">
                  <CardContent className="p-6">
                    <p className="text-white/50 text-sm">Pending Payouts</p>
                    <p className="text-3xl font-bold text-[#e50914] mt-2">${earnings.pendingPayouts.toLocaleString()}</p>
                    <p className="text-sm text-white/40 mt-1">Next payout in 2-3 days</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-[#151820] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookings.filter(b => b.status === 'completed').slice(0, 5).map(booking => (
                      <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                          <p className="text-white">{booking.vehicles?.year} {booking.vehicles?.make} {booking.vehicles?.model}</p>
                          <p className="text-sm text-white/50">{format(new Date(booking.end_date), 'MMM d, yyyy')}</p>
                        </div>
                        <p className="text-emerald-400 font-semibold">+${booking.total_price}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Messages Section */}
          {activeSection === 'messages' && (
            <Card className="bg-[#151820] border-white/10">
              <CardContent className="p-12 text-center">
                <Mail className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold mb-2">Messages Coming Soon</h3>
                <p className="text-white/50">Guest messaging will be available in the next update</p>
              </CardContent>
            </Card>
          )}

          {/* Analytics Section */}
          {activeSection === 'analytics' && (
            <Card className="bg-[#151820] border-white/10">
              <CardContent className="p-12 text-center">
                <BarChart3 className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                <p className="text-white/50">Detailed performance analytics will be available soon</p>
              </CardContent>
            </Card>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div className="space-y-6">
              <Card className="bg-[#151820] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/70">Full Name</Label>
                      <Input 
                        value={profile?.full_name || ''} 
                        className="mt-1 bg-white/5 border-white/10 text-white"
                        readOnly
                      />
                    </div>
                    <div>
                      <Label className="text-white/70">Email</Label>
                      <Input 
                        value={user?.email || ''} 
                        className="mt-1 bg-white/5 border-white/10 text-white"
                        readOnly
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#151820] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Payout Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href="/host/payouts">
                    <Button className="bg-[#e50914] hover:bg-[#c00810]">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Manage Stripe Connect
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
