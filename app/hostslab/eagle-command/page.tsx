'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
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
  AlertTriangle,
  CheckCircle,
  Clock,
  Car,
  MapPin,
  Activity,
  Gauge,
  Users,
  Calendar,
  Shield,
  Zap,
  Eye,
  XCircle,
} from 'lucide-react'
import FleetMap from '@/components/fleet/fleet-map'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  license_plate: string
  status: string
  device?: {
    last_lat: number
    last_lng: number
    last_speed_mph: number
    last_seen_at: string
  } | null
  activeBooking?: {
    id: string
    renter: { full_name: string }
    end_date: string
  } | null
  alerts: Alert[]
}

interface Alert {
  id: string
  vehicle_id: string
  alert_type: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  title: string
  description: string
  is_acknowledged: boolean
  created_at: string
}

interface Trip {
  id: string
  vehicle: { make: string; model: string; year: number }
  renter: { full_name: string }
  start_time: string
  end_time: string | null
  distance_miles: number
  driving_score: number
}

interface RenterScore {
  renter_id: string
  renter_name: string
  trips_count: number
  avg_speed: number
  hard_brakes: number
  driving_score: number
}

interface FleetHealth {
  total_vehicles: number
  connected: number
  alerts_active: number
  avg_health_score: number
}

export default function EagleCommandPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [renterScores, setRenterScores] = useState<RenterScore[]>([])
  const [fleetHealth, setFleetHealth] = useState<FleetHealth | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/host/fleet/vehicles').then(r => r.json()),
      fetch('/api/host/fleet/alerts').then(r => r.json()),
      fetch('/api/host/fleet/trips').then(r => r.json()),
      fetch('/api/host/fleet/renter-scores').then(r => r.json()),
    ])
      .then(([vehiclesData, alertsData, tripsData, scoresData]) => {
        if (vehiclesData.vehicles) setVehicles(vehiclesData.vehicles)
        if (alertsData.alerts) setAlerts(alertsData.alerts)
        if (tripsData.trips) setTrips(tripsData.trips)
        if (scoresData.scores) setRenterScores(scoresData.scores)
        
        // Calculate fleet health
        const connected = vehiclesData.vehicles?.filter((v: Vehicle) => v.device).length || 0
        const activeAlerts = alertsData.alerts?.filter((a: Alert) => !a.is_acknowledged).length || 0
        setFleetHealth({
          total_vehicles: vehiclesData.vehicles?.length || 0,
          connected,
          alerts_active: activeAlerts,
          avg_health_score: 85, // TODO: Calculate from Pulse data
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/host/fleet/alerts/${alertId}/acknowledge`, { method: 'POST' })
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_acknowledged: true } : a
      ))
    } catch (err) {
      console.error('Failed to acknowledge alert:', err)
    }
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-amber-500 text-white'
      case 'low': return 'bg-blue-500 text-white'
      default: return 'bg-slate-500 text-white'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-amber-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-[50vh] w-full" />
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  const activeAlerts = alerts.filter(a => !a.is_acknowledged)
  const activeTrips = trips.filter(t => !t.end_time)
  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#CC0000] rounded-lg">
            <Radar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Eagle Command Center</h1>
            <p className="text-muted-foreground">Real-time fleet monitoring and intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={activeAlerts.length > 0 ? 'destructive' : 'secondary'}>
            {activeAlerts.length} Active Alert{activeAlerts.length !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {activeTrips.length} Active Trip{activeTrips.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Full Width Map */}
      <Card className="overflow-hidden">
        <div className="h-[50vh]">
          <FleetMap
            vehicles={vehicles}
            selectedVehicle={selectedVehicle}
            onVehicleSelect={setSelectedVehicle}
          />
        </div>
      </Card>

      {/* Fleet Health Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{fleetHealth?.total_vehicles || 0}</p>
                <p className="text-sm text-muted-foreground">Total Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Radar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{fleetHealth?.connected || 0}</p>
                <p className="text-sm text-muted-foreground">Eagle Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{fleetHealth?.alerts_active || 0}</p>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{fleetHealth?.avg_health_score || 0}%</p>
                <p className="text-sm text-muted-foreground">Avg Health Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Vehicle Status Cards */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
            {vehicles.map(vehicle => (
              <button
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle.id)}
                className={`w-full p-3 rounded-lg border text-left transition-colors hover:bg-accent ${
                  selectedVehicle === vehicle.id ? 'ring-2 ring-primary bg-accent' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </span>
                  {vehicle.device ? (
                    <Badge className="bg-green-500 text-xs">Online</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">Offline</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{vehicle.license_plate}</span>
                  {vehicle.device && (
                    <>
                      <span>|</span>
                      <span>{vehicle.device.last_speed_mph} mph</span>
                    </>
                  )}
                  {vehicle.activeBooking && (
                    <>
                      <span>|</span>
                      <span className="text-blue-600">Rented</span>
                    </>
                  )}
                </div>
                {vehicle.alerts.length > 0 && (
                  <div className="mt-2">
                    <Badge variant="destructive" className="text-xs">
                      {vehicle.alerts.length} alert{vehicle.alerts.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Active Alerts Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No active alerts</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {activeAlerts.map(alert => (
                  <div 
                    key={alert.id}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(alert.created_at)}
                          </span>
                        </div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alert.description}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Trips and Renter Scores */}
      <Card>
        <Tabs defaultValue="trips">
          <CardHeader className="pb-0">
            <TabsList>
              <TabsTrigger value="trips">Trip History</TabsTrigger>
              <TabsTrigger value="active">Active Trips</TabsTrigger>
              <TabsTrigger value="renter-scores">Renter Behavior</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-4">
            <TabsContent value="trips" className="m-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Renter</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trips.filter(t => t.end_time).slice(0, 10).map(trip => (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium">
                        {trip.vehicle.year} {trip.vehicle.make} {trip.vehicle.model}
                      </TableCell>
                      <TableCell>{trip.renter.full_name}</TableCell>
                      <TableCell>{formatDate(trip.start_time)}</TableCell>
                      <TableCell>{trip.distance_miles.toFixed(1)} mi</TableCell>
                      <TableCell>
                        <span className={getScoreColor(trip.driving_score)}>
                          {trip.driving_score}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="active" className="m-0">
              {activeTrips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No active trips</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTrips.map(trip => (
                    <div key={trip.id} className="p-4 rounded-lg border bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {trip.vehicle.year} {trip.vehicle.make} {trip.vehicle.model}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Renter: {trip.renter.full_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-500 animate-pulse">ACTIVE</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            Started {formatTime(trip.start_time)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="renter-scores" className="m-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Renter</TableHead>
                    <TableHead>Trips</TableHead>
                    <TableHead>Avg Speed</TableHead>
                    <TableHead>Hard Brakes</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renterScores.map(score => (
                    <TableRow key={score.renter_id}>
                      <TableCell className="font-medium">{score.renter_name}</TableCell>
                      <TableCell>{score.trips_count}</TableCell>
                      <TableCell>{score.avg_speed.toFixed(0)} mph</TableCell>
                      <TableCell>{score.hard_brakes}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${getScoreColor(score.driving_score)}`}>
                          {score.driving_score}
                        </span>
                      </TableCell>
                      <TableCell>
                        {score.driving_score < 70 && (
                          <Button variant="destructive" size="sm">
                            <XCircle className="h-4 w-4 mr-1" />
                            Block
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
