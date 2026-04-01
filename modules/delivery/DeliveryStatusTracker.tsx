'use client'

import { useEffect, useState } from 'react'
import { Truck, User, Phone, MapPin, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export type DeliveryStatus =
  | 'requested'
  | 'quoted'
  | 'confirmed'
  | 'dispatched'
  | 'en_route'
  | 'arrived'
  | 'delivered'
  | 'cancelled'
  | 'failed'

export interface DeliveryRecord {
  id: string
  bookingId: string
  direction: 'to_renter' | 'from_renter'
  provider: 'lyft' | 'uber_direct' | 'rad_driver'
  status: DeliveryStatus
  pickupAddress: string
  dropoffAddress: string
  scheduledAt?: string
  driverName?: string
  driverPhone?: string
  driverVehicle?: string
  driverLat?: number
  driverLng?: number
  etaMinutes?: number
  feeCents: number
  trackingUrl?: string
}

const STATUS_STEPS: Array<{
  key: DeliveryStatus
  label: string
  icon: React.ReactNode
}> = [
  { key: 'confirmed', label: 'Confirmed', icon: <CheckCircle2 className="w-4 h-4" /> },
  { key: 'dispatched', label: 'Dispatched', icon: <Truck className="w-4 h-4" /> },
  { key: 'en_route', label: 'En Route', icon: <Truck className="w-4 h-4" /> },
  { key: 'arrived', label: 'Arrived', icon: <MapPin className="w-4 h-4" /> },
  { key: 'delivered', label: 'Delivered', icon: <CheckCircle2 className="w-4 h-4" /> },
]

const STATUS_ORDER: DeliveryStatus[] = [
  'requested', 'quoted', 'confirmed', 'dispatched', 'en_route', 'arrived', 'delivered',
]

function getStatusIndex(status: DeliveryStatus): number {
  return STATUS_ORDER.indexOf(status)
}

function getStatusColor(status: DeliveryStatus): string {
  if (status === 'delivered') return 'bg-green-500/10 text-green-600 border-green-500/20'
  if (status === 'cancelled' || status === 'failed') return 'bg-red-500/10 text-red-600 border-red-500/20'
  if (status === 'en_route' || status === 'arrived') return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
  return 'bg-muted text-muted-foreground border-border'
}

interface DeliveryStatusTrackerProps {
  delivery: DeliveryRecord
  onRefresh?: () => void
  compact?: boolean
}

export function DeliveryStatusTracker({
  delivery,
  onRefresh,
  compact = false,
}: DeliveryStatusTrackerProps) {
  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    if (!delivery.scheduledAt) return
    const updateTime = () => {
      const diff = new Date(delivery.scheduledAt!).getTime() - Date.now()
      if (diff > 0) {
        const mins = Math.round(diff / 60000)
        setTimeAgo(mins > 60 ? `${Math.round(mins / 60)}h away` : `${mins}m away`)
      } else {
        setTimeAgo('Now')
      }
    }
    updateTime()
    const interval = setInterval(updateTime, 30000)
    return () => clearInterval(interval)
  }, [delivery.scheduledAt])

  const isCancelled = delivery.status === 'cancelled' || delivery.status === 'failed'
  const isComplete = delivery.status === 'delivered'
  const currentStep = getStatusIndex(delivery.status)

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Truck className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {delivery.direction === 'to_renter' ? 'Delivery' : 'Pickup'}
        </span>
        <Badge
          variant="outline"
          className={`text-xs capitalize ${getStatusColor(delivery.status)}`}
        >
          {delivery.status.replace('_', ' ')}
        </Badge>
        {delivery.etaMinutes && !isComplete && !isCancelled && (
          <span className="text-xs text-muted-foreground">{delivery.etaMinutes}m ETA</span>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {delivery.direction === 'to_renter' ? 'Vehicle Delivery' : 'Vehicle Pickup'}
            </h3>
            <p className="text-xs text-muted-foreground capitalize">
              via {delivery.provider.replace('_', ' ')}
              {delivery.scheduledAt && ` · ${timeAgo}`}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`text-xs capitalize ${getStatusColor(delivery.status)}`}
        >
          {isCancelled ? (
            <XCircle className="w-3 h-3 mr-1" />
          ) : isComplete ? (
            <CheckCircle2 className="w-3 h-3 mr-1" />
          ) : (
            <Clock className="w-3 h-3 mr-1" />
          )}
          {delivery.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Progress steps */}
      {!isCancelled && (
        <div className="flex items-center gap-0">
          {STATUS_STEPS.map((step, i) => {
            const stepIdx = getStatusIndex(step.key)
            const isCompleted = currentStep > stepIdx
            const isCurrent = currentStep === stepIdx

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs
                    transition-all duration-300
                    ${isCompleted ? 'bg-primary text-primary-foreground' : ''}
                    ${isCurrent ? 'bg-primary/20 text-primary ring-2 ring-primary/30' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-muted text-muted-foreground' : ''}
                  `}>
                    {step.icon}
                  </div>
                  <span className={`text-[10px] text-center leading-tight ${
                    isCurrent ? 'text-primary font-medium' :
                    isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-5 rounded-full transition-all ${
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Cancelled state */}
      {isCancelled && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">
            {delivery.status === 'failed'
              ? 'Delivery failed. Please contact support.'
              : 'This delivery has been cancelled.'}
          </p>
        </div>
      )}

      {/* Addresses */}
      <div className="space-y-2">
        <div className="flex items-start gap-2 text-sm">
          <div className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-muted-foreground text-xs">From</span>
            <p className="text-foreground font-medium leading-snug">{delivery.pickupAddress}</p>
          </div>
        </div>
        <div className="ml-2 h-5 w-0.5 bg-muted" />
        <div className="flex items-start gap-2 text-sm">
          <div className="w-4 h-4 rounded-full bg-primary flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-muted-foreground text-xs">To</span>
            <p className="text-foreground font-medium leading-snug">{delivery.dropoffAddress}</p>
          </div>
        </div>
      </div>

      {/* Driver info (visible once dispatched) */}
      {delivery.driverName && !isCancelled && (
        <div className="rounded-xl bg-muted/40 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{delivery.driverName}</p>
              {delivery.driverVehicle && (
                <p className="text-xs text-muted-foreground">{delivery.driverVehicle}</p>
              )}
            </div>
          </div>
          {delivery.driverPhone && (
            <a href={`tel:${delivery.driverPhone}`}>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <Phone className="w-3 h-3" />
                Call
              </Button>
            </a>
          )}
        </div>
      )}

      {/* ETA and tracking */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          {delivery.etaMinutes && !isComplete && !isCancelled
            ? `~${delivery.etaMinutes} min ETA`
            : isComplete
            ? 'Delivered'
            : 'Awaiting dispatch'}
        </div>
        <div className="flex items-center gap-2">
          {delivery.trackingUrl && (
            <a href={delivery.trackingUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                <MapPin className="w-3 h-3" />
                Track
              </Button>
            </a>
          )}
          {onRefresh && !isComplete && !isCancelled && (
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
