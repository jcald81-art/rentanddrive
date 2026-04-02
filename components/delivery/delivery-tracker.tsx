'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Car, MapPin, Phone, Star, Clock, CheckCircle2, 
  Navigation, Unlock, Lock, AlertCircle, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DeliveryRide {
  id: string
  ride_type: 'pickup' | 'return'
  provider: 'uber' | 'lyft'
  status: string
  pickup_address: string
  dropoff_address: string
  driver_name?: string
  driver_phone?: string
  driver_photo_url?: string
  driver_vehicle_make?: string
  driver_vehicle_model?: string
  driver_vehicle_color?: string
  driver_vehicle_plate?: string
  driver_rating?: number
  estimated_arrival?: string
  estimated_fare_cents?: number
  mobokey_unlock_at?: string
  mobokey_lock_at?: string
}

interface DeliveryTrackerProps {
  bookingId: string
  vehicleName: string
  onComplete?: () => void
}

const STATUS_STEPS = [
  { key: 'requested', label: 'Ride Requested', icon: Clock },
  { key: 'driver_assigned', label: 'Driver Assigned', icon: Car },
  { key: 'en_route_to_pickup', label: 'En Route to Pickup', icon: Navigation },
  { key: 'arrived_at_pickup', label: 'Arrived at Pickup', icon: MapPin },
  { key: 'en_route_to_dropoff', label: 'En Route to Dropoff', icon: Navigation },
  { key: 'arrived_at_dropoff', label: 'Arrived at Dropoff', icon: MapPin },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
]

export function DeliveryTracker({ bookingId, vehicleName, onComplete }: DeliveryTrackerProps) {
  const [rides, setRides] = useState<DeliveryRide[]>([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<'uber' | 'lyft'>('uber')

  useEffect(() => {
    fetchRides()
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchRides, 10000)
    return () => clearInterval(interval)
  }, [bookingId])

  const fetchRides = async () => {
    try {
      const res = await fetch(`/api/delivery?bookingId=${bookingId}`)
      if (res.ok) {
        const data = await res.json()
        setRides(data)
      }
    } catch (error) {
      console.error('Failed to fetch rides:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestRide = async (rideType: 'pickup' | 'return') => {
    setRequesting(true)
    try {
      const res = await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          rideType,
          provider: selectedProvider,
          // These would come from the booking/vehicle data in production
          pickupAddress: rideType === 'pickup' ? '123 Host St, Reno, NV' : '456 Renter Ave, Reno, NV',
          dropoffAddress: rideType === 'pickup' ? '456 Renter Ave, Reno, NV' : '123 Host St, Reno, NV',
        }),
      })

      if (res.ok) {
        await fetchRides()
      }
    } catch (error) {
      console.error('Failed to request ride:', error)
    } finally {
      setRequesting(false)
    }
  }

  const getCurrentStepIndex = (status: string) => {
    const index = STATUS_STEPS.findIndex(s => s.key === status)
    return index === -1 ? 0 : index
  }

  const getProgressPercent = (status: string) => {
    const index = getCurrentStepIndex(status)
    return ((index + 1) / STATUS_STEPS.length) * 100
  }

  if (loading) {
    return (
      <Card className="border-white/10 bg-[#151820]">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF4D4D]" />
        </CardContent>
      </Card>
    )
  }

  const activeRide = rides.find(r => !['completed', 'cancelled', 'failed'].includes(r.status))
  const pickupRide = rides.find(r => r.ride_type === 'pickup')
  const returnRide = rides.find(r => r.ride_type === 'return')

  return (
    <div className="space-y-4">
      {/* Provider Selection */}
      {!activeRide && (
        <Card className="border-white/10 bg-[#151820]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Car className="h-5 w-5 text-[#FF4D4D]" />
              Vehicle Delivery
            </CardTitle>
            <CardDescription>
              Request Uber or Lyft to deliver {vehicleName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={selectedProvider === 'uber' ? 'default' : 'outline'}
                onClick={() => setSelectedProvider('uber')}
                className={cn(
                  'flex-1',
                  selectedProvider === 'uber' && 'bg-black text-white hover:bg-black/90'
                )}
              >
                <span className="font-bold">Uber</span>
              </Button>
              <Button
                variant={selectedProvider === 'lyft' ? 'default' : 'outline'}
                onClick={() => setSelectedProvider('lyft')}
                className={cn(
                  'flex-1',
                  selectedProvider === 'lyft' && 'bg-[#FF00BF] text-white hover:bg-[#FF00BF]/90'
                )}
              >
                <span className="font-bold">Lyft</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {!pickupRide && (
                <Button
                  onClick={() => requestRide('pickup')}
                  disabled={requesting}
                  className="bg-[#FF4D4D] hover:bg-[#e63939]"
                >
                  {requesting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Navigation className="h-4 w-4 mr-2" />
                  )}
                  Deliver to Renter
                </Button>
              )}
              {!returnRide && pickupRide?.status === 'completed' && (
                <Button
                  onClick={() => requestRide('return')}
                  disabled={requesting}
                  variant="outline"
                  className="border-[#FF4D4D] text-[#FF4D4D] hover:bg-[#FF4D4D]/10"
                >
                  {requesting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Navigation className="h-4 w-4 mr-2 rotate-180" />
                  )}
                  Return to Host
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Ride Tracking */}
      {activeRide && (
        <Card className="border-[#FF4D4D]/30 bg-[#151820]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  {activeRide.ride_type === 'pickup' ? (
                    <Navigation className="h-5 w-5 text-[#FF4D4D]" />
                  ) : (
                    <Navigation className="h-5 w-5 text-[#FF4D4D] rotate-180" />
                  )}
                  {activeRide.ride_type === 'pickup' ? 'Delivery to Renter' : 'Return to Host'}
                </CardTitle>
                <CardDescription>
                  via {activeRide.provider === 'uber' ? 'Uber' : 'Lyft'}
                </CardDescription>
              </div>
              <Badge className={cn(
                'text-sm',
                activeRide.status === 'completed' && 'bg-emerald-500/20 text-emerald-400',
                activeRide.status === 'cancelled' && 'bg-red-500/20 text-red-400',
                !['completed', 'cancelled'].includes(activeRide.status) && 'bg-amber-500/20 text-amber-400'
              )}>
                {activeRide.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={getProgressPercent(activeRide.status)} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Requested</span>
                <span>In Transit</span>
                <span>Delivered</span>
              </div>
            </div>

            {/* Driver Info */}
            {activeRide.driver_name && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5">
                <Avatar className="h-14 w-14 border-2 border-[#FF4D4D]">
                  <AvatarImage src={activeRide.driver_photo_url} />
                  <AvatarFallback>{activeRide.driver_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{activeRide.driver_name}</p>
                    {activeRide.driver_rating && (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {activeRide.driver_rating}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activeRide.driver_vehicle_color} {activeRide.driver_vehicle_make} {activeRide.driver_vehicle_model}
                  </p>
                  <p className="text-sm font-mono text-[#FF4D4D]">
                    {activeRide.driver_vehicle_plate}
                  </p>
                </div>
                {activeRide.driver_phone && (
                  <Button size="icon" variant="outline" asChild>
                    <a href={`tel:${activeRide.driver_phone}`}>
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            )}

            {/* Locations */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 mt-1.5 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Pickup</p>
                  <p className="text-white text-sm">{activeRide.pickup_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 mt-1.5 rounded-full bg-[#FF4D4D]" />
                <div>
                  <p className="text-xs text-muted-foreground">Dropoff</p>
                  <p className="text-white text-sm">{activeRide.dropoff_address}</p>
                </div>
              </div>
            </div>

            {/* MoboKey Status */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2 flex-1">
                <Unlock className={cn(
                  'h-5 w-5',
                  activeRide.mobokey_unlock_at ? 'text-emerald-400' : 'text-muted-foreground'
                )} />
                <div>
                  <p className="text-sm text-white">Vehicle Unlocked</p>
                  {activeRide.mobokey_unlock_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(activeRide.mobokey_unlock_at).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Lock className={cn(
                  'h-5 w-5',
                  activeRide.mobokey_lock_at ? 'text-emerald-400' : 'text-muted-foreground'
                )} />
                <div>
                  <p className="text-sm text-white">Vehicle Locked</p>
                  {activeRide.mobokey_lock_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(activeRide.mobokey_lock_at).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ETA and Fare */}
            <div className="flex items-center justify-between text-sm">
              {activeRide.estimated_arrival && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  ETA: {new Date(activeRide.estimated_arrival).toLocaleTimeString()}
                </div>
              )}
              {activeRide.estimated_fare_cents && (
                <div className="text-white font-medium">
                  Est. ${(activeRide.estimated_fare_cents / 100).toFixed(2)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Rides Summary */}
      {rides.filter(r => r.status === 'completed').length > 0 && !activeRide && (
        <Card className="border-emerald-500/30 bg-[#151820]">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Completed Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rides.filter(r => r.status === 'completed').map(ride => (
                <div key={ride.id} className="flex items-center justify-between p-2 rounded bg-white/5">
                  <span className="text-sm text-white">
                    {ride.ride_type === 'pickup' ? 'Delivered to Renter' : 'Returned to Host'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    via {ride.provider === 'uber' ? 'Uber' : 'Lyft'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
