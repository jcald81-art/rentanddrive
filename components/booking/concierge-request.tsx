'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Car, MapPin, Clock, CheckCircle, Loader2, Gift } from 'lucide-react'

interface ConciergeRequestProps {
  bookingId: string
  vehicleAddress: string
  pickupDate: string
  dropoffDate: string
}

export function ConciergeRequest({
  bookingId,
  vehicleAddress,
  pickupDate,
  dropoffDate,
}: ConciergeRequestProps) {
  const [wantsPickupRide, setWantsPickupRide] = useState(false)
  const [wantsDropoffRide, setWantsDropoffRide] = useState(false)
  const [pickupAddress, setPickupAddress] = useState('Reno-Tahoe International Airport')
  const [dropoffAddress, setDropoffAddress] = useState('Reno-Tahoe International Airport')
  const [pickupTime, setPickupTime] = useState('')
  const [dropoffTime, setDropoffTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [scheduled, setScheduled] = useState<{ pickup?: boolean; dropoff?: boolean }>({})
  const [error, setError] = useState<string | null>(null)

  async function scheduleRide(direction: 'pickup' | 'dropoff') {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/concierge/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          direction,
          pickup_address: direction === 'pickup' ? pickupAddress : vehicleAddress,
          scheduled_time: direction === 'pickup' 
            ? (pickupTime || pickupDate) 
            : (dropoffTime || dropoffDate),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to schedule ride')
      }

      setScheduled(prev => ({ ...prev, [direction]: true }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule ride')
    }

    setLoading(false)
  }

  return (
    <Card className="border-[#CC0000]/20 bg-gradient-to-br from-[#CC0000]/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CC0000]/10">
            <Gift className="h-5 w-5 text-[#CC0000]" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Free Ride to Your Vehicle
              <Badge className="bg-[#CC0000]">Premium Perk</Badge>
            </CardTitle>
            <CardDescription>
              We partner with Lyft to get you to and from your rental - on us!
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pickup Ride */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Ride to vehicle pickup</p>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll pick you up and bring you to your rental
                </p>
              </div>
            </div>
            <Switch
              checked={wantsPickupRide}
              onCheckedChange={setWantsPickupRide}
              disabled={scheduled.pickup}
            />
          </div>

          {wantsPickupRide && !scheduled.pickup && (
            <div className="ml-8 space-y-3 border-l-2 border-[#CC0000]/20 pl-4">
              <div>
                <Label htmlFor="pickup-address">Pickup location</Label>
                <Input
                  id="pickup-address"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  placeholder="Enter your pickup address"
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Drop-off: {vehicleAddress}</span>
              </div>
              <div>
                <Label htmlFor="pickup-time">Pickup time (optional)</Label>
                <Input
                  id="pickup-time"
                  type="datetime-local"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank to use your booking start time
                </p>
              </div>
              <Button
                onClick={() => scheduleRide('pickup')}
                disabled={loading || !pickupAddress}
                className="w-full bg-[#CC0000] hover:bg-[#CC0000]/90"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...</>
                ) : (
                  <>Schedule Pickup Ride</>
                )}
              </Button>
            </div>
          )}

          {scheduled.pickup && (
            <div className="ml-8 flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Pickup ride scheduled! Check your texts for details.</span>
            </div>
          )}
        </div>

        {/* Dropoff Ride */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Ride from vehicle dropoff</p>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll take you home after returning the vehicle
                </p>
              </div>
            </div>
            <Switch
              checked={wantsDropoffRide}
              onCheckedChange={setWantsDropoffRide}
              disabled={scheduled.dropoff}
            />
          </div>

          {wantsDropoffRide && !scheduled.dropoff && (
            <div className="ml-8 space-y-3 border-l-2 border-[#CC0000]/20 pl-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Pickup: {vehicleAddress}</span>
              </div>
              <div>
                <Label htmlFor="dropoff-address">Drop-off location</Label>
                <Input
                  id="dropoff-address"
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  placeholder="Enter your drop-off address"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="dropoff-time">Pickup time (optional)</Label>
                <Input
                  id="dropoff-time"
                  type="datetime-local"
                  value={dropoffTime}
                  onChange={(e) => setDropoffTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave blank to use your booking end time
                </p>
              </div>
              <Button
                onClick={() => scheduleRide('dropoff')}
                disabled={loading || !dropoffAddress}
                className="w-full bg-[#CC0000] hover:bg-[#CC0000]/90"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...</>
                ) : (
                  <>Schedule Return Ride</>
                )}
              </Button>
            </div>
          )}

          {scheduled.dropoff && (
            <div className="ml-8 flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Return ride scheduled! Check your texts for details.</span>
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Rides provided by Lyft. Standard Lyft policies apply. 
          We cover the cost as a thank-you for booking with Rent & Drive.
        </p>
      </CardContent>
    </Card>
  )
}
