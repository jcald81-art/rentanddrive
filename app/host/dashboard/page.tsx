import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UpcomingEvents } from '@/components/upcoming-events'
import { 
  Car as CarIcon, 
  DollarSign, 
  MapPin, 
  Shield, 
  MessageSquare, 
  CheckCircle2,
  Users,
  TrendingUp,
  Calendar,
  FolderOpen
} from 'lucide-react'
import { MFASecurityBadge } from '@/components/mfa-enrollment'
import { MFAHostPrompt } from '@/components/mfa-host-prompt'
import { AddVehicleButton, AddVehicleButtonSmall, FleetSection } from '@/components/host/host-dashboard-client'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  trim?: string
  status: string
  listing_status?: string
  daily_rate: number
  location_city?: string
  location_state?: string
  images?: string[]
  bouncie_device_id?: string
}

interface BouncieDevice {
  id: string
  vehicle_id: string
  bouncie_device_id: string
  nickname?: string
  is_active: boolean
  last_seen_at?: string
  battery_voltage?: number
}

interface Booking {
  id: string
  vehicle_id: string
  start_date: string
  end_date: string
  status: string
  total_price: number
}

interface BouncieLocation {
  latitude: number
  longitude: number
  recorded_at: string
}

export default async function HostDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?role=host')
  }

  // Fetch host's vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch Bouncie devices for host's vehicles
  const vehicleIds = vehicles?.map(v => v.id) || []
  const { data: bouncieDevices } = vehicleIds.length > 0 
    ? await supabase
        .from('bouncie_devices')
        .select('*')
        .in('vehicle_id', vehicleIds)
    : { data: [] }

  // Fetch latest locations for each device
  const deviceIds = bouncieDevices?.map(d => d.id) || []
  const { data: latestLocations } = deviceIds.length > 0
    ? await supabase
        .from('bouncie_locations')
        .select('*')
        .in('device_id', deviceIds)
        .order('recorded_at', { ascending: false })
        .limit(deviceIds.length)
    : { data: [] }

  // Fetch upcoming bookings
  const { data: bookings } = vehicleIds.length > 0
    ? await supabase
        .from('bookings')
        .select('*')
        .in('vehicle_id', vehicleIds)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(10)
    : { data: [] }

  // Calculate stats
  const totalVehicles = vehicles?.length || 0
  const activeVehicles = vehicles?.filter(v => v.status === 'active' || v.listing_status === 'active').length || 0
  const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0
  
  // Calculate total earnings (mock for now - would be from actual payment data)
  const totalEarnings = bookings?.filter(b => b.status === 'completed')
    .reduce((acc, b) => acc + (b.total_price || 0), 0) || 0

  // Map devices and locations to vehicles
  const vehiclesWithData = vehicles?.map(vehicle => {
    const device = bouncieDevices?.find(d => d.vehicle_id === vehicle.id)
    const location = device ? latestLocations?.find(l => l.device_id === device.id) : null
    const nextBooking = bookings?.find(b => b.vehicle_id === vehicle.id)
    
    return {
      ...vehicle,
      bouncieDevice: device,
      lastLocation: location,
      nextBooking
    }
  }) || []

  // Calculate dynamic earnings estimates based on actual fleet
  const getEarningsEstimate = () => {
    const fleetEarnings: { type: string; range: string; count: number }[] = []
    
    const economyCars = vehicles?.filter(v => 
      ['Corolla', 'Civic', 'Sentra', 'Elantra', 'Mazda3'].some(m => v.model?.includes(m))
    ).length || 0
    if (economyCars > 0) fleetEarnings.push({ type: 'Economy Car', range: '$400-600/mo', count: economyCars })
    
    const suvs = vehicles?.filter(v => 
      v.drivetrain === 'AWD' || v.drivetrain === '4WD' || 
      ['4Runner', 'Highlander', 'Pathfinder', 'Pilot', 'RAV4', 'CR-V', 'Outback', 'Forester'].some(m => v.model?.includes(m))
    ).length || 0
    if (suvs > 0) fleetEarnings.push({ type: 'SUV with AWD', range: '$800-1,200/mo', count: suvs })
    
    const trucks = vehicles?.filter(v => 
      ['F-150', 'Silverado', 'Ram', 'Tacoma', 'Tundra', 'Frontier', 'Colorado', 'Ranger'].some(m => v.model?.includes(m)) ||
      v.category === 'truck'
    ).length || 0
    if (trucks > 0) fleetEarnings.push({ type: 'Truck', range: '$600-900/mo', count: trucks })
    
    const luxury = vehicles?.filter(v => 
      ['BMW', 'Mercedes', 'Audi', 'Lexus', 'Porsche', 'Tesla', 'Jaguar', 'Land Rover'].some(m => v.make?.includes(m))
    ).length || 0
    if (luxury > 0) fleetEarnings.push({ type: 'Luxury Vehicle', range: '$1,500-2,500/mo', count: luxury })
    
    // If no matches, show defaults
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

  const features = [
    { text: 'AI-optimized dynamic pricing', icon: CheckCircle2 },
    { text: 'Real-time GPS fleet tracking', icon: CheckCircle2 },
    { text: 'Automated guest communications', icon: CheckCircle2 },
    { text: 'Gamified hosting with XP and levels', icon: CheckCircle2 },
    { text: 'Morning briefs and market intelligence', icon: CheckCircle2 },
  ]

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-svh bg-[#0a0f1a]">
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
                <CarIcon className="h-4 w-4" />
                RAD Renters
              </Button>
            </Link>
            <form action={handleSignOut}>
              <Button variant="outline" size="sm" type="submit" className="border-white/20 text-white hover:bg-white/10">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <span className="inline-block text-xs font-medium px-3 py-1 bg-[#D62828]/20 text-[#D62828] rounded border border-[#D62828]/30">
                For Vehicle Owners
              </span>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                RAD Command Center
              </h1>
              
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-[#D62828]">
                  Welcome to RAD Command Center
                </h2>
                <MFASecurityBadge />
              </div>
              
              <p className="text-gray-400 text-lg leading-relaxed">
                Your AI-powered fleet command hub. RAD handles fleet tracking, dynamic pricing, automated communications, and real-time analytics.
              </p>

              {/* Features List */}
              <div className="space-y-3 pt-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#D62828] flex-shrink-0" />
                    <span className="text-gray-300">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 pt-6">
                <AddVehicleButton />

                <Link href="/host/chat">
                  <Button variant="ghost" className="text-white/60 hover:text-white px-6 py-3 h-auto">
                    Chat with RAD
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Content - Dynamic Earnings Card */}
            <div className="flex justify-center lg:justify-end">
              <Card className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-[#D62828]/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-[#D62828]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {totalVehicles > 0 ? 'Your Fleet Earnings' : 'Estimated Earnings'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {totalVehicles > 0 ? `Based on ${totalVehicles} vehicle${totalVehicles > 1 ? 's' : ''}` : 'Based on Reno market'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {earningsData.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">{item.type}</span>
                          {item.count > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              x{item.count}
                            </Badge>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900">{item.range}</span>
                      </div>
                    ))}
                  </div>
                  {totalVehicles > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Est. Monthly Total</span>
                        <span className="font-bold text-xl text-[#D62828]">
                          ${Math.round(earningsData.reduce((acc, item) => {
                            const minEarnings = parseInt(item.range.replace(/[^0-9]/g, '').slice(0, 3)) || 0
                            return acc + (minEarnings * item.count)
                          }, 0))}-{Math.round(earningsData.reduce((acc, item) => {
                            const parts = item.range.replace(/[^0-9,]/g, '').split(',')
                            const maxEarnings = parseInt(parts[parts.length - 1]) || 0
                            return acc + (maxEarnings * item.count)
                          }, 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-white/10 bg-[#0d1220]">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">${totalEarnings.toLocaleString()}</p>
              <p className="text-gray-400 text-sm mt-1">Total Earnings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{activeVehicles}</p>
              <p className="text-gray-400 text-sm mt-1">Active Listings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{pendingBookings}</p>
              <p className="text-gray-400 text-sm mt-1">Pending Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{bouncieDevices?.filter(d => d.is_active).length || 0}</p>
              <p className="text-gray-400 text-sm mt-1">Bouncie Devices</p>
            </div>
          </div>
        </div>
      </section>

      {/* Fleet Inventory Section */}
      <FleetSection vehicles={vehiclesWithData} />

      {/* RAD AI Assistant Section */}
      <section className="border-t border-white/10">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gradient-to-br from-[#151c2c] to-[#1a2235] border-[#D62828]/30 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#D62828] to-[#b82222] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#D62828]/20">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-white">RAD</h2>
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">Active</span>
                    </div>
                    <p className="text-gray-400 mb-4">
                      Your AI-powered fleet management assistant. RAD handles pricing optimization, guest communications, fleet tracking, reputation management, and market intelligence — all in one place.
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
          </div>
        </div>
      </section>

      {/* Upcoming Events & Market Demand */}
      <section className="border-t border-white/10 bg-[#0d1220]">
        <div className="container mx-auto px-4 py-12">
          <UpcomingEvents variant="full" maxEvents={6} showMarketOutlook={true} />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="border-t border-white/10 bg-[#0d1220]">
        <div className="container mx-auto px-4 py-12">
          <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-[#151c2c] border-white/10">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-lg bg-[#D62828]/20 flex items-center justify-center">
                  <CarIcon className="h-5 w-5 text-[#D62828]" />
                </div>
                <h3 className="font-semibold text-white">List a Vehicle</h3>
                <p className="text-sm text-gray-400">Add a new car to your fleet and start earning</p>
                <Button asChild className="w-full bg-[#D62828] hover:bg-[#b82222]">
                  <Link href="/host/vehicles/add/details">Add Vehicle</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-[#151c2c] border-white/10">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white">Manage Bookings</h3>
                <p className="text-sm text-gray-400">View and respond to booking requests</p>
                <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  <Link href="/host/bookings">View Bookings</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-[#151c2c] border-white/10">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="font-semibold text-white">Earnings & Payouts</h3>
                <p className="text-sm text-gray-400">Track your income and manage payouts</p>
                <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  <Link href="/host/earnings">View Earnings</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#151c2c] border-white/10">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white">Filing Cabinet</h3>
                <p className="text-sm text-gray-400">Store service records, oil changes, inspections & documents</p>
                <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  <Link href="/host/documents">Open Cabinet</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gradient-to-r from-[#1a237e] to-[#0d47a1] py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to maximize your fleet&apos;s potential?</h2>
          <p className="text-blue-200 mb-6">Join RAD Hosts and let RAD handle the heavy lifting</p>
          <Link href="/host/vehicles/add/details">
            <Button className="bg-white text-[#1a237e] hover:bg-gray-100 px-8 py-3 h-auto font-semibold">
              List Your Vehicle
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
