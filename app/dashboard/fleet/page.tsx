'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Car, 
  MapPin, 
  AlertTriangle, 
  Battery, 
  Gauge,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Navigation,
} from 'lucide-react'

interface VehicleWithDevice {
  id: string
  make: string
  model: string
  year: number
  license_plate: string
  status: 'available' | 'rented' | 'needs_attention' | 'no_tracker' | 'tracker_offline'
  device: {
    battery_voltage: number
    last_lat: number
    last_lng: number
    last_speed_mph: number
    odometer_miles: number
    last_seen_at: string
  } | null
  activeBooking: {
    id: string
    start_date: string
    end_date: string
  } | null
  alerts: {
    id: string
    alert_type: string
    severity: string
    title: string
  }[]
  lastLocation: {
    lat: number
    lng: number
    speed: number
    updatedAt: string
  } | null
}

interface FleetData {
  vehicles: VehicleWithDevice[]
  summary: {
    total: number
    available: number
    rented: number
    needsAttention: number
    noTracker: number
    trackerOffline: number
  }
}

export default function FleetDashboardPage() {
  const [fleetData, setFleetData] = useState<FleetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithDevice | null>(null)

  const fetchFleetData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bouncie/vehicles')
      if (res.ok) {
        const data = await res.json()
        setFleetData(data)
      }
    } catch (error) {
      console.error('Failed to fetch fleet data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFleetData()
    // Refresh every 60 seconds
    const interval = setInterval(fetchFleetData, 60000)
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500">Available</Badge>
      case 'rented':
        return <Badge className="bg-blue-500">Rented</Badge>
      case 'needs_attention':
        return <Badge variant="destructive">Needs Attention</Badge>
      case 'no_tracker':
        return <Badge variant="outline">No Tracker</Badge>
      case 'tracker_offline':
        return <Badge variant="secondary">Tracker Offline</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Fleet Dashboard</h1>
          <p className="text-muted-foreground">Real-time GPS tracking powered by Bouncie</p>
        </div>
        <Button onClick={fetchFleetData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fleet</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetData?.summary.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{fleetData?.summary.available || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rented</CardTitle>
            <Navigation className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{fleetData?.summary.rented || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{fleetData?.summary.needsAttention || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(fleetData?.summary.trackerOffline || 0) + (fleetData?.summary.noTracker || 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="map" className="space-y-4">
        <TabsList>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Live Fleet Map</CardTitle>
              <CardDescription>Real-time vehicle locations (Reno/Tahoe area)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* Placeholder for Leaflet map - would need leaflet installed */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100" />
                <div className="relative z-10 text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <p className="text-lg font-medium">Interactive Map</p>
                  <p className="text-sm text-muted-foreground">
                    {fleetData?.vehicles.filter(v => v.lastLocation).length || 0} vehicles with GPS location
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {fleetData?.vehicles.slice(0, 5).map(vehicle => (
                      <Badge key={vehicle.id} variant="outline" className="text-xs">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                        {vehicle.lastLocation && ` - ${vehicle.lastLocation.speed} mph`}
                      </Badge>
                    ))}
                    {(fleetData?.vehicles.length || 0) > 5 && (
                      <Badge variant="secondary">+{(fleetData?.vehicles.length || 0) - 5} more</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Vehicles</CardTitle>
              <CardDescription>Click a vehicle for details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading fleet data...</div>
                ) : fleetData?.vehicles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No vehicles found</div>
                ) : (
                  fleetData?.vehicles.map(vehicle => (
                    <div
                      key={vehicle.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                        selectedVehicle?.id === vehicle.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Car className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {vehicle.license_plate || 'No plate'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {vehicle.device && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Battery className="h-4 w-4" />
                              {vehicle.device.battery_voltage?.toFixed(1)}V
                            </div>
                          )}
                          {vehicle.lastLocation && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {formatTimeAgo(vehicle.lastLocation.updatedAt)}
                            </div>
                          )}
                          {getStatusBadge(vehicle.status)}
                        </div>
                      </div>
                      {vehicle.alerts.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {vehicle.alerts.map(alert => (
                            <Badge key={alert.id} variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {alert.title}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Unresolved fleet alerts from the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fleetData?.vehicles.flatMap(v => v.alerts).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No active alerts. Fleet is healthy!</p>
                  </div>
                ) : (
                  fleetData?.vehicles.flatMap(v => 
                    v.alerts.map(alert => ({
                      ...alert,
                      vehicle: `${v.year} ${v.make} ${v.model}`,
                    }))
                  ).map(alert => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <AlertTriangle className={`h-6 w-6 ${
                          alert.severity === 'critical' ? 'text-destructive' : 'text-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm text-muted-foreground">{alert.vehicle}</p>
                        </div>
                      </div>
                      <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {alert.severity}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selected Vehicle Detail Panel */}
      {selectedVehicle && (
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </CardTitle>
                <CardDescription>{selectedVehicle.license_plate}</CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setSelectedVehicle(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Status</p>
                {getStatusBadge(selectedVehicle.status)}
              </div>
              {selectedVehicle.device && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Battery</p>
                    <div className="flex items-center gap-2">
                      <Battery className="h-4 w-4" />
                      <span className="font-medium">{selectedVehicle.device.battery_voltage?.toFixed(1)}V</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Odometer</p>
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      <span className="font-medium">
                        {selectedVehicle.device.odometer_miles?.toLocaleString()} mi
                      </span>
                    </div>
                  </div>
                </>
              )}
              {selectedVehicle.lastLocation && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Current Speed</p>
                    <span className="font-medium">{selectedVehicle.lastLocation.speed} mph</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Last Update</p>
                    <span className="font-medium">{formatTimeAgo(selectedVehicle.lastLocation.updatedAt)}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Location</p>
                    <span className="font-medium text-sm">
                      {selectedVehicle.lastLocation.lat.toFixed(4)}, {selectedVehicle.lastLocation.lng.toFixed(4)}
                    </span>
                  </div>
                </>
              )}
              {selectedVehicle.activeBooking && (
                <div className="space-y-2 md:col-span-3">
                  <p className="text-sm text-muted-foreground">Active Booking</p>
                  <p className="font-medium">
                    {new Date(selectedVehicle.activeBooking.start_date).toLocaleDateString()} - {' '}
                    {new Date(selectedVehicle.activeBooking.end_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
