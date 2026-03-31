'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Car, MapPin, Home, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobilityRequest {
  id: string
  type: string
  provider: string
  status: string
  tracking_url?: string
  courier_data?: {
    name?: string
    phone_number?: string
    vehicle?: {
      make?: string
      model?: string
      color?: string
      license_plate?: string
    }
    location?: {
      lat: number
      lng: number
    }
  }
  fee?: number
}

const statusLabels: Record<string, string> = {
  pending: 'Finding driver...',
  accepted: 'Driver accepted',
  arrived: 'Driver arrived',
  pickedUp: 'En route',
  droppedOff: 'Complete',
  pickup: 'Driver en route to pickup',
  pickup_complete: 'Picked up — delivering',
  dropoff: 'Arriving soon',
  delivered: 'Delivered',
  canceled: 'Cancelled',
}

const typeLabels: Record<string, string> = {
  lyft_to_vehicle: 'Lyft to vehicle',
  vehicle_delivery: 'Vehicle delivery',
  lyft_return_ride: 'Lyft home',
}

const typeIcons: Record<string, typeof Car> = {
  lyft_to_vehicle: Car,
  vehicle_delivery: MapPin,
  lyft_return_ride: Home,
}

export function MobilityStatus({ bookingId }: { bookingId: string }) {
  const [requests, setRequests] = useState<MobilityRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Poll every 10 seconds while trip is active
    const fetchRequests = async () => {
      try {
        const res = await fetch(`/api/mobility/status?booking_id=${bookingId}`)
        const data = await res.json()
        setRequests(data.requests || [])
      } catch (error) {
        console.error('Failed to fetch mobility status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
    const interval = setInterval(fetchRequests, 10000)
    return () => clearInterval(interval)
  }, [bookingId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm">Loading mobility status...</span>
      </div>
    )
  }

  if (requests.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Car className="h-4 w-4 text-primary" />
        RAD Mobility
      </h3>

      <div className="space-y-2">
        {requests.map(req => {
          const Icon = typeIcons[req.type] || Car
          const isComplete = req.status === 'delivered' || req.status === 'droppedOff'
          const isCanceled = req.status === 'canceled'
          const isActive = !isComplete && !isCanceled

          return (
            <div
              key={req.id}
              className={cn(
                'p-3.5 rounded-lg border',
                isComplete && 'bg-emerald-500/5 border-emerald-500/20',
                isCanceled && 'bg-red-500/5 border-red-500/20',
                isActive && 'bg-card border-border'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      isComplete && 'bg-emerald-500/10 text-emerald-600',
                      isCanceled && 'bg-red-500/10 text-red-600',
                      isActive && 'bg-primary/10 text-primary'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-foreground">
                        {typeLabels[req.type] || req.type}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded',
                          isComplete && 'bg-emerald-500/10 text-emerald-600',
                          isCanceled && 'bg-red-500/10 text-red-600',
                          isActive && 'bg-amber-500/10 text-amber-600'
                        )}
                      >
                        {statusLabels[req.status] || req.status}
                      </span>
                    </div>

                    {/* Driver/courier info */}
                    {req.courier_data && (
                      <p className="text-[11px] text-muted-foreground">
                        {req.courier_data.name}
                        {req.courier_data.vehicle && (
                          <> · {req.courier_data.vehicle.color} {req.courier_data.vehicle.make} {req.courier_data.vehicle.model}</>
                        )}
                        {req.courier_data.vehicle?.license_plate && (
                          <> · {req.courier_data.vehicle.license_plate}</>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tracking link */}
                {req.tracking_url && isActive && (
                  <a
                    href={req.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline flex-shrink-0"
                  >
                    Track
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
