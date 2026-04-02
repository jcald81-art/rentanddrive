'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Battery, 
  Radio, 
  Clock, 
  MapPin, 
  Calendar, 
  Settings,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  Car
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  trim?: string
  status: string
  listing_status?: string
  daily_rate: number
  location_city?: string
  location_state?: string
  images?: string[]
}

interface BouncieDevice {
  id: string
  vehicle_id: string
  bouncie_device_id: string
  nickname?: string
  is_active: boolean
  last_seen_at?: string
  battery_voltage?: number
}

interface BouncieLocation {
  latitude: number
  longitude: number
  recorded_at: string
}

interface Booking {
  id: string
  vehicle_id: string
  start_date: string
  end_date: string
  status: string
  total_price: number
}

interface FleetVehicleCardProps {
  vehicle: Vehicle
  bouncieDevice?: BouncieDevice | null
  lastLocation?: BouncieLocation | null
  nextBooking?: Booking | null
}

export function FleetVehicleCard({ 
  vehicle, 
  bouncieDevice, 
  lastLocation, 
  nextBooking 
}: FleetVehicleCardProps) {
  const isActive = vehicle.status === 'active' || vehicle.listing_status === 'active'
  const isBooked = vehicle.status === 'booked' || nextBooking?.status === 'confirmed'
  const isInMaintenance = vehicle.status === 'maintenance'
  
  const getStatusBadge = () => {
    if (isBooked) {
      return <Badge className="bg-blue-500/90 text-white">Booked</Badge>
    }
    if (isInMaintenance) {
      return <Badge className="bg-amber-500/90 text-black">In Maintenance</Badge>
    }
    if (isActive) {
      return <Badge className="bg-emerald-500/90 text-white">Available</Badge>
    }
    return <Badge className="bg-gray-500/90 text-white">Inactive</Badge>
  }

  const getDeviceStatus = () => {
    if (!bouncieDevice) {
      return { online: false, label: 'No Device' }
    }
    
    if (!bouncieDevice.last_seen_at) {
      return { online: false, label: 'Never Connected' }
    }
    
    const lastSeen = new Date(bouncieDevice.last_seen_at)
    const minutesAgo = (Date.now() - lastSeen.getTime()) / 1000 / 60
    
    if (minutesAgo < 15) {
      return { online: true, label: 'Online' }
    } else if (minutesAgo < 60) {
      return { online: false, label: `${Math.round(minutesAgo)}m ago` }
    } else {
      return { online: false, label: formatDistanceToNow(lastSeen, { addSuffix: true }) }
    }
  }

  const deviceStatus = getDeviceStatus()
  const thumbnail = vehicle.images?.[0] || '/images/vehicle-placeholder.jpg'
  
  // Calculate battery percentage (12V = 100%, 11V = 0%)
  const batteryPercent = bouncieDevice?.battery_voltage 
    ? Math.min(100, Math.max(0, ((bouncieDevice.battery_voltage - 11) / 1) * 100))
    : null

  return (
    <Card className="bg-[#151c2c] border-white/10 overflow-hidden hover:border-[#D62828]/30 transition-all">
      {/* Vehicle Image */}
      <div className="aspect-[16/10] relative bg-slate-800">
        <img 
          src={thumbnail} 
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 flex gap-2">
          {getStatusBadge()}
        </div>
        
        {/* Bouncie Status Indicator */}
        <div className="absolute top-2 right-2">
          {bouncieDevice ? (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              deviceStatus.online 
                ? 'bg-emerald-500/90 text-white' 
                : 'bg-gray-700/90 text-gray-300'
            }`}>
              {deviceStatus.online ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {deviceStatus.label}
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/90 text-black">
              <AlertTriangle className="h-3 w-3" />
              No Bouncie
            </div>
          )}
        </div>
      </div>
      
      <CardContent className="p-4 space-y-4">
        {/* Vehicle Info */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg text-white">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            {vehicle.trim && (
              <p className="text-sm text-gray-400">{vehicle.trim}</p>
            )}
            <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
              <MapPin className="h-3 w-3" />
              {vehicle.location_city || 'Reno'}, {vehicle.location_state || 'NV'}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-[#D62828]">${vehicle.daily_rate}</p>
            <p className="text-xs text-gray-400">/day</p>
          </div>
        </div>

        {/* Bouncie Device Info */}
        {bouncieDevice && (
          <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Device ID</span>
              <span className="text-white font-mono text-xs">
                {bouncieDevice.bouncie_device_id.slice(0, 8)}...
              </span>
            </div>
            
            {batteryPercent !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-1">
                  <Battery className="h-3 w-3" />
                  Battery
                </span>
                <span className={`font-medium ${
                  batteryPercent > 50 ? 'text-emerald-400' : 
                  batteryPercent > 20 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {Math.round(batteryPercent)}%
                </span>
              </div>
            )}
            
            {lastLocation && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Last Location
                </span>
                <span className="text-white">
                  {lastLocation.latitude.toFixed(4)}, {lastLocation.longitude.toFixed(4)}
                </span>
              </div>
            )}
            
            {bouncieDevice.last_seen_at && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last Update
                </span>
                <span className="text-white">
                  {formatDistanceToNow(new Date(bouncieDevice.last_seen_at), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Next Booking */}
        {nextBooking ? (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Next Booking
            </div>
            <p className="text-white text-sm mt-1">
              {new Date(nextBooking.start_date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })} - {new Date(nextBooking.end_date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              ${nextBooking.total_price?.toLocaleString() || '---'}
            </p>
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <p className="text-gray-400 text-sm">No upcoming bookings</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Link href={`/host/vehicles/${vehicle.id}/availability`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10">
              <Calendar className="h-4 w-4 mr-1" />
              Calendar
            </Button>
          </Link>
          <Link href={`/host/vehicles/${vehicle.id}/settings`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full border-white/20 text-white hover:bg-white/10">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </Link>
          <Link href={`/vehicles/${vehicle.id}`}>
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
