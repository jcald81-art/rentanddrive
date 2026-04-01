'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  ShieldAlert,
  Car,
  Users,
  DollarSign,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Search,
  Activity,
  Truck,
  TrendingUp,
  WifiOff,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

const FleetMap = dynamic(() => import('@/components/fleet/fleet-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[450px] w-full animate-pulse rounded-lg bg-muted/30 flex items-center justify-center">
      <MapPin className="h-8 w-8 text-muted-foreground animate-bounce" />
    </div>
  ),
})

interface KPIs {
  total_vehicles: number
  online_vehicles: number
  total_revenue_30d: number
  total_bookings_30d: number
  critical_alerts: number
  total_hosts: number
  active_rides: number
}

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  license_plate: string
  status: string
  host_id: string
  profiles: { full_name: string } | null
  bouncie_devices: Array<{
    last_lat: number
    last_lng: number
    last_speed_mph: number
    last_seen_at: string
    battery_voltage: number
  }> | null
}

interface Alert {
  id: string
  alert_type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  is_read: boolean
  is_resolved: boolean
  created_at: string
  vehicles: { make: string; model: string; license_plate: string } | null
  profiles: { full_name: string } | null
}

interface Host {
  id: string
  full_name: string
  phone: string
  role: string
  created_at: string
  vehicles: Array<{ count: number }>
}

interface Booking {
  id: string
  booking_number: string
  status: string
  total_amount: number
  created_at: string
  vehicles: { make: string; model: string } | null
  profiles: { full_name: string } | null
}

interface RevenuePoint {
  date: string
  amount: number
}

function KpiCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType
  label: string
  value: number | string
  sub?: string
  accent?: 'red' | 'green' | 'amber' | 'blue' | 'gold'
}) {
  const accentClass = {
    red: 'text-[#CC0000]',
    green: 'text-emerald-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    gold: 'text-[#C4813A]',
  }[accent ?? 'red']

  return (
    <Card className="bg-card/60 border-border/50">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          <Icon className={cn('h-4 w-4', accentClass)} />
        </div>
        <div className={cn('text-3xl font-bold tracking-tight', accentClass)}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function ManagementPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [hosts, setHosts] = useState<Host[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [revenueChart, setRevenueChart] = useState<RevenuePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [activeTab, setActiveTab] = useState('overview')
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [hostSearch, setHostSearch] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/management/overview')
      if (res.ok) {
        const data = await res.json()
        setKpis(data.kpis)
        setVehicles(data.vehicles || [])
        setAlerts(data.alerts || [])
        setHosts(data.hosts || [])
        setBookings(data.bookings || [])
        setRevenueChart(data.revenue_chart || [])
        setLastRefresh(new Date())
      }
    } catch (e) {
      console.error('[Management] fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 90_000)
    return () => clearInterval(interval)
  }, [fetchData])

  const mapVehicles = vehicles
    .filter(v => {
      const devices = v.bouncie_devices
      const d = Array.isArray(devices) ? devices[0] : null
      return d?.last_lat && d?.last_lng
    })
    .map(v => {
      const d = Array.isArray(v.bouncie_devices) ? v.bouncie_devices[0] : null
      return {
        id: v.id,
        make: v.make,
        model: v.model,
        year: v.year,
        license_plate: v.license_plate,
        status: v.status,
        device: d ? {
          id: v.id,
          battery_voltage: d.battery_voltage,
          last_lat: d.last_lat,
          last_lng: d.last_lng,
          last_speed_mph: d.last_speed_mph,
          odometer_miles: 0,
          last_seen_at: d.last_seen_at,
          is_active: Date.now() - new Date(d.last_seen_at).getTime() < 15 * 60 * 1000,
        } : null,
      }
    })

  const filteredVehicles = vehicles.filter(v =>
    vehicleSearch === '' ||
    `${v.year} ${v.make} ${v.model} ${v.license_plate}`.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.profiles?.full_name?.toLowerCase().includes(vehicleSearch.toLowerCase())
  )

  const filteredHosts = hosts.filter(h =>
    hostSearch === '' ||
    h.full_name?.toLowerCase().includes(hostSearch.toLowerCase())
  )

  const maxRevenue = Math.max(...revenueChart.map(d => d.amount), 1)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 rounded-full border-2 border-[#CC0000] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Management Platform...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#CC0000] flex items-center justify-center shadow-lg">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">RAD Management Platform</h1>
              <p className="text-xs text-muted-foreground">Full platform visibility &mdash; admin only</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(kpis?.critical_alerts ?? 0) > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 gap-1.5">
                <AlertTriangle className="h-3 w-3" />
                {kpis!.critical_alerts} critical
              </Badge>
            )}
            <span className="text-xs text-muted-foreground hidden sm:block">
              {lastRefresh.toLocaleTimeString()}
            </span>
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Link href="/dashboard/admin">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                Admin Dashboard
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <KpiCard icon={Car} label="Total Vehicles" value={kpis?.total_vehicles ?? 0} sub="across all hosts" accent="red" />
          <KpiCard icon={Activity} label="Online" value={kpis?.online_vehicles ?? 0} sub="w/ active telemetry" accent="green" />
          <KpiCard icon={DollarSign} label="Revenue 30d" value={`$${((kpis?.total_revenue_30d ?? 0) / 100).toFixed(0)}`} sub="platform total" accent="gold" />
          <KpiCard icon={Calendar} label="Bookings 30d" value={kpis?.total_bookings_30d ?? 0} sub="confirmed + active" accent="blue" />
          <KpiCard icon={AlertTriangle} label="Critical Alerts" value={kpis?.critical_alerts ?? 0} sub="unresolved" accent={kpis?.critical_alerts ? 'red' : 'amber'} />
          <KpiCard icon={Users} label="Hosts" value={kpis?.total_hosts ?? 0} sub="registered hosts" accent="blue" />
          <KpiCard icon={Truck} label="Active Rides" value={kpis?.active_rides ?? 0} sub="concierge live" accent="amber" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview"><Activity className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Overview</span></TabsTrigger>
            <TabsTrigger value="vehicles"><Car className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">All Vehicles</span></TabsTrigger>
            <TabsTrigger value="alerts" className="relative">
              <AlertTriangle className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Alerts</span>
              {(kpis?.critical_alerts ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                  {kpis!.critical_alerts}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="hosts"><Users className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Hosts</span></TabsTrigger>
            <TabsTrigger value="bookings"><Calendar className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Bookings</span></TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Card className="bg-card/60 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#CC0000]" />
                      All Vehicles — Platform Map
                      <Badge variant="outline" className="ml-auto text-xs">{mapVehicles.length} with telemetry</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 overflow-hidden rounded-b-lg">
                    {mapVehicles.length > 0 ? (
                      <FleetMap vehicles={mapVehicles} />
                    ) : (
                      <div className="h-[450px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center space-y-2">
                          <WifiOff className="h-8 w-8 mx-auto opacity-40" />
                          <p className="text-sm">No telemetry data available</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Revenue chart */}
              <Card className="bg-card/60 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#C4813A]" />
                    Revenue — Last 30 Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueChart.length > 0 ? (
                    <div className="h-[380px] flex items-end gap-0.5">
                      {revenueChart.map((point, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-[#CC0000]/30 hover:bg-[#CC0000]/60 rounded-t transition-colors relative group"
                          style={{ height: `${Math.max((point.amount / maxRevenue) * 100, 2)}%` }}
                          title={`${point.date}: $${point.amount.toFixed(2)}`}
                        >
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            ${point.amount.toFixed(0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[380px] flex items-center justify-center text-muted-foreground text-sm">
                      No revenue data for the last 30 days
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent critical alerts */}
            {alerts.length > 0 && (
              <Card className="bg-card/60 border-border/50 border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-400">
                    <AlertTriangle className="h-4 w-4" />
                    Critical Alerts Requiring Attention
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {alerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                      <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                        {alert.vehicles && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Vehicle: {alert.vehicles.make} {alert.vehicles.model} &bull; {alert.vehicles.license_plate}
                          </p>
                        )}
                        {alert.profiles && (
                          <p className="text-xs text-muted-foreground">Host: {alert.profiles.full_name}</p>
                        )}
                      </div>
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </time>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ALL VEHICLES */}
          <TabsContent value="vehicles" className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by make, model, plate, or host name..."
                className="pl-9 bg-card/60"
                value={vehicleSearch}
                onChange={e => setVehicleSearch(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              {filteredVehicles.map(v => {
                const d = Array.isArray(v.bouncie_devices) ? v.bouncie_devices[0] : null
                const isOnline = d?.last_seen_at
                  ? Date.now() - new Date(d.last_seen_at).getTime() < 15 * 60 * 1000
                  : false
                return (
                  <Card key={v.id} className="bg-card/60 border-border/50 hover:border-[#CC0000]/40 transition-colors">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-2.5 w-2.5 rounded-full flex-shrink-0',
                          isOnline ? 'bg-emerald-400' : 'bg-zinc-600'
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{v.year} {v.make} {v.model}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">{v.license_plate}</Badge>
                            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 capitalize',
                              v.status === 'available' ? 'border-emerald-500/40 text-emerald-400' :
                              v.status === 'rented' ? 'border-blue-500/40 text-blue-400' : ''
                            )}>{v.status}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Host: {v.profiles?.full_name ?? 'Unknown'}
                            {d && ` \u2022 ${Math.round(d.last_speed_mph)} mph \u2022 last seen ${new Date(d.last_seen_at).toLocaleTimeString()}`}
                          </p>
                        </div>
                        <Link href={`/dashboard/admin/vehicles/${v.id}`}>
                          <Button variant="ghost" size="sm" className="text-muted-foreground">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {filteredVehicles.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  No vehicles match your search
                </div>
              )}
            </div>
          </TabsContent>

          {/* ALERTS */}
          <TabsContent value="alerts" className="mt-4 space-y-2">
            {alerts.length === 0 ? (
              <Card className="bg-card/60 border-border/50">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No critical alerts</p>
                </CardContent>
              </Card>
            ) : alerts.map(alert => (
              <Card key={alert.id} className="bg-card/60 border-l-4 border-l-red-500">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Critical</Badge>
                        <span className="text-xs text-muted-foreground capitalize">{alert.alert_type.replace(/_/g, ' ')}</span>
                        {alert.profiles && (
                          <span className="text-xs text-muted-foreground">Host: {alert.profiles.full_name}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                      {alert.vehicles && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {alert.vehicles.make} {alert.vehicles.model} &bull; {alert.vehicles.license_plate}
                        </p>
                      )}
                    </div>
                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(alert.created_at).toLocaleString()}
                    </time>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* HOSTS */}
          <TabsContent value="hosts" className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hosts..."
                className="pl-9 bg-card/60"
                value={hostSearch}
                onChange={e => setHostSearch(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              {filteredHosts.map(host => {
                const vehicleCount = Array.isArray(host.vehicles) && host.vehicles[0]
                  ? (host.vehicles[0] as Record<string, unknown>).count as number
                  : 0
                return (
                  <Card key={host.id} className="bg-card/60 border-border/50 hover:border-[#CC0000]/40 transition-colors">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-[#CC0000]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-[#CC0000]">
                            {host.full_name?.charAt(0) ?? 'H'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{host.full_name || 'Unnamed'}</span>
                            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 capitalize',
                              host.role === 'admin' ? 'border-[#CC0000]/50 text-[#CC0000]' : ''
                            )}>{host.role}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {vehicleCount} vehicle{vehicleCount !== 1 ? 's' : ''} &bull; Joined {new Date(host.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Link href={`/dashboard/admin/users/${host.id}`}>
                          <Button variant="ghost" size="sm" className="text-muted-foreground">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* BOOKINGS */}
          <TabsContent value="bookings" className="mt-4 space-y-2">
            {bookings.map(booking => (
              <Card key={booking.id} className="bg-card/60 border-border/50 hover:border-[#CC0000]/40 transition-colors">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-medium">
                          {booking.vehicles?.make} {booking.vehicles?.model}
                        </span>
                        <Badge variant="outline" className={cn('text-xs capitalize',
                          booking.status === 'active' ? 'border-emerald-500/50 text-emerald-400' :
                          booking.status === 'confirmed' ? 'border-blue-500/50 text-blue-400' :
                          booking.status === 'completed' ? 'border-zinc-500/50 text-zinc-400' : ''
                        )}>
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {booking.profiles?.full_name} &bull; #{booking.booking_number}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-[#C4813A]">
                        ${booking.total_amount?.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {bookings.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">No recent bookings</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
