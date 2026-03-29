'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'

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

export default function FleetMap({ vehicles, selectedVehicle, onVehicleSelect }: FleetMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [L, setL] = useState<typeof import('leaflet') | null>(null)

  // Reno, NV center coordinates
  const RENO_CENTER: [number, number] = [39.5296, -119.8138]

  useEffect(() => {
    // Dynamically import Leaflet on client side
    import('leaflet').then((leaflet) => {
      setL(leaflet.default)
      setMapLoaded(true)
    })
  }, [])

  if (!mapLoaded || !L) {
    return (
      <div className="h-[500px] bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  const vehiclesWithLocation = vehicles.filter(v => v.lastLocation || v.device?.last_lat)

  return (
    <div className="h-[500px] relative">
      <MapComponent 
        vehicles={vehiclesWithLocation}
        center={RENO_CENTER}
        selectedVehicle={selectedVehicle}
        onVehicleSelect={onVehicleSelect}
      />
      <div className="absolute bottom-4 left-4 z-[1000] bg-background/90 backdrop-blur p-3 rounded-lg shadow-lg">
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
    </div>
  )
}

// Separate map component to handle Leaflet
function MapComponent({ 
  vehicles, 
  center,
  selectedVehicle,
  onVehicleSelect 
}: { 
  vehicles: VehicleWithDevice[]
  center: [number, number]
  selectedVehicle?: string | null
  onVehicleSelect: (id: string | null) => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Import Leaflet CSS
    import('leaflet/dist/leaflet.css')
  }, [])

  if (!mounted) return null

  // Use dynamic import for react-leaflet
  const { MapContainer, TileLayer, Marker, Popup } = require('react-leaflet')
  const L = require('leaflet')

  // Fix default marker icon issue
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })

  // Custom icons based on status
  const getIcon = (status: string, hasAlerts: boolean) => {
    const color = hasAlerts ? '#ef4444' : status === 'rented' ? '#3b82f6' : '#22c55e'
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })
  }

  return (
    <MapContainer
      center={center}
      zoom={10}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {vehicles.map(vehicle => {
        const lat = vehicle.lastLocation?.lat || vehicle.device?.last_lat
        const lng = vehicle.lastLocation?.lng || vehicle.device?.last_lng
        const speed = vehicle.lastLocation?.speed || vehicle.device?.last_speed_mph || 0
        if (!lat || !lng) return null
        return (
          <Marker
            key={vehicle.id}
            position={[lat, lng]}
            icon={getIcon(vehicle.status, vehicle.alerts.length > 0)}
            eventHandlers={{
              click: () => onVehicleSelect(vehicle.id),
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                <p className="text-muted-foreground">{vehicle.license_plate}</p>
                <p className="mt-1">Speed: {speed} mph</p>
                {vehicle.activeBooking && (
                  <p className="mt-1 text-blue-600">
                    Renter: {vehicle.activeBooking.renter?.full_name || 'Unknown'}
                  </p>
                )}
                <button 
                  onClick={() => onVehicleSelect(vehicle.id)}
                  className="mt-2 text-primary underline text-xs"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
