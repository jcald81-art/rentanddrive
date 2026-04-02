"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Car, CalendarCheck, DollarSign, TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalHosts: number
  totalRenters: number
  totalVehicles: number
  activeVehicles: number
  totalBookings: number
  pendingBookings: number
  totalRevenue: number
  monthlyRevenue: number
  connectedDevices: number
  openAlerts: number
}

export default function PlatformManagementDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [recentHosts, setRecentHosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()
      
      try {
        // Fetch hosts count
        const { count: hostsCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_host', true)

        // Fetch renters count
        const { count: rentersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        // Fetch vehicles
        const { data: vehicles, count: vehiclesCount } = await supabase
          .from('vehicles')
          .select('*', { count: 'exact' })

        const activeVehicles = vehicles?.filter(v => 
          v.listing_status === 'active' || v.status === 'active'
        ).length || 0

        // Fetch bookings
        const { data: bookings, count: bookingsCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact' })

        const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0
        
        // Calculate revenue
        const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0
        
        // Recent bookings (last 5)
        const { data: recent } = await supabase
          .from('bookings')
          .select(`
            *,
            profiles:renter_id(full_name, email),
            vehicles(make, model, year)
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentBookings(recent || [])

        // Recent hosts (last 5)
        const { data: hosts } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_host', true)
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentHosts(hosts || [])

        // Fetch device connections
        const { count: devicesCount } = await supabase
          .from('vehicle_integrations')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        setStats({
          totalHosts: hostsCount || 0,
          totalRenters: rentersCount || 0,
          totalVehicles: vehiclesCount || 0,
          activeVehicles,
          totalBookings: bookingsCount || 0,
          pendingBookings,
          totalRevenue,
          monthlyRevenue: totalRevenue * 0.3, // Estimate
          connectedDevices: devicesCount || 0,
          openAlerts: 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-white/10 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Hosts',
      value: stats?.totalHosts || 0,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      href: '/platform-management/hosts',
    },
    {
      title: 'Total Renters',
      value: stats?.totalRenters || 0,
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      href: '/platform-management/renters',
    },
    {
      title: 'Active Vehicles',
      value: `${stats?.activeVehicles || 0} / ${stats?.totalVehicles || 0}`,
      icon: Car,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      href: '/platform-management/vehicles',
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      icon: CalendarCheck,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      href: '/platform-management/bookings',
    },
    {
      title: 'Total Revenue',
      value: `$${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      href: '/platform-management/analytics',
    },
    {
      title: 'Pending Bookings',
      value: stats?.pendingBookings || 0,
      icon: Clock,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      href: '/platform-management/bookings?status=pending',
    },
    {
      title: 'Connected Devices',
      value: stats?.connectedDevices || 0,
      icon: TrendingUp,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      href: '/platform-management/radar',
    },
    {
      title: 'Open Alerts',
      value: stats?.openAlerts || 0,
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      href: '/platform-management/radar',
    },
  ]

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">RAD Command Center</h1>
        <p className="text-white/50 mt-1">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="bg-[#151515] border-white/10 hover:border-white/20 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/50">{stat.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card className="bg-[#151515] border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Recent Bookings</CardTitle>
            <CardDescription className="text-white/50">Latest booking activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBookings.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-4">No bookings yet</p>
              ) : (
                recentBookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        booking.status === 'confirmed' ? 'bg-green-500/10' :
                        booking.status === 'pending' ? 'bg-amber-500/10' :
                        'bg-white/5'
                      }`}>
                        {booking.status === 'confirmed' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                        ) : booking.status === 'pending' ? (
                          <Clock className="h-4 w-4 text-amber-400" />
                        ) : (
                          <CalendarCheck className="h-4 w-4 text-white/40" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">
                          {booking.vehicles?.year} {booking.vehicles?.make} {booking.vehicles?.model}
                        </p>
                        <p className="text-xs text-white/50">
                          {booking.profiles?.full_name || booking.profiles?.email || 'Unknown Renter'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white font-medium">
                        ${booking.total_amount?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-white/50 capitalize">{booking.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link 
              href="/platform-management/bookings"
              className="block mt-4 text-center text-sm text-[#FF4D4D] hover:text-[#FF4D4D]/80 transition-colors"
            >
              View All Bookings
            </Link>
          </CardContent>
        </Card>

        {/* Recent Hosts */}
        <Card className="bg-[#151515] border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Recent Hosts</CardTitle>
            <CardDescription className="text-white/50">Newest host signups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentHosts.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-4">No hosts yet</p>
              ) : (
                recentHosts.map((host) => (
                  <div 
                    key={host.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FF4D4D]/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-[#FF4D4D]" />
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">
                          {host.full_name || 'Unnamed Host'}
                        </p>
                        <p className="text-xs text-white/50">{host.email}</p>
                      </div>
                    </div>
                    <Link 
                      href={`/platform-management/hosts/${host.id}`}
                      className="text-xs text-[#FF4D4D] hover:underline"
                    >
                      View
                    </Link>
                  </div>
                ))
              )}
            </div>
            <Link 
              href="/platform-management/hosts"
              className="block mt-4 text-center text-sm text-[#FF4D4D] hover:text-[#FF4D4D]/80 transition-colors"
            >
              View All Hosts
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
