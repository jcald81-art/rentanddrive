'use client'

import { useState, useEffect } from 'react'
import { Check, Car, MapPin, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MobilityOption = 'lyft_to_vehicle' | 'vehicle_delivery' | 'lyft_return_ride'

interface MobilityEstimates {
  lyft_to_vehicle: number | null
  vehicle_delivery: number | null
  lyft_return: number | null
}

interface MobilityOptionsProps {
  vehicleLocation: string
  renterLocation?: string
  selected: MobilityOption[]
  onSelect: (options: MobilityOption[]) => void
  deliveryAddress: string
  onDeliveryAddressChange: (address: string) => void
}

export function MobilityOptions({
  vehicleLocation,
  renterLocation,
  selected,
  onSelect,
  deliveryAddress,
  onDeliveryAddressChange,
}: MobilityOptionsProps) {
  const [estimates, setEstimates] = useState<MobilityEstimates>({
    lyft_to_vehicle: null,
    vehicle_delivery: null,
    lyft_return: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!renterLocation) return
    
    setLoading(true)
    fetch('/api/mobility/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicle_location: vehicleLocation,
        renter_location: renterLocation,
        delivery_address: deliveryAddress || undefined,
      }),
    })
      .then(r => r.json())
      .then(data => { 
        setEstimates(data)
        setLoading(false) 
      })
      .catch(() => setLoading(false))
  }, [vehicleLocation, renterLocation, deliveryAddress])

  function toggle(option: MobilityOption) {
    const updated = selected.includes(option)
      ? selected.filter(o => o !== option)
      : [...selected, option]
    onSelect(updated)
  }

  const options = [
    {
      id: 'lyft_to_vehicle' as MobilityOption,
      title: 'Free Lyft to your vehicle',
      description: 'We book your Lyft to the pickup location. No Lyft account needed. Arrives 30 min before your trip starts.',
      price: estimates.lyft_to_vehicle,
      free: true,
      provider: 'Lyft',
      providerColor: '#FF00BF',
      badge: 'Most popular',
      icon: Car,
    },
    {
      id: 'vehicle_delivery' as MobilityOption,
      title: 'Deliver vehicle to me',
      description: 'An Uber driver brings your RAD vehicle directly to your location. Enter delivery address below.',
      price: estimates.vehicle_delivery,
      free: false,
      provider: 'Uber Direct',
      providerColor: '#000000',
      badge: 'Industry first',
      icon: MapPin,
    },
    {
      id: 'lyft_return_ride' as MobilityOption,
      title: 'Lyft home after return',
      description: 'We book your ride home the moment you return the vehicle. Just drop the keys in the Keybox and your Lyft is waiting.',
      price: estimates.lyft_return,
      free: true,
      provider: 'Lyft',
      providerColor: '#FF00BF',
      badge: null,
      icon: Home,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-foreground">
            RAD Mobility
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Industry first
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The only P2PCR platform with integrated Uber + Lyft.
          We handle the logistics — you handle the adventure.
        </p>
      </div>

      {/* Option cards */}
      <div className="space-y-2">
        {options.map(option => (
          <div key={option.id}>
            <button
              onClick={() => toggle(option.id)}
              className={cn(
                'w-full flex gap-3 p-3.5 rounded-lg text-left transition-all',
                'border',
                selected.includes(option.id)
                  ? 'border-[#2D4A2D] bg-[#2D4A2D]/5'
                  : 'border-border hover:border-muted-foreground/30 bg-card'
              )}
            >
              {/* Checkbox */}
              <div
                className={cn(
                  'w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors',
                  selected.includes(option.id)
                    ? 'bg-[#2D4A2D] text-white'
                    : 'border-2 border-muted-foreground/30'
                )}
              >
                {selected.includes(option.id) && <Check className="h-3 w-3" />}
              </div>

              <div className="flex-1 min-w-0">
                {/* Title row */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">
                      {option.title}
                    </span>
                    {option.badge && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 flex-shrink-0">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium whitespace-nowrap',
                      option.free ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                    )}
                  >
                    {option.free
                      ? 'FREE'
                      : loading
                      ? '...'
                      : option.price
                      ? `~$${Math.ceil(option.price)}`
                      : 'Get quote'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                  {option.description}
                </p>

                {/* Provider pill */}
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md text-white inline-block"
                  style={{ background: option.providerColor }}
                >
                  {option.provider}
                </span>
              </div>
            </button>

            {/* Delivery address input */}
            {option.id === 'vehicle_delivery' && selected.includes('vehicle_delivery') && (
              <div className="px-3.5 py-3 border border-t-0 border-blue-500/20 rounded-b-lg bg-blue-500/5">
                <label className="text-xs font-medium text-foreground block mb-1.5">
                  Deliver to
                </label>
                <input
                  type="text"
                  placeholder="Hotel name, home address, or airport terminal"
                  value={deliveryAddress}
                  onChange={e => onDeliveryAddressChange(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  An Uber driver will collect your RAD vehicle keys and
                  deliver them to this address.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Free rides callout */}
      {(selected.includes('lyft_to_vehicle') || selected.includes('lyft_return_ride')) && (
        <div className="p-3 border border-border rounded-lg bg-muted/50 text-[11px] text-muted-foreground leading-relaxed">
          Free Lyft rides are provided by RAD as part of your booking.
          No Lyft account required. Your phone number is used to
          dispatch the ride automatically.
        </div>
      )}
    </div>
  )
}
