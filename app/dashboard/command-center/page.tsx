'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  Car,
  MapPin,
  AlertTriangle,
  Activity,
  Wifi,
  WifiOff,
  Gauge,
  RefreshCw,
  Bell,
  Calendar,
  Truck,
  Clock,
  ChevronRight,
  Zap,
  TrendingUp,
  Shield,
} from 'lucide-react'
import Link from 'next/link'

const FleetMap = dynamic(() => import('@/components/fleet/fleet-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] w-full animate-pulse rounded-lg bg-muted/30 flex items-center justify-center">
      <MapPin className="h-8 w-8 text-muted-foreground animate-bounce" />
    </div>
  ),
})

interface Telemetry {
  lat: number
  lng: number
  speed_mph: number
  battery_voltage: number
  odometer_miles: number
  fuel_level: number
  last_seen_at: string
  is_online: boolean
  is_moving: boolean
}

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  license_plate: string
  status: string
  thumbnail_url?: string
  telemetry: Telemetry | null
}

interface Alert {
  id: string
  alert_type: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  is_read: boolean
  vehicle_id?: string
  created_at: string
}

interface Booking {
  id: string
  booking_number: string
  status: string
  start_date: string
  end_date: string
  total_amount: number
  vehicles: { make: string; model: string; year: number; license_plate: string }
  profiles: { full_name: string; phone: string }
}

interface KPIs {
  total_vehicles: number
  online_vehicles: number
  moving_vehicles: number
  offline_vehicles: number
  active_bookings: number
  upcoming_bookings: number
  unread_alerts: number
  critical_alerts: number
  active_rides: number
}

const ALERT_COLORS: Record<Alert['severity'], string> = {
  critical: 'border-l-red-500 bg-red-500/5',
  warning: 'border-l-amber-500 bg-amber-500/5',
  info: 'border-l-blue-500 bg-blue-500/5',
}

const ALERT_BADGE: Record<Alert['severity'], string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

function KpiCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType
  label: string
  value: number | string
  sub?: string
  accent?: 'red' | 'green' | 'amber' | 'blue'
}) {
  const accentClass = {
    red: 'text-[#CC0000]',
    green: 'text-emerald-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
  }[accent ?? 'red']

  return (
    <Card className="bg-card/60 border-border/50 backdrop-blur-sm">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          <Icon className={cn('h-4 w-4', accentClass)} />
        </div>
        <div className={cn('text-3xl font-bold tracking-tight', accentClass)}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function CommandCenterPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [activeTab, setActiveTab] = useState('overview')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/host/command-center')
      if (res.ok) {
        const data = await res.json()
        setKpis(data.kpis)
        setVehicles(data.vehicles || [])
        setAlerts(data.alerts || [])
        setBookings(data.bookings || [])
        setLastRefresh(new Date())
      }
    } catch (e) {
      console.error('[CommandCenter] fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [fetchData])

  const markAlertRead = async (alertId: string) => {
    await fetch(`/api/host/command-center/alerts/${alertId}/read`, { method: 'PATCH' })
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a))
  }

  const mapVehicles = vehicles
    .filter(v => v.telemetry?.lat && v.telemetry?.lng)
    .map(v => ({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      license_plate: v.license_plate,
      status: v.status,
      thumbnail_url: v.thumbnail_url,
      device: v.telemetry ? {
        id: v.id,
        battery_voltage: v.telemetry.battery_voltage,
        last_lat: v.telemetry.lat,
        last_lng: v.telemetry.lng,
        last_speed_mph: v.telemetry.speed_mph,
        odometer_miles: v.telemetry.odometer_miles,
        last_seen_at: v.telemetry.last_seen_at,
        is_active: v.telemetry.is_online,
      } : null,
    }))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 rounded-full border-2 border-[#CC0000] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Command Center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#CC0000] flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Command Center</h1>
              <p className="text-xs text-muted-foreground">
                Live fleet &amp; booking intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(kpis?.critical_alerts ?? 0) > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 gap-1.5">
                <AlertTriangle className="h-3 w-3" />
                {kpis!.critical_alerts} Critical
              </Badge>
            )}
            <div className="text-xs text-muted-foreground hidden sm:block">
              Updated {lastRefresh.toLocaleTimeString()}
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard icon={Car} label="Total Fleet" value={kpis?.total_vehicles ?? 0} sub="registered vehicles" accent="red" />
          <KpiCard icon={Wifi} label="Online Now" value={kpis?.online_vehicles ?? 0} sub={`${kpis?.moving_vehicles ?? 0} moving`} accent="green" />
          <KpiCard icon={Calendar} label="Active Trips" value={kpis?.active_bookings ?? 0} sub={`${kpis?.upcoming_bookings ?? 0} upcoming`} accent="blue" />
          <KpiCard icon={Bell} label="Alerts" value={kpis?.unread_alerts ?? 0} sub={`${kpis?.critical_alerts ?? 0} critical`} accent={kpis?.critical_alerts ? 'red' : 'amber'} />
          <KpiCard icon={Truck} label="Active Rides" value={kpis?.active_rides ?? 0} sub="concierge in progress" accent="blue" />
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="fleet" className="gap-2">
              <Car className="h-4 w-4" />
              <span className="hidden sm:inline">Fleet</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2 relative">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
              {(kpis?.unread_alerts ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                  {kpis!.unread_alerts}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid lg:grid-cols-3 gap-4">
              {/* Map — 2/3 width */}
              <div className="lg:col-span-2">
                <Card className="bg-card/60 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#CC0000]" />
                      Live Fleet Map
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 overflow-hidden rounded-b-lg">
                    {mapVehicles.length > 0 ? (
                      <FleetMap vehicles={mapVehicles} />
                    ) : (
                      <div className="h-[420px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center space-y-2">
                          <WifiOff className="h-8 w-8 mx-auto opacity-50" />
                          <p className="text-sm">No vehicles with active telemetry</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right column: critical alerts + active rides */}
              <div className="space-y-4">
                <Card className="bg-card/60 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      Recent Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {alerts.slice(0, 6).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">All clear</p>
                    ) : alerts.slice(0, 6).map(alert => (
                      <div
                        key={alert.id}
                        className={cn(
                          'border-l-2 pl-3 py-2 rounded-r cursor-pointer transition-opacity',
                          ALERT_COLORS[alert.severity],
                          alert.is_read && 'opacity-50'
                        )}
                        onClick={() => !alert.is_read && markAlertRead(alert.id)}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge variant="outline" className={cn('text-[10px] px-1 py-0', ALERT_BADGE[alert.severity])}>
                            {alert.severity}
                          </Badge>
                          {!alert.is_read && <span className="h-1.5 w-1.5 rounded-full bg-[#CC0000]" />}
                        </div>
                        <p className="text-xs font-medium leading-tight">{alert.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{alert.message.slice(0, 60)}...</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Online / Offline breakdown */}
                <Card className="bg-card/60 border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4 text-[#C4813A]" />
                      Fleet Health
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: 'Online & Moving', value: kpis?.moving_vehicles ?? 0, color: 'bg-emerald-500' },
                      { label: 'Online & Parked', value: (kpis?.online_vehicles ?? 0) - (kpis?.moving_vehicles ?? 0), color: 'bg-blue-500' },
                      { label: 'Offline', value: kpis?.offline_vehicles ?? 0, color: 'bg-zinc-600' },
                    ].map(item => (
                      <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium">{item.value}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', item.color)}
                            style={{ width: kpis?.total_vehicles ? `${(item.value / kpis.total_vehicles) * 100}%` : '0%' }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* FLEET TAB */}
          <TabsContent value="fleet" className="mt-4">
            <div className="grid gap-3">
              {vehicles.length === 0 ? (
                <Card className="bg-card/60 border-border/50">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Car className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No vehicles in your fleet yet</p>
                  </CardContent>
                </Card>
              ) : vehicles.map(vehicle => (
                <Card key={vehicle.id} className="bg-card/60 border-border/50 hover:border-[#CC0000]/40 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      {/* Online indicator */}
                      <div className={cn(
                        'h-2.5 w-2.5 rounded-full flex-shrink-0',
                        vehicle.telemetry?.is_online ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-zinc-600'
                      )} />

                      {/* Vehicle info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                            {vehicle.license_plate}
                          </Badge>
                          {vehicle.telemetry?.is_moving && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                              Moving
                            </Badge>
                          )}
                        </div>

                        {vehicle.telemetry ? (
                          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Gauge className="h-3 w-3" />
                              {Math.round(vehicle.telemetry.speed_mph)} mph
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {vehicle.telemetry.odometer_miles.toLocaleString()} mi
                            </span>
                            {vehicle.telemetry.fuel_level != null && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                {vehicle.telemetry.fuel_level}% fuel
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(vehicle.telemetry.last_seen_at).toLocaleTimeString()}
                            </span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <WifiOff className="h-3 w-3" />
                            No telemetry device connected
                          </p>
                        )}
                      </div>

                      <Link href={`/dashboard/host/fleet?vehicle=${vehicle.id}`}>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ALERTS TAB */}
          <TabsContent value="alerts" className="mt-4">
            <div className="space-y-2">
              {alerts.length === 0 ? (
                <Card className="bg-card/60 border-border/50">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No active alerts</p>
                  </CardContent>
                </Card>
              ) : alerts.map(alert => (
                <Card
                  key={alert.id}
                  className={cn(
                    'bg-card/60 border-l-4 cursor-pointer transition-opacity hover:opacity-90',
                    alert.severity === 'critical' ? 'border-l-red-500' :
                    alert.severity === 'warning' ? 'border-l-amber-500' : 'border-l-blue-500',
                    alert.is_read && 'opacity-50'
                  )}
                  onClick={() => !alert.is_read && markAlertRead(alert.id)}
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={cn('text-xs capitalize', ALERT_BADGE[alert.severity])}>
                            {alert.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground capitalize">
                            {alert.alert_type.replace(/_/g, ' ')}
                          </span>
                          {!alert.is_read && (
                            <span className="h-2 w-2 rounded-full bg-[#CC0000] flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                      </div>
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* BOOKINGS TAB */}
          <TabsContent value="bookings" className="mt-4">
            <div className="space-y-2">
              {bookings.length === 0 ? (
                <Card className="bg-card/60 border-border/50">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No active or upcoming bookings</p>
                  </CardContent>
                </Card>
              ) : bookings.map((booking) => (
                <Card key={booking.id} className="bg-card/60 border-border/50 hover:border-[#CC0000]/40 transition-colors">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-medium">
                            {booking.vehicles?.year} {booking.vehicles?.make} {booking.vehicles?.model}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn('text-xs capitalize',
                              booking.status === 'active' ? 'border-emerald-500/50 text-emerald-400' :
                              booking.status === 'confirmed' ? 'border-blue-500/50 text-blue-400' :
                              'border-border text-muted-foreground'
                            )}
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {booking.profiles?.full_name} &bull; #{booking.booking_number}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(booking.start_date).toLocaleDateString()} &rarr; {new Date(booking.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-[#C4813A]">
                          ${booking.total_amount?.toFixed(2)}
                        </p>
                        <Link href={`/dashboard/bookings/${booking.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground mt-1 h-6 px-2">
                            Details <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer quick links */}
        <div className="flex items-center gap-3 pt-2 border-t border-border/30 flex-wrap">
          <span className="text-xs text-muted-foreground">Quick links:</span>
          {[
            { href: '/dashboard/host/fleet', label: 'Full Fleet Dashboard' },
            { href: '/dashboard/bookings', label: 'Bookings' },
            { href: '/dashboard/earnings', label: 'Earnings' },
            { href: '/dashboard/vehicles', label: 'Vehicles' },
          ].map(link => (
            <Link key={link.href} href={link.href}>
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground">
                <TrendingUp className="h-3 w-3" />
                {link.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
