'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { 
  Car, 
  MapPin, 
  Clock, 
  DollarSign, 
  RefreshCw,
  Phone,
  User,
  Navigation,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
} from 'lucide-react'

interface Ride {
  id: string
  booking_id: string
  ride_type: 'lyft' | 'uber'
  ride_direction: 'pickup' | 'dropoff'
  rider_name: string
  rider_phone: string
  pickup_address: string
  dropoff_address: string
  scheduled_time: string
  ride_status: string
  driver_name?: string
  driver_phone?: string
  vehicle_description?: string
  eta_minutes?: number
  cost_cents: number
  created_at: string
  booking?: {
    booking_number: string
    vehicle?: {
      make: string
      model: string
      year: number
    }
  }
}

interface Stats {
  today_rides: number
  today_cost: number
  month_rides: number
  month_cost: number
  pending_rides: number
}

export default function ConciergeDashboard() {
  const [rides, setRides] = useState<Ride[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)

  useEffect(() => {
    fetchRides()
    fetchStats()
  }, [])

  async function fetchRides() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/concierge/rides')
      if (response.ok) {
        const data = await response.json()
        setRides(data.rides || [])
      }
    } catch (error) {
      console.error('Failed to fetch rides:', error)
    }
    setLoading(false)
  }

  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/concierge/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  async function cancelRide(rideId: string) {
    try {
      const response = await fetch(`/api/concierge/status/${rideId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchRides()
        setSelectedRide(null)
      }
    } catch (error) {
      console.error('Failed to cancel ride:', error)
    }
  }

  async function refreshRideStatus(rideId: string) {
    try {
      const response = await fetch(`/api/concierge/status/${rideId}`)
      if (response.ok) {
        const data = await response.json()
        setRides(prev => prev.map(r => r.id === rideId ? data.ride : r))
        if (selectedRide?.id === rideId) {
          setSelectedRide(data.ride)
        }
      }
    } catch (error) {
      console.error('Failed to refresh ride status:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
      scheduled: { variant: 'secondary', icon: Clock },
      dispatched: { variant: 'default', icon: Car },
      en_route: { variant: 'default', icon: Navigation },
      arrived: { variant: 'default', icon: MapPin },
      completed: { variant: 'outline', icon: CheckCircle },
      cancelled: { variant: 'destructive', icon: XCircle },
      failed: { variant: 'destructive', icon: AlertCircle },
    }
    
    const config = statusConfig[status] || { variant: 'secondary' as const, icon: Clock }
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        <span className="capitalize">{status.replace('_', ' ')}</span>
      </Badge>
    )
  }

  const todayRides = rides.filter(r => {
    const rideDate = new Date(r.scheduled_time)
    const today = new Date()
    return rideDate.toDateString() === today.toDateString()
  })

  const upcomingRides = rides.filter(r => {
    const rideDate = new Date(r.scheduled_time)
    const today = new Date()
    return rideDate > today && !['completed', 'cancelled', 'failed'].includes(r.ride_status)
  })

  const pastRides = rides.filter(r => 
    ['completed', 'cancelled', 'failed'].includes(r.ride_status)
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Concierge Rides</h1>
          <p className="text-muted-foreground">
            Lyft and Uber ride coordination for renters
          </p>
        </div>
        <Button variant="outline" onClick={() => { fetchRides(); fetchStats(); }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today&apos;s Rides</p>
                <p className="text-2xl font-bold">{stats?.today_rides || todayRides.length}</p>
              </div>
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today&apos;s Cost</p>
                <p className="text-2xl font-bold">
                  ${((stats?.today_cost || todayRides.reduce((sum, r) => sum + (r.cost_cents || 0), 0)) / 100).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Spend</p>
                <p className="text-2xl font-bold">
                  ${((stats?.month_cost || 0) / 100).toFixed(2)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Rides</p>
                <p className="text-2xl font-bold">{stats?.pending_rides || upcomingRides.length}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Rides List */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="today">
            <TabsList className="mb-4">
              <TabsTrigger value="today">
                Today ({todayRides.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingRides.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastRides.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today">
              <RidesList 
                rides={todayRides} 
                loading={loading}
                onSelect={setSelectedRide}
                onRefresh={refreshRideStatus}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>

            <TabsContent value="upcoming">
              <RidesList 
                rides={upcomingRides} 
                loading={loading}
                onSelect={setSelectedRide}
                onRefresh={refreshRideStatus}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>

            <TabsContent value="past">
              <RidesList 
                rides={pastRides} 
                loading={loading}
                onSelect={setSelectedRide}
                onRefresh={refreshRideStatus}
                getStatusBadge={getStatusBadge}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Ride Detail Panel */}
        <div>
          {selectedRide ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Badge className={selectedRide.ride_type === 'lyft' ? 'bg-pink-600' : 'bg-black'}>
                      {selectedRide.ride_type.toUpperCase()}
                    </Badge>
                    {selectedRide.ride_direction === 'pickup' ? 'Pickup' : 'Dropoff'}
                  </CardTitle>
                  {getStatusBadge(selectedRide.ride_status)}
                </div>
                <CardDescription>
                  Scheduled: {new Date(selectedRide.scheduled_time).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Rider</p>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{selectedRide.rider_name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${selectedRide.rider_phone}`} className="text-sm text-[#CC0000]">
                      {selectedRide.rider_phone}
                    </a>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Pickup</p>
                  <p className="text-sm">{selectedRide.pickup_address}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Dropoff</p>
                  <p className="text-sm">{selectedRide.dropoff_address}</p>
                </div>

                {selectedRide.driver_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">Driver</p>
                    <p className="font-medium">{selectedRide.driver_name}</p>
                    {selectedRide.vehicle_description && (
                      <p className="text-sm text-muted-foreground">{selectedRide.vehicle_description}</p>
                    )}
                    {selectedRide.driver_phone && (
                      <a href={`tel:${selectedRide.driver_phone}`} className="text-sm text-[#CC0000]">
                        {selectedRide.driver_phone}
                      </a>
                    )}
                  </div>
                )}

                {selectedRide.eta_minutes && selectedRide.ride_status !== 'completed' && (
                  <div>
                    <p className="text-sm text-muted-foreground">ETA</p>
                    <p className="font-medium">{selectedRide.eta_minutes} minutes</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Cost</p>
                  <p className="text-lg font-bold">${(selectedRide.cost_cents / 100).toFixed(2)}</p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refreshRideStatus(selectedRide.id)}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Status
                  </Button>
                  {!['completed', 'cancelled', 'failed'].includes(selectedRide.ride_status) && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => cancelRide(selectedRide.id)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Ride
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a ride to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function RidesList({
  rides,
  loading,
  onSelect,
  onRefresh,
  getStatusBadge,
}: {
  rides: Ride[]
  loading: boolean
  onSelect: (ride: Ride) => void
  onRefresh: (rideId: string) => void
  getStatusBadge: (status: string) => React.ReactNode
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading rides...</p>
        </CardContent>
      </Card>
    )
  }

  if (rides.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No rides found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {rides.map((ride) => (
        <Card 
          key={ride.id}
          className="cursor-pointer hover:border-[#CC0000]/50 transition-colors"
          onClick={() => onSelect(ride)}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge className={ride.ride_type === 'lyft' ? 'bg-pink-600' : 'bg-black'}>
                  {ride.ride_type.toUpperCase()}
                </Badge>
                <div>
                  <p className="font-medium">{ride.rider_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {ride.ride_direction === 'pickup' ? 'To vehicle' : 'From vehicle'} • {new Date(ride.scheduled_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">${(ride.cost_cents / 100).toFixed(2)}</span>
                {getStatusBadge(ride.ride_status)}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onRefresh(ride.id); }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
