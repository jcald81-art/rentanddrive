'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Car,
  MapPin,
  AlertTriangle,
  Battery,
  Gauge,
  Clock,
  User,
  CheckCircle,
  XCircle,
  RefreshCw,
  Bell,
  Route,
  Flag,
  Wifi,
  WifiOff,
  Activity,
  ChevronRight,
  Zap,
  Truck,
  Phone,
} from 'lucide-react'
import { DeliveryStatusTracker } from '@/modules/delivery/DeliveryStatusTracker'
import type { DeliveryRecord } from '@/modules/delivery/DeliveryStatusTracker'
import { cn } from '@/lib/utils'

const FleetMap = dynamic(() => import('@/components/fleet/fleet-map'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full animate-pulse rounded-lg bg-muted flex items-center justify-center">
      <MapPin className="h-8 w-8 text-muted-foreground animate-bounce" />
    </div>
  ),
})

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  license_plate: string
  thumbnail_url?: string
  device: {
    id: string
    battery_voltage: number
    last_lat: number
    last_lng: number
    last_speed_mph: number
    odometer_miles: number
    last_seen_at: string
    is_active: boolean
  } | null
  activeBooking: {
    id: string
    end_date: string
    renter?: { full_name: string }
  } | null
  alerts: Array<{ id: string; alert_type: string; severity: string; title: string }>
  status: 'available' | 'rented' | 'needs_attention' | 'no_tracker' | 'tracker_offline'
}

interface FleetAlert {
  id: string
  vehicle?: { make: string; model: string; year: number }
  alert_type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  is_acknowledged: boolean
  created_at: string
}

interface TripHistory {
  id: string
  vehicle: { make: string; model: string; year: number }
  renter_name?: string
  start_time: string
  end_time?: string
  distance_miles: number
  max_speed_mph: number
  hard_brakes: number
  driving_score: number
  incidents: number
}

interface RenterScore {
  user_id: string
  full_name: string
  avatar_url?: string
  trips_count: number
  total_miles: number
  avg_driving_score: number
  hard_brakes_per_100_miles: number
  speed_violations: number
  is_blocked: boolean
}

export default function HostFleetDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [alerts, setAlerts] = useState<FleetAlert[]>([])
  const [tripHistory, setTripHistory] = useState<TripHistory[]>([])
  const [renterScores, setRenterScores] = useState<RenterScore[]>([])
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([])
  const [summary, setSummary] = useState({ total: 0, available: 0, rented: 0, needsAttention: 0, utilizationPercent: 0 })
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('map')

  const fetchFleetData = useCallback(async () => {
    try {
      const [vehiclesRes, alertsRes, tripsRes, scoresRes, deliveriesRes] = await Promise.all([
        fetch('/api/host/fleet/vehicles'),
        fetch('/api/host/fleet/alerts'),
        fetch('/api/host/fleet/trips?limit=10'),
        fetch('/api/host/fleet/renter-scores'),
        fetch('/api/admin/concierge/rides?active=true'),
      ])
      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json()
        setVehicles(data.vehicles || [])
        setSummary(data.summary || { total: 0, available: 0, rented: 0, needsAttention: 0, utilizationPercent: 0 })
      }
      if (alertsRes.ok) setAlerts((await alertsRes.json()).alerts || [])
      if (tripsRes.ok) setTripHistory((await tripsRes.json()).trips || [])
      if (scoresRes.ok) setRenterScores((await scoresRes.json()).scores || [])
      if (deliveriesRes.ok) {
        const data = await deliveriesRes.json()
        setDeliveries((data.rides || data.deliveries || []).map((d: Record<string, unknown>) => ({
          id: d.id as string,
          bookingId: (d.booking_id ?? d.bookingId) as string,
          direction: ((d.ride_direction ?? d.direction) === 'pickup' ? 'to_renter' : 'from_renter') as 'to_renter' | 'from_renter',
          provider: ((d.ride_type ?? d.provider) as string)?.includes('lyft') ? 'lyft' : 'uber_direct',
          status: (d.ride_status ?? d.status ?? 'confirmed') as DeliveryRecord['status'],
          pickupAddress: (d.pickup_address ?? '') as string,
          dropoffAddress: (d.dropoff_address ?? '') as string,
          scheduledAt: (d.scheduled_time ?? d.scheduled_at) as string | undefined,
          driverName: (d.driver_name) as string | undefined,
          driverPhone: (d.driver_phone) as string | undefined,
          driverVehicle: (d.vehicle_description ?? d.driver_vehicle) as string | undefined,
          etaMinutes: (d.eta_minutes) as number | undefined,
          feeCents: ((d.cost_cents ?? d.fee_cents ?? 0) as number),
          trackingUrl: (d.tracking_url) as string | undefined,
        })))
      }
      setLastRefresh(new Date())
    } catch (e) {
      console.error('Fleet data error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFleetData()
    const interval = setInterval(fetchFleetData, 30000)
    return () => clearInterval(interval)
  }, [fetchFleetData])

  const acknowledgeAlert = async (alertId: string) => {
    const res = await fetch(`/api/host/fleet/alerts/${alertId}/acknowledge`, { method: 'POST' })
    if (res.ok) setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  const blockRenter = async (userId: string) => {
    const res = await fetch('/api/host/fleet/block-renter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    if (res.ok) setRenterScores(prev => prev.map(r => r.user_id === userId ? { ...r, is_blocked: true } : r))
  }

  const getStatusColor = (s: Vehicle['status']) => {
    const colors = { available: 'bg-green-500', rented: 'bg-blue-500', needs_attention: 'bg-red-500', tracker_offline: 'bg-yellow-500', no_tracker: 'bg-gray-400' }
    return colors[s] || 'bg-gray-400'
  }

  const getStatusLabel = (s: Vehicle['status']) => {
    const labels = { available: 'Available', rented: 'On Trip', needs_attention: 'Alert', tracker_offline: 'Offline', no_tracker: 'No Tracker' }
    return labels[s] || 'Unknown'
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.is_acknowledged)

  if (loading) return <div className="flex h-screen items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-[#CC0000]" /></div>

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Fleet Dashboard</h1>
            <p className="text-sm text-muted-foreground">Real-time vehicle tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">Updated: {lastRefresh.toLocaleTimeString()}</span>
            <Button variant="outline" size="sm" onClick={fetchFleetData}><RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />Refresh</Button>
          </div>
        </div>
      </header>

      <div className="border-b bg-[#0D0D0D] text-white">
        <div className="container mx-auto px-4 py-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="text-center"><div className="text-2xl font-bold">{summary.total}</div><div className="text-xs text-white/60">Total</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-blue-400">{summary.rented}</div><div className="text-xs text-white/60">On Trip</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-green-400">{summary.available}</div><div className="text-xs text-white/60">Available</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-red-400">{summary.needsAttention}</div><div className="text-xs text-white/60">Alerts</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-[#CC0000]">{summary.utilizationPercent}%</div><div className="text-xs text-white/60">Utilization</div></div>
        </div>
      </div>

      {criticalAlerts.length > 0 && (
        <div className="border-b bg-red-500/10">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-red-500"><AlertTriangle className="h-4 w-4 text-white" /></div>
            <span className="font-medium text-red-600">{criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}</span>
            <Button variant="destructive" size="sm" onClick={() => setActiveTab('alerts')}>View</Button>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid w-full grid-cols-6">
            <TabsTrigger value="map"><MapPin className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Map</span></TabsTrigger>
            <TabsTrigger value="vehicles"><Car className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Vehicles</span></TabsTrigger>
            <TabsTrigger value="alerts" className="relative"><Bell className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Alerts</span>{alerts.filter(a => !a.is_acknowledged).length > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">{alerts.filter(a => !a.is_acknowledged).length}</span>}</TabsTrigger>
            <TabsTrigger value="trips"><Route className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Trips</span></TabsTrigger>
            <TabsTrigger value="renters"><User className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Renters</span></TabsTrigger>
            <TabsTrigger value="delivery" className="relative">
              <Truck className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Delivery</span>
              {deliveries.filter(d => ['pending','confirmed','en_route'].includes(d.status)).length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
                  {deliveries.filter(d => ['pending','confirmed','en_route'].includes(d.status)).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-6">
            <Card><CardContent className="p-0"><FleetMap vehicles={vehicles} selectedVehicle={selectedVehicle} onVehicleSelect={setSelectedVehicle} /></CardContent></Card>
            {selectedVehicle && (() => {
              const v = vehicles.find(x => x.id === selectedVehicle)
              if (!v) return null
              return (
                <Card className="border-[#CC0000]">
                  <CardHeader className="pb-2"><CardTitle className="flex items-center justify-between"><span>Selected Vehicle</span><Button variant="ghost" size="sm" onClick={() => setSelectedVehicle(null)}><XCircle className="h-4 w-4" /></Button></CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div><div className="text-sm text-muted-foreground">Vehicle</div><div className="font-medium">{v.year} {v.make} {v.model}</div></div>
                      <div><div className="text-sm text-muted-foreground">Status</div><Badge className={cn(getStatusColor(v.status), 'text-white')}>{getStatusLabel(v.status)}</Badge></div>
                      <div><div className="text-sm text-muted-foreground">Speed</div><div className={cn('font-medium', (v.device?.last_speed_mph || 0) > 80 && 'text-red-500')}>{v.device?.last_speed_mph || 0} mph</div></div>
                      <div><div className="text-sm text-muted-foreground">Battery</div><div className={cn('font-medium', (v.device?.battery_voltage || 0) < 11.8 && 'text-yellow-500')}>{v.device?.battery_voltage?.toFixed(1) || '--'} V</div></div>
                      {v.activeBooking && <><div><div className="text-sm text-muted-foreground">Renter</div><div className="font-medium">{v.activeBooking.renter?.full_name || 'Unknown'}</div></div><div><div className="text-sm text-muted-foreground">Ends</div><div className="font-medium">{new Date(v.activeBooking.end_date).toLocaleDateString()}</div></div></>}
                      <div className="sm:col-span-2 lg:col-span-4"><Button asChild className="w-full bg-[#CC0000] hover:bg-[#AA0000]"><Link href={`/dashboard/host/vehicles/${v.id}`}>View Details<ChevronRight className="ml-2 h-4 w-4" /></Link></Button></div>
                    </div>
                  </CardContent>
                </Card>
              )
            })()}
          </TabsContent>

          <TabsContent value="vehicles" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map(v => (
              <Card key={v.id} className={cn('cursor-pointer hover:shadow-lg', selectedVehicle === v.id && 'ring-2 ring-[#CC0000]')} onClick={() => setSelectedVehicle(v.id)}>
                <CardContent className="p-4 flex gap-4">
                  <div className="relative h-20 w-28 flex-shrink-0 rounded-lg bg-muted overflow-hidden">
                    {v.thumbnail_url ? <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Car className="h-8 w-8 text-muted-foreground" /></div>}
                    <div className={cn('absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white', getStatusColor(v.status))} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between"><div><h3 className="font-medium truncate">{v.year} {v.make} {v.model}</h3><p className="text-sm text-muted-foreground">{v.license_plate}</p></div><Badge variant={v.status === 'needs_attention' ? 'destructive' : 'secondary'}>{getStatusLabel(v.status)}</Badge></div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1">{v.device?.is_active ? <Wifi className="h-3 w-3 text-green-500" /> : <WifiOff className="h-3 w-3 text-red-500" />}<span className="text-muted-foreground">{v.device?.is_active ? 'Online' : 'Offline'}</span></div>
                      <div className="flex items-center gap-1"><Battery className={cn('h-3 w-3', (v.device?.battery_voltage || 0) < 11.8 ? 'text-yellow-500' : 'text-green-500')} /><span className="text-muted-foreground">{v.device?.battery_voltage?.toFixed(1) || '--'}V</span></div>
                      <div className="flex items-center gap-1"><Gauge className={cn('h-3 w-3', (v.device?.last_speed_mph || 0) > 80 ? 'text-red-500' : 'text-muted-foreground')} /><span className={(v.device?.last_speed_mph || 0) > 80 ? 'text-red-500 font-medium' : ''}>{v.device?.last_speed_mph || 0} mph</span></div>
                    </div>
                    {v.activeBooking && <div className="mt-2 flex items-center gap-2 rounded bg-blue-500/10 px-2 py-1 text-xs text-blue-600"><User className="h-3 w-3" /><span className="truncate">{v.activeBooking.renter?.full_name || 'Renter'}</span></div>}
                    {v.alerts.length > 0 && <div className="mt-2 flex items-center gap-1 text-xs text-red-500"><AlertTriangle className="h-3 w-3" />{v.alerts.length} alert{v.alerts.length > 1 ? 's' : ''}</div>}
                    {v.device?.last_seen_at && <div className="mt-1 text-xs text-muted-foreground"><Clock className="mr-1 inline h-3 w-3" />Updated {new Date(v.device.last_seen_at).toLocaleTimeString()}</div>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            {alerts.filter(a => !a.is_acknowledged).length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-12"><CheckCircle className="h-12 w-12 text-green-500 mb-4" /><h3 className="text-lg font-medium">All Clear</h3><p className="text-sm text-muted-foreground">No active alerts</p></CardContent></Card>
            ) : (
              alerts.filter(a => !a.is_acknowledged).sort((a, b) => ({ critical: 0, warning: 1, info: 2 }[a.severity] || 2) - ({ critical: 0, warning: 1, info: 2 }[b.severity] || 2)).map(a => (
                <Card key={a.id} className={cn(a.severity === 'critical' && 'border-red-500 bg-red-500/5 animate-pulse')}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', a.severity === 'critical' && 'bg-red-500 text-white', a.severity === 'warning' && 'bg-yellow-500 text-white', a.severity === 'info' && 'bg-blue-500 text-white')}><Zap className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="font-medium">{a.title}</span><Badge variant={a.severity === 'critical' ? 'destructive' : 'secondary'}>{a.severity}</Badge></div><p className="text-sm text-muted-foreground">{a.vehicle?.year} {a.vehicle?.make} {a.vehicle?.model} - {new Date(a.created_at).toLocaleString()}</p></div>
                    <Button variant="outline" size="sm" onClick={() => acknowledgeAlert(a.id)}><CheckCircle className="h-4 w-4 mr-1" />Acknowledge</Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="trips">
            <Card>
              <CardHeader><CardTitle>Recent Trips</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {tripHistory.length === 0 ? <div className="text-center py-8 text-muted-foreground">No trip history</div> : tripHistory.map(t => (
                  <Link key={t.id} href={`/dashboard/host/trips/${t.id}`} className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted"><Car className="h-5 w-5 text-muted-foreground" /></div>
                    <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="font-medium">{t.vehicle.year} {t.vehicle.make} {t.vehicle.model}</span>{t.incidents > 0 && <Badge variant="destructive">{t.incidents} incidents</Badge>}</div><p className="text-sm text-muted-foreground">{t.renter_name || 'Unknown'} - {new Date(t.start_time).toLocaleDateString()}</p></div>
                    <div className="text-right"><div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">{t.distance_miles.toFixed(1)} mi</span><div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white', t.driving_score >= 80 && 'bg-green-500', t.driving_score >= 60 && t.driving_score < 80 && 'bg-yellow-500', t.driving_score < 60 && 'bg-red-500')}>{t.driving_score}</div></div><div className="text-xs text-muted-foreground mt-1">Max {t.max_speed_mph} mph</div></div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="renters">
            <Card>
              <CardHeader><CardTitle>Renter Behavior Scores</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {renterScores.length === 0 ? <div className="text-center py-8 text-muted-foreground">No renter data</div> : renterScores.map(r => (
                  <div key={r.user_id} className={cn('flex items-center gap-4 rounded-lg border p-4', r.is_blocked && 'opacity-50 bg-muted')}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">{r.avatar_url ? <img src={r.avatar_url} alt="" className="h-full w-full rounded-full object-cover" /> : <User className="h-6 w-6 text-muted-foreground" />}</div>
                    <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="font-medium">{r.full_name}</span>{r.is_blocked && <Badge variant="destructive">Blocked</Badge>}</div><p className="text-sm text-muted-foreground">{r.trips_count} trips - {r.total_miles.toLocaleString()} mi</p></div>
                    <div className="text-center"><div className={cn('flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white', r.avg_driving_score >= 80 && 'bg-green-500', r.avg_driving_score >= 60 && r.avg_driving_score < 80 && 'bg-yellow-500', r.avg_driving_score < 60 && 'bg-red-500')}>{Math.round(r.avg_driving_score)}</div><div className="text-xs text-muted-foreground mt-1">Score</div></div>
                    <div className="text-right text-sm"><div className="flex items-center gap-1 text-muted-foreground"><Activity className="h-3 w-3" />{r.hard_brakes_per_100_miles.toFixed(1)}/100mi</div>{r.speed_violations > 0 && <div className="flex items-center gap-1 text-red-500"><Gauge className="h-3 w-3" />{r.speed_violations} violations</div>}</div>
                    {!r.is_blocked && <Button variant="outline" size="sm" className="text-red-500" onClick={() => blockRenter(r.user_id)}><Flag className="h-4 w-4 mr-1" />Block</Button>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="delivery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-[#CC0000]" />
                  Active Deliveries
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deliveries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Active Deliveries</h3>
                    <p className="text-sm text-muted-foreground mt-1">Concierge delivery rides will appear here in real-time.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Summary row */}
                    <div className="flex gap-4 flex-wrap">
                      {(['pending','confirmed','en_route','arrived','completed','cancelled'] as const).map(s => {
                        const count = deliveries.filter(d => d.status === s).length
                        if (!count) return null
                        const colors: Record<string, string> = {
                          pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                          confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
                          en_route: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                          arrived: 'bg-purple-100 text-purple-800 border-purple-200',
                          completed: 'bg-green-100 text-green-800 border-green-200',
                          cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
                        }
                        return (
                          <div key={s} className={cn('rounded-lg border px-3 py-2 text-sm font-medium capitalize', colors[s])}>
                            {count} {s.replace('_', ' ')}
                          </div>
                        )
                      })}
                    </div>

                    {/* Delivery cards */}
                    {deliveries.map(d => (
                      <DeliveryStatusTracker key={d.id} delivery={d} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
