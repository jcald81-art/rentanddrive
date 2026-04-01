'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Radar,
  Car,
  MapPin,
  Activity,
  AlertTriangle,
  Wifi,
  WifiOff,
  Battery,
  Navigation,
  Clock,
  Zap,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'
import FleetMap from '@/components/fleet/fleet-map'

interface EagleStats {
  total_devices: number
  online_devices: number
  offline_devices: number
  low_battery_devices: number
  total_trips_today: number
  total_miles_today: number
  active_alerts: number
  geofences_active: number
}

interface Device {
  id: string
  imei: string
  vehicle_id: string
  vehicle: {
    id: string
    year: number
    make: string
    model: string
    license_plate: string
    status: string
    host: { full_name: string }
  }
  last_lat: number | null
  last_lng: number | null
  last_speed_mph: number
  last_seen_at: string
  battery_level: number
  is_online: boolean
  firmware_version: string
}

interface Alert {
  id: string
  vehicle: { year: number; make: string; model: string; license_plate: string }
  alert_type: string
  severity: string
  title: string
  description: string
  is_resolved: boolean
  created_at: string
}

export default function EagleNetworkPage() {
  const [stats, setStats] = useState<EagleStats | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    try {
      const [statsRes, devicesRes, alertsRes] = await Promise.all([
        fetch('/api/admin/eagle/stats'),
        fetch('/api/admin/eagle/devices'),
        fetch('/api/admin/eagle/alerts?limit=20'),
      ])
      
      if (statsRes.ok) setStats(await statsRes.json())
      if (devicesRes.ok) setDevices((await devicesRes.json()).devices || [])
      if (alertsRes.ok) setAlerts((await alertsRes.json()).alerts || [])
    } catch (error) {
      console.error('Failed to fetch Eagle data:', error)
    }
    setLoading(false)
  }

  async function resolveAlert(alertId: string) {
    try {
      const res = await fetch(`/api/admin/eagle/alerts/${alertId}/resolve`, { method: 'POST' })
      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    })

  const getTimeSince = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>
      case 'high':
        return <Badge className="bg-orange-600">High</Badge>
      case 'medium':
        return <Badge className="bg-amber-600">Medium</Badge>
      case 'low':
        return <Badge variant="secondary">Low</Badge>
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  // Transform devices for the map
  const mapVehicles = devices.map(d => ({
    id: d.vehicle.id,
    make: d.vehicle.make,
    model: d.vehicle.model,
    year: d.vehicle.year,
    license_plate: d.vehicle.license_plate,
    status: d.vehicle.status,
    device: {
      last_lat: d.last_lat || 0,
      last_lng: d.last_lng || 0,
      last_speed_mph: d.last_speed_mph,
      last_seen_at: d.last_seen_at,
    },
    alerts: alerts.filter(a => !a.is_resolved).slice(0, 1).map(a => ({ severity: a.severity })),
  }))

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-6" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Radar className="h-8 w-8 text-[#CC0000]" />
            Eagle Network
          </h1>
          <p className="text-muted-foreground">Fleet-wide GPS tracking and telemetry</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Network Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Status</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.online_devices || 0} / {stats?.total_devices || 0}
            </div>
            <p className="text-xs text-muted-foreground">Devices online</p>
            <Progress 
              value={stats?.total_devices ? (stats.online_devices / stats.total_devices) * 100 : 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card className={stats?.offline_devices ? 'border-amber-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline Devices</CardTitle>
            <WifiOff className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.offline_devices || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.low_battery_devices || 0} low battery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trips Today</CardTitle>
            <Navigation className="h-4 w-4 text-[#CC0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_trips_today || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {stats?.total_miles_today?.toLocaleString() || 0} miles
            </p>
          </CardContent>
        </Card>

        <Card className={stats?.active_alerts ? 'border-red-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_alerts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.geofences_active || 0} geofences active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Fleet Map
          </CardTitle>
          <CardDescription>Real-time vehicle positions from Bouncie GPS</CardDescription>
        </CardHeader>
        <CardContent>
          <FleetMap 
            vehicles={mapVehicles}
            selectedVehicle={selectedVehicle}
            onVehicleSelect={setSelectedVehicle}
          />
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Device List */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Devices</CardTitle>
            <CardDescription>All Bouncie GPS trackers</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Battery</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow 
                    key={device.id}
                    className={selectedVehicle === device.vehicle.id ? 'bg-muted' : ''}
                    onClick={() => setSelectedVehicle(device.vehicle.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {device.vehicle.year} {device.vehicle.make} {device.vehicle.model}
                          </p>
                          <p className="text-xs text-muted-foreground">{device.vehicle.license_plate}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {device.is_online ? (
                        <Badge className="bg-green-600 gap-1">
                          <Wifi className="h-3 w-3" /> Online
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <WifiOff className="h-3 w-3" /> Offline
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Battery className={`h-4 w-4 ${
                          device.battery_level > 50 ? 'text-green-600' :
                          device.battery_level > 20 ? 'text-amber-600' : 'text-red-600'
                        }`} />
                        <span className="text-sm">{device.battery_level}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {getTimeSince(device.last_seen_at)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {devices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No devices connected
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Recent Alerts
            </CardTitle>
            <CardDescription>Fleet alerts from RADar</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-auto">
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg border ${
                    alert.is_resolved ? 'bg-muted/50 opacity-60' : 
                    alert.severity === 'critical' ? 'border-red-500 bg-red-500/5' :
                    alert.severity === 'high' ? 'border-orange-500 bg-orange-500/5' :
                    'bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getSeverityBadge(alert.severity)}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(alert.created_at)}
                        </span>
                      </div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {alert.vehicle.year} {alert.vehicle.make} {alert.vehicle.model} ({alert.vehicle.license_plate})
                      </p>
                    </div>
                    {!alert.is_resolved && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">No alerts</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
