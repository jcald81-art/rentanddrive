'use client'

import { useEffect, useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { MapPin, Car } from 'lucide-react'

interface VehicleWithDevice {
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
  lastLocation?: {
    lat: number
    lng: number
    speed: number
    updatedAt: string
  } | null
  activeBooking?: {
    end_date: string
    renter?: { full_name: string }
  } | null
  alerts: { severity: string }[]
}

interface FleetMapProps {
  vehicles: VehicleWithDevice[]
  selectedVehicle?: string | null
  onVehicleSelect: (id: string | null) => void
}

// Reno, NV center coordinates
const RENO_CENTER: [number, number] = [39.5296, -119.8138]

export default function FleetMap({ vehicles, selectedVehicle, onVehicleSelect }: FleetMapProps) {
  const vehiclesWithLocation = useMemo(() => 
    vehicles.filter(v => v.lastLocation || v.device?.last_lat), 
    [vehicles]
  )

  // Simple fallback map view with vehicle markers as a grid
  return (
    <div className="h-[500px] relative bg-muted rounded-lg overflow-hidden">
      {/* Map placeholder with vehicle indicators */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        {/* Center marker for Reno */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
            <span className="text-xs font-medium bg-background/80 px-2 py-1 rounded">Reno, NV</span>
          </div>
        </div>

        {/* Vehicle dots scattered around center */}
        {vehiclesWithLocation.map((vehicle, index) => {
          const angle = (index / vehiclesWithLocation.length) * 2 * Math.PI
          const radius = 80 + (index % 3) * 40
          const x = Math.cos(angle) * radius
          const y = Math.sin(angle) * radius
          const hasAlerts = vehicle.alerts.length > 0
          const isRented = vehicle.status === 'rented'
          
          return (
            <button
              key={vehicle.id}
              onClick={() => onVehicleSelect(vehicle.id)}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 ${
                selectedVehicle === vehicle.id ? 'scale-125 z-10' : ''
              }`}
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
              title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            >
              <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
                hasAlerts ? 'bg-red-500 animate-pulse' : 
                isRented ? 'bg-blue-500' : 'bg-green-500'
              }`}>
                <Car className="h-3 w-3 text-white" />
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg">
        <p className="text-sm font-medium mb-2">Fleet Status</p>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="default" className="bg-green-500">
            {vehicles.filter(v => v.status === 'available').length} Available
          </Badge>
          <Badge variant="default" className="bg-blue-500">
            {vehicles.filter(v => v.status === 'rented').length} Rented
          </Badge>
          <Badge variant="destructive">
            {vehicles.filter(v => v.alerts.length > 0).length} Alerts
          </Badge>
        </div>
      </div>

      {/* Vehicle count */}
      <div className="absolute top-4 right-4 z-10 bg-background/90 backdrop-blur px-3 py-2 rounded-lg shadow-lg">
        <span className="text-sm font-medium">{vehiclesWithLocation.length} tracked</span>
      </div>
    </div>
  )
}
