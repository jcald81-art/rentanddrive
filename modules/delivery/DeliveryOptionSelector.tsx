'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plane, Building2, Mountain, Home, ChevronDown, Truck, Clock, DollarSign } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export type DeliveryLocationType =
  | 'airport_rno'
  | 'downtown_reno'
  | 'lake_tahoe'
  | 'sparks'
  | 'hotel'
  | 'home'
  | 'custom'

export interface DeliveryOption {
  enabled: boolean
  locationType: DeliveryLocationType
  customAddress: string
  scheduledAt: string
  estimatedFee: number | null
  estimatedEta: number | null
  provider: 'lyft' | 'uber_direct' | null
}

const PRESET_LOCATIONS: Array<{
  type: DeliveryLocationType
  label: string
  description: string
  icon: React.ReactNode
  fee: number
  eta: number
}> = [
  {
    type: 'airport_rno',
    label: 'Reno-Tahoe Airport (RNO)',
    description: 'Direct to Terminal 1 or 2 curbside',
    icon: <Plane className="w-4 h-4" />,
    fee: 2500,
    eta: 25,
  },
  {
    type: 'downtown_reno',
    label: 'Downtown Reno',
    description: 'Hotels, casinos, convention center',
    icon: <Building2 className="w-4 h-4" />,
    fee: 1500,
    eta: 20,
  },
  {
    type: 'lake_tahoe',
    label: 'Lake Tahoe',
    description: 'North or South Shore properties',
    icon: <Mountain className="w-4 h-4" />,
    fee: 4500,
    eta: 55,
  },
  {
    type: 'sparks',
    label: 'Sparks, NV',
    description: 'Victorian Square, Outlets, hotels',
    icon: <Building2 className="w-4 h-4" />,
    fee: 2000,
    eta: 30,
  },
  {
    type: 'home',
    label: 'My Address',
    description: 'Deliver directly to your door',
    icon: <Home className="w-4 h-4" />,
    fee: 2000,
    eta: 35,
  },
  {
    type: 'custom',
    label: 'Other Location',
    description: 'Any Reno metro area address',
    icon: <MapPin className="w-4 h-4" />,
    fee: null,
    eta: null,
  },
]

interface DeliveryOptionSelectorProps {
  bookingId?: string
  vehicleId?: string
  checkIn?: Date
  onChange: (option: DeliveryOption) => void
  defaultValue?: Partial<DeliveryOption>
}

export function DeliveryOptionSelector({
  bookingId,
  vehicleId,
  checkIn,
  onChange,
  defaultValue,
}: DeliveryOptionSelectorProps) {
  const [enabled, setEnabled] = useState(defaultValue?.enabled ?? false)
  const [locationType, setLocationType] = useState<DeliveryLocationType>(
    defaultValue?.locationType ?? 'airport_rno'
  )
  const [customAddress, setCustomAddress] = useState(defaultValue?.customAddress ?? '')
  const [scheduledAt, setScheduledAt] = useState(
    defaultValue?.scheduledAt ??
      (checkIn ? new Date(checkIn.getTime() - 60 * 60 * 1000).toISOString().slice(0, 16) : '')
  )
  const [loadingQuote, setLoadingQuote] = useState(false)

  const selectedPreset = PRESET_LOCATIONS.find((l) => l.type === locationType)

  useEffect(() => {
    const option: DeliveryOption = {
      enabled,
      locationType,
      customAddress,
      scheduledAt,
      estimatedFee: enabled ? (selectedPreset?.fee ?? null) : null,
      estimatedEta: enabled ? (selectedPreset?.eta ?? null) : null,
      provider: enabled ? 'lyft' : null,
    }
    onChange(option)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, locationType, customAddress, scheduledAt])

  const formatFee = (cents: number | null) => {
    if (cents === null) return 'Quote needed'
    return `$${(cents / 100).toFixed(2)}`
  }

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <Label htmlFor="delivery-toggle" className="text-sm font-medium text-foreground cursor-pointer">
              Delivery &amp; Pickup
            </Label>
            <p className="text-xs text-muted-foreground">
              Have the vehicle delivered to you by a Lyft or Uber driver
            </p>
          </div>
        </div>
        <Switch
          id="delivery-toggle"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>

      {/* Options (visible when enabled) */}
      {enabled && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Location type selector */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Deliver to
            </Label>
            <RadioGroup
              value={locationType}
              onValueChange={(v) => setLocationType(v as DeliveryLocationType)}
              className="grid grid-cols-1 gap-2"
            >
              {PRESET_LOCATIONS.map((loc) => (
                <label
                  key={loc.type}
                  htmlFor={`loc-${loc.type}`}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                    ${locationType === loc.type
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border bg-card hover:border-primary/30'
                    }
                  `}
                >
                  <RadioGroupItem value={loc.type} id={`loc-${loc.type}`} className="sr-only" />
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${locationType === loc.type ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}
                  `}>
                    {loc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{loc.label}</span>
                      {loc.fee !== null && (
                        <span className="text-sm font-semibold text-foreground ml-2">
                          +{formatFee(loc.fee)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{loc.description}</p>
                    {loc.eta && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">~{loc.eta} min delivery</span>
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Custom address input */}
          {locationType === 'custom' || locationType === 'home' ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Delivery Address
              </Label>
              <Input
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="123 Main St, Reno, NV 89501"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Must be within 60 miles of downtown Reno
              </p>
            </div>
          ) : null}

          {/* Scheduled delivery time */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Delivery Time
            </Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Schedule at least 1 hour before your check-in
            </p>
          </div>

          {/* Fee summary */}
          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Truck className="w-4 h-4" />
                <span>Delivery fee</span>
              </div>
              <span className="font-semibold text-foreground">
                {formatFee(selectedPreset?.fee ?? null)}
              </span>
            </div>
            {selectedPreset?.eta && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Estimated arrival</span>
                </div>
                <span className="text-foreground">{selectedPreset.eta} minutes</span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <Badge variant="secondary" className="text-xs gap-1">
                <Truck className="w-3 h-3" />
                Lyft first, Uber backup
              </Badge>
              <span className="text-xs text-muted-foreground">Contactless handoff</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
