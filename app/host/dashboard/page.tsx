'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format, formatDistanceToNow, startOfMonth, addDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Car, DollarSign, MapPin, Calendar, Users, TrendingUp,
  Plus, Battery, Radio, Clock, Zap, Activity,
  Settings, ExternalLink, ChevronRight, 
  MessageSquare, Power, PowerOff, Navigation, 
  CreditCard, ArrowUpRight, ArrowDownRight, Shield,
  CheckCircle2, FolderOpen
} from 'lucide-react'
import { MFASecurityBadge } from '@/components/mfa-enrollment'
import { MFAHostPrompt } from '@/components/mfa-host-prompt'
import { UpcomingEvents } from '@/components/upcoming-events'

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
  const upcomingBookings = bookings.filter(b => 
    b.status === 'confirmed' && new Date(b.start_date) >= new Date()
  )
  const activeBookings = bookings.filter(b => 
    b.status === 'active' || (b.status === 'confirmed' && new Date(b.start_date) <= new Date() && new Date(b.end_date) >= new Date())
  )

  // Calculate dynamic earnings estimates based on actual fleet
  const getEarningsEstimate = () => {
    const fleetEarnings: { type: string; range: string; count: number }[] = []
    
    const economyCars = vehicles.filter(v => 
      ['Corolla', 'Civic', 'Sentra', 'Elantra', 'Mazda3'].some(m => v.model?.includes(m))
    ).length
    if (economyCars > 0) fleetEarnings.push({ type: 'Economy Car', range: '$400-600/mo', count: economyCars })
    
    const suvs = vehicles.filter(v => 
      v.drivetrain === 'AWD' || v.drivetrain === '4WD' || 
      ['4Runner', 'Highlander', 'Pathfinder', 'Pilot', 'RAV4', 'CR-V', 'Outback', 'Forester'].some(m => v.model?.includes(m))
    ).length
    if (suvs > 0) fleetEarnings.push({ type: 'SUV with AWD', range: '$800-1,200/mo', count: suvs })
    
    const trucks = vehicles.filter(v => 
      ['F-150', 'Silverado', 'Ram', 'Tacoma', 'Tundra', 'Frontier', 'Colorado', 'Ranger'].some(m => v.model?.includes(m)) ||
      v.category === 'truck'
    ).length
    if (trucks > 0) fleetEarnings.push({ type: 'Truck', range: '$600-900/mo', count: trucks })
    
    const luxury = vehicles.filter(v => 
      ['BMW', 'Mercedes', 'Audi', 'Lexus', 'Porsche', 'Tesla', 'Jaguar', 'Land Rover'].some(m => v.make?.includes(m))
    ).length
    if (luxury > 0) fleetEarnings.push({ type: 'Luxury Vehicle', range: '$1,500-2,500/mo', count: luxury })
    
    if (fleetEarnings.length === 0) {
      return [
        { type: 'Economy Car', range: '$400-600/mo', count: 0 },
        { type: 'SUV with AWD', range: '$800-1,200/mo', count: 0 },
        { type: 'Truck', range: '$600-900/mo', count: 0 },
        { type: 'Luxury Vehicle', range: '$1,500-2,500/mo', count: 0 },
      ]
    }
    
    return fleetEarnings
  }

  const earningsData = getEarningsEstimate()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      {/* MFA Prompt for Hosts */}
      <MFAHostPrompt />

      {/* Header */}
      <header className="border-b border-white/10 bg-[#0D0D0D]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Image 
                src="/images/logo.jpg" 
                alt="Rent and Drive" 
                width={160}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <span className="text-xs bg-[#D62828] px-2 py-0.5 rounded font-medium text-white">RAD HOSTS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/renter/suite">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 gap-2">
                <Car className="h-4 w-4" />
                RAD Renters
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Command Center Branding */}
      <section className="border-b border-white/10 bg-gradient-to-r from-[#0a0f1a] via-[#151c2c] to-[#0a0f1a]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-[#D62828] flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">RAD Command Center</h1>
                  <p className="text-gray-400">
                    Welcome back, {profile?.full_name?.split(' ')[0] || 'Host'}
                  </p>
                </div>
                <MFASecurityBadge />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/host/chat">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat with RAD
                </Button>
              </Link>
              <Link href="/host/vehicles/add/details">
                <Button className="bg-[#D62828] hover:bg-[#b82222] text-white gap-2">
                  <Plus className="h-4 w-4" />
                  Add Vehicle
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#151c2c] border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Vehicles</p>
                  <p className="text-2xl font-bold text-white">{activeVehicles.length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Car className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#151c2c] border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">This Month</p>
                  <p className="text-2xl font-bold text-white">${earnings.thisMonth.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#D62828]/20 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-[#D62828]" />
                </div>
              </div>
              {earnings.lastMonth > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs">
                  {earnings.thisMonth >= earnings.lastMonth ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">
                        {Math.round(((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth) * 100)}% vs last month
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-red-400" />
                      <span className="text-red-400">
                        {Math.round(((earnings.lastMonth - earnings.thisMonth) / earnings.lastMonth) * 100)}% vs last month
                      </span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#151c2c] border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Upcoming Bookings</p>
                  <p className="text-2xl font-bold text-white">{upcomingBookings.length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#151c2c] border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Devices Online</p>
                  <p className="text-2xl font-bold text-white">
                    {bouncieDevices.filter(d => d.is_active).length}/{bouncieDevices.length || 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Radio className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#151c2c] border border-white/10 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#D62828] data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="fleet" className="data-[state=active]:bg-[#D62828] data-[state=active]:text-white">
              Fleet
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-[#D62828] data-[state=active]:text-white">
              Bookings
            </TabsTrigger>
            <TabsTrigger value="earnings" className="data-[state=active]:bg-[#D62828] data-[state=active]:text-white">
              Earnings
            </TabsTrigger>
            <TabsTrigger value="devices" className="data-[state=active]:bg-[#D62828] data-[state=active]:text-white">
              Devices
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Active Trips */}
              <Card className="bg-[#151c2c] border-white/10 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[#D62828]" />
                    Active Trips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activeBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <Car className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No active trips right now</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeBookings.slice(0, 3).map(booking => (
                        <div key={booking.id} className="flex items-center gap-4 p-4 bg-[#1a2235] rounded-lg">
                          <div className="w-16 h-12 rounded-lg bg-[#252525] overflow-hidden">
                            {booking.vehicles?.images?.[0] && (
                              <img 
                                src={booking.vehicles.images[0]} 
                                alt="" 
                                className="w-full h-full object-cover" 
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">
                              {booking.vehicles?.year} {booking.vehicles?.make} {booking.vehicles?.model}
                            </p>
                            <p className="text-sm text-gray-400">
                              {booking.profiles?.full_name} - Ends {format(new Date(booking.end_date), 'MMM d')}
                            </p>
                          </div>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                            Active
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-[#151c2c] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/host/vehicles/add/details" className="block">
                    <Button variant="outline" className="w-full justify-start gap-3 border-white/10 text-white hover:bg-white/5">
                      <Plus className="h-4 w-4" />
                      Add New Vehicle
                    </Button>
                  </Link>
                  <Link href="/host/chat" className="block">
                    <Button variant="outline" className="w-full justify-start gap-3 border-white/10 text-white hover:bg-white/5">
                      <MessageSquare className="h-4 w-4" />
                      Chat with RAD AI
                    </Button>
                  </Link>
                  <Link href="/host/settings" className="block">
                    <Button variant="outline" className="w-full justify-start gap-3 border-white/10 text-white hover:bg-white/5">
                      <Settings className="h-4 w-4" />
                      Account Settings
                    </Button>
                  </Link>
                  <Link href="/host/filing-cabinet" className="block">
                    <Button variant="outline" className="w-full justify-start gap-3 border-white/10 text-white hover:bg-white/5">
                      <FolderOpen className="h-4 w-4" />
                      Filing Cabinet
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Bookings Preview */}
            {upcomingBookings.length > 0 && (
              <Card className="bg-[#151c2c] border-white/10">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-400" />
                    Upcoming Bookings
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-gray-400" onClick={() => setActiveTab('bookings')}>
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingBookings.slice(0, 3).map(booking => (
                      <div key={booking.id} className="p-4 bg-[#1a2235] rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={booking.profiles?.avatar_url} />
                            <AvatarFallback className="bg-[#D62828] text-white text-xs">
                              {booking.profiles?.full_name?.charAt(0) || 'G'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-white">{booking.profiles?.full_name}</p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d')}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300">
                          {booking.vehicles?.year} {booking.vehicles?.make} {booking.vehicles?.model}
                        </p>
                        <p className="text-lg font-bold text-[#D62828] mt-2">${booking.total_price}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* RAD AI Assistant Card */}
            <Card className="bg-gradient-to-br from-[#151c2c] to-[#1a2235] border-[#D62828]/30 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#D62828] to-[#b82222] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#D62828]/20">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-white">RAD AI Assistant</h2>
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">Active</span>
                    </div>
                    <p className="text-gray-400 mb-4">
                      Your AI-powered fleet management assistant. RAD handles pricing optimization, guest communications, fleet tracking, and market intelligence.
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-6">
                      <div className="flex items-center gap-2 text-gray-300">
                        <DollarSign className="h-4 w-4 text-[#D62828]" />
                        <span>Dynamic pricing</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="h-4 w-4 text-[#D62828]" />
                        <span>Fleet tracking</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <MessageSquare className="h-4 w-4 text-[#D62828]" />
                        <span>Auto messaging</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <TrendingUp className="h-4 w-4 text-[#D62828]" />
                        <span>Market intel</span>
                      </div>
                    </div>
                    <Link href="/host/chat">
                      <Button className="bg-[#D62828] hover:bg-[#b82222] text-white gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Chat with RAD
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <UpcomingEvents variant="full" maxEvents={6} showMarketOutlook={true} />
          </TabsContent>

          {/* Fleet Tab */}
          <TabsContent value="fleet" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Your Fleet</h2>
                <p className="text-gray-400">{vehicles.length} vehicles total</p>
              </div>
              <Link href="/host/vehicles/add/details">
                <Button className="bg-[#D62828] hover:bg-[#b82222] text-white gap-2">
                  <Plus className="h-4 w-4" />
                  Add Vehicle
                </Button>
              </Link>
            </div>

            {vehicles.length === 0 ? (
              <Card className="bg-[#151c2c] border-white/10">
                <CardContent className="py-16 text-center">
                  <Car className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Vehicles Yet</h3>
                  <p className="text-gray-400 mb-6">List your first vehicle and start earning</p>
                  <Link href="/host/vehicles/add/details">
                    <Button className="bg-[#D62828] hover:bg-[#b82222] text-white gap-2">
                      <Plus className="h-4 w-4" />
                      Add Your First Vehicle
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map(vehicle => {
                  const isActive = vehicle.status === 'active' || vehicle.listing_status === 'active'
                  const device = bouncieDevices.find(d => d.vehicle_id === vehicle.id)
                  
                  return (
                    <Card 
                      key={vehicle.id} 
                      className={`bg-[#151c2c] border-white/10 overflow-hidden transition-opacity ${!isActive ? 'opacity-60' : ''}`}
                    >
                      {/* Vehicle Image */}
                      <div className="aspect-video relative bg-[#1a2235]">
                        {vehicle.images?.[0] ? (
                          <img 
                            src={vehicle.images[0]} 
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="h-12 w-12 text-gray-600" />
                          </div>
                        )}
                        <Badge 
                          className={`absolute top-2 left-2 ${
                            isActive 
                              ? 'bg-emerald-500/90 text-white border-0' 
                              : 'bg-amber-500/90 text-black border-0'
                          }`}
                        >
                          {isActive ? 'Live' : 'Paused'}
                        </Badge>
                        {device && (
                          <Badge className={`absolute top-2 right-2 ${
                            device.is_active 
                              ? 'bg-purple-500/90 text-white border-0' 
                              : 'bg-gray-500/90 text-white border-0'
                          }`}>
                            <Radio className="h-3 w-3 mr-1" />
                            {device.is_active ? 'Online' : 'Offline'}
                          </Badge>
                        )}
                      </div>

                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-white">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </h3>
                            <div className="flex items-center gap-1 text-sm text-gray-400">
                              <MapPin className="h-3 w-3" />
                              {vehicle.location_city || 'Reno'}, {vehicle.location_state || 'NV'}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-[#D62828]">${vehicle.daily_rate}</p>
                            <p className="text-xs text-gray-400">/day</p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                          <span>{vehicle.trip_count || 0} trips</span>
                          {vehicle.rating && (
                            <span className="flex items-center gap-1">
                              {vehicle.rating.toFixed(1)} ★
                            </span>
                          )}
                        </div>

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
                            <Button variant="outline" size="sm" className="border-white/10">
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/host/vehicles/${vehicle.id}/settings`}>
                            <Button variant="outline" size="sm" className="border-white/10">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/vehicles/${vehicle.id}`}>
                            <Button variant="outline" size="sm" className="border-white/10">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">All Bookings</h2>
              <p className="text-gray-400">{bookings.length} total bookings</p>
            </div>

            {bookings.length === 0 ? (
              <Card className="bg-[#151c2c] border-white/10">
                <CardContent className="py-16 text-center">
                  <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Bookings Yet</h3>
                  <p className="text-gray-400">Your booking history will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <Card key={booking.id} className="bg-[#151c2c] border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-14 rounded-lg bg-[#1a2235] overflow-hidden flex-shrink-0">
                          {booking.vehicles?.images?.[0] ? (
                            <img 
                              src={booking.vehicles.images[0]} 
                              alt="" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="h-6 w-6 text-gray-600" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white truncate">
                              {booking.vehicles?.year} {booking.vehicles?.make} {booking.vehicles?.model}
                            </p>
                            <Badge className={`
                              ${booking.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                              ${booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' : ''}
                              ${booking.status === 'active' ? 'bg-purple-500/20 text-purple-400' : ''}
                              ${booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : ''}
                              border-0
                            `}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {booking.profiles?.full_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-bold text-white">${booking.total_price}</p>
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-[#151c2c] border-white/10">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-400 mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-white">${earnings.totalEarnings.toLocaleString()}</p>
                  <p className="text-sm text-gray-400 mt-2">{earnings.completedTrips} completed trips</p>
                </CardContent>
              </Card>

              <Card className="bg-[#151c2c] border-white/10">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-400 mb-1">This Month</p>
                  <p className="text-3xl font-bold text-[#D62828]">${earnings.thisMonth.toLocaleString()}</p>
                  {earnings.lastMonth > 0 && (
                    <p className={`text-sm mt-2 ${earnings.thisMonth >= earnings.lastMonth ? 'text-emerald-400' : 'text-red-400'}`}>
                      {earnings.thisMonth >= earnings.lastMonth ? '+' : '-'}
                      {Math.abs(Math.round(((earnings.thisMonth - earnings.lastMonth) / earnings.lastMonth) * 100))}% vs last month
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#151c2c] border-white/10">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-400 mb-1">Pending Payouts</p>
                  <p className="text-3xl font-bold text-amber-400">${earnings.pendingPayouts.toLocaleString()}</p>
                  <p className="text-sm text-gray-400 mt-2">From confirmed bookings</p>
                </CardContent>
              </Card>
            </div>

            {/* Earnings Estimate Card */}
            <Card className="bg-[#151c2c] border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Fleet Earnings Potential</CardTitle>
                <CardDescription className="text-gray-400">
                  Based on your {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} in the Reno market
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {earningsData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-[#1a2235] rounded-lg">
                      <div className="flex items-center gap-3">
                        <Car className="h-5 w-5 text-gray-400" />
                        <span className="text-white">{item.type}</span>
                        {item.count > 0 && (
                          <Badge variant="secondary" className="bg-[#D62828]/20 text-[#D62828]">
                            x{item.count}
                          </Badge>
                        )}
                      </div>
                      <span className="font-semibold text-white">{item.range}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#151c2c] border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Payout Settings</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your payout preferences and connected accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-[#1a2235] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#6772E5]/20 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-[#6772E5]" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Stripe Connect</p>
                      <p className="text-sm text-gray-400">
                        {profile?.stripe_connect_id ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <Link href="/host/payouts">
                    <Button variant="outline" className="border-white/10">
                      {profile?.stripe_connect_id ? 'Manage' : 'Connect'}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Connected Devices</h2>
                <p className="text-gray-400">{bouncieDevices.length} Bouncie devices</p>
              </div>
            </div>

            {bouncieDevices.length === 0 ? (
              <Card className="bg-[#151c2c] border-white/10">
                <CardContent className="py-16 text-center">
                  <Radio className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Devices Connected</h3>
                  <p className="text-gray-400 mb-6">
                    Connect Bouncie GPS trackers to monitor your vehicles in real-time
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bouncieDevices.map(device => {
                  const vehicle = vehicles.find(v => v.id === device.vehicle_id)
                  
                  return (
                    <Card key={device.id} className="bg-[#151c2c] border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              device.is_active ? 'bg-purple-500/20' : 'bg-gray-500/20'
                            }`}>
                              <Radio className={`h-5 w-5 ${device.is_active ? 'text-purple-400' : 'text-gray-400'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-white">{device.nickname || device.imei || device.bouncie_device_id}</p>
                              <Badge className={`${device.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'} border-0`}>
                                {device.is_active ? 'Online' : 'Offline'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {vehicle && (
                          <div className="p-3 bg-[#1a2235] rounded-lg mb-3">
                            <p className="text-sm text-gray-400">Linked to</p>
                            <p className="font-medium text-white">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {device.battery_voltage !== undefined && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Battery className="h-4 w-4" />
                              <span>{device.battery_voltage}V</span>
                            </div>
                          )}
                          {device.last_seen_at && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Clock className="h-4 w-4" />
                              <span>{formatDistanceToNow(new Date(device.last_seen_at), { addSuffix: true })}</span>
                            </div>
                          )}
                        </div>

                        {device.last_location_lat && device.last_location_lng && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-3 border-white/10"
                            onClick={() => window.open(`https://maps.google.com/?q=${device.last_location_lat},${device.last_location_lng}`, '_blank')}
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            View Location
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
