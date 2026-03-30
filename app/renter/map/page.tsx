'use client'

import { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import {
  MapPin, Mountain, Car, Utensils, Hotel, Camera, Navigation,
  Calendar, Share2, ChevronDown, Snowflake, AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarUI } from '@/components/ui/calendar'
import { toast } from 'sonner'
import type { DateRange } from 'react-day-picker'

interface MapMarker {
  id: string
  type: 'vehicle' | 'resort' | 'restaurant' | 'hotel' | 'attraction'
  name: string
  lat: number
  lng: number
  details?: string
}

const SKI_RESORTS: MapMarker[] = [
  { id: 'palisades', type: 'resort', name: 'Palisades Tahoe', lat: 39.1969, lng: -120.2357, details: 'Base: 6200ft' },
  { id: 'heavenly', type: 'resort', name: 'Heavenly', lat: 38.9353, lng: -119.9400, details: 'Base: 6540ft' },
  { id: 'northstar', type: 'resort', name: 'Northstar', lat: 39.2746, lng: -120.1210, details: 'Base: 6330ft' },
  { id: 'kirkwood', type: 'resort', name: 'Kirkwood', lat: 38.6850, lng: -120.0654, details: 'Base: 7800ft' },
  { id: 'mtrose', type: 'resort', name: 'Mt Rose', lat: 39.3149, lng: -119.8855, details: 'Base: 8260ft' },
]

const ATTRACTIONS: MapMarker[] = [
  { id: 'emerald', type: 'attraction', name: 'Emerald Bay', lat: 38.9534, lng: -120.1096, details: 'Scenic viewpoint' },
  { id: 'bonsai', type: 'attraction', name: 'Bonsai Rock', lat: 39.1890, lng: -119.9285, details: 'Photo spot' },
  { id: 'sand', type: 'attraction', name: 'Sand Harbor', lat: 39.1981, lng: -119.9305, details: 'Beach access' },
]

export default function MapRoomPage() {
  const [mounted, setMounted] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [showVehicles, setShowVehicles] = useState(true)
  const [showResorts, setShowResorts] = useState(true)
  const [showAttractions, setShowAttractions] = useState(true)
  const [showChainControl, setShowChainControl] = useState(true)
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)
  const [vehicles, setVehicles] = useState<MapMarker[]>([])

  // Distance from Reno to Tahoe
  const RENO_TO_TAHOE_MILES = 45
  const RENO_TO_TAHOE_TIME = '~1 hour'

  useEffect(() => {
    setMounted(true)
    const tomorrow = addDays(new Date(), 1)
    setDateRange({ from: tomorrow, to: addDays(tomorrow, 3) })

    // Mock vehicle locations
    setVehicles([
      { id: 'v1', type: 'vehicle', name: '2023 Toyota 4Runner', lat: 39.5296, lng: -119.8138, details: '$89/day' },
      { id: 'v2', type: 'vehicle', name: '2024 Jeep Wrangler', lat: 39.5150, lng: -119.7950, details: '$95/day' },
      { id: 'v3', type: 'vehicle', name: '2023 Ford Bronco', lat: 39.5400, lng: -119.8300, details: '$99/day' },
    ])
  }, [])

  const shareRoute = () => {
    const url = `${window.location.origin}/renter/map?from=reno&to=tahoe`
    navigator.clipboard.writeText(url)
    toast.success('Route link copied to clipboard!')
  }

  const isWinter = () => {
    const month = new Date().getMonth()
    return month >= 10 || month <= 3 // Nov - April
  }

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'vehicle': return '#CC0000'
      case 'resort': return '#3b82f6'
      case 'attraction': return '#22c55e'
      case 'restaurant': return '#f59e0b'
      case 'hotel': return '#8b5cf6'
      default: return '#64748b'
    }
  }

  const MarkerIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'vehicle': return <Car className="h-4 w-4" />
      case 'resort': return <Mountain className="h-4 w-4" />
      case 'attraction': return <Camera className="h-4 w-4" />
      case 'restaurant': return <Utensils className="h-4 w-4" />
      case 'hotel': return <Hotel className="h-4 w-4" />
      default: return <MapPin className="h-4 w-4" />
    }
  }

  const allMarkers: MapMarker[] = [
    ...(showVehicles ? vehicles : []),
    ...(showResorts ? SKI_RESORTS : []),
    ...(showAttractions ? ATTRACTIONS : []),
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Map Container */}
      <div className="relative h-[60vh] md:h-[70vh] bg-slate-800">
        {/* Placeholder Map */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />

          {/* Reno marker */}
          <div className="absolute top-[60%] left-[30%] -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 rounded-full bg-[#CC0000] flex items-center justify-center shadow-lg">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium text-white bg-black/50 px-2 py-0.5 rounded mt-1">Reno</span>
            </div>
          </div>

          {/* Tahoe marker */}
          <div className="absolute top-[35%] left-[60%] -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                <Mountain className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium text-white bg-black/50 px-2 py-0.5 rounded mt-1">Lake Tahoe</span>
            </div>
          </div>

          {/* Route line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line
              x1="30%"
              y1="60%"
              x2="60%"
              y2="35%"
              stroke="#CC0000"
              strokeWidth="3"
              strokeDasharray="8 4"
              opacity="0.7"
            />
          </svg>

          {/* Vehicle markers */}
          {showVehicles && vehicles.map((v, i) => (
            <button
              key={v.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
              style={{ top: `${55 + i * 5}%`, left: `${25 + i * 8}%` }}
              onClick={() => setSelectedMarker(v)}
            >
              <div className="h-6 w-6 rounded-full bg-[#CC0000] flex items-center justify-center shadow-lg border-2 border-white">
                <Car className="h-3 w-3 text-white" />
              </div>
            </button>
          ))}

          {/* Resort markers */}
          {showResorts && SKI_RESORTS.slice(0, 3).map((r, i) => (
            <button
              key={r.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
              style={{ top: `${30 + i * 8}%`, left: `${55 + i * 10}%` }}
              onClick={() => setSelectedMarker(r)}
            >
              <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg border-2 border-white">
                <Mountain className="h-3 w-3 text-white" />
              </div>
            </button>
          ))}

          {/* Chain Control Overlay */}
          {showChainControl && isWinter() && (
            <div className="absolute top-[45%] left-[45%] w-32 h-20 bg-amber-500/20 border-2 border-amber-500 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Snowflake className="h-5 w-5 text-amber-400 mx-auto" />
                <span className="text-xs text-amber-400 font-medium">R2 Chain Control</span>
              </div>
            </div>
          )}
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2">
          <div className="flex items-center gap-2 bg-black/80 backdrop-blur px-3 py-2 rounded-lg">
            <Checkbox 
              id="vehicles"
              checked={showVehicles} 
              onCheckedChange={(c) => setShowVehicles(!!c)}
              className="border-slate-500 data-[state=checked]:bg-[#CC0000]"
            />
            <label htmlFor="vehicles" className="text-sm text-white cursor-pointer flex items-center gap-1">
              <Car className="h-3 w-3 text-[#CC0000]" /> Vehicles
            </label>
          </div>
          <div className="flex items-center gap-2 bg-black/80 backdrop-blur px-3 py-2 rounded-lg">
            <Checkbox 
              id="resorts"
              checked={showResorts} 
              onCheckedChange={(c) => setShowResorts(!!c)}
              className="border-slate-500 data-[state=checked]:bg-blue-500"
            />
            <label htmlFor="resorts" className="text-sm text-white cursor-pointer flex items-center gap-1">
              <Mountain className="h-3 w-3 text-blue-500" /> Resorts
            </label>
          </div>
          <div className="flex items-center gap-2 bg-black/80 backdrop-blur px-3 py-2 rounded-lg">
            <Checkbox 
              id="attractions"
              checked={showAttractions} 
              onCheckedChange={(c) => setShowAttractions(!!c)}
              className="border-slate-500 data-[state=checked]:bg-green-500"
            />
            <label htmlFor="attractions" className="text-sm text-white cursor-pointer flex items-center gap-1">
              <Camera className="h-3 w-3 text-green-500" /> Attractions
            </label>
          </div>
          {isWinter() && (
            <div className="flex items-center gap-2 bg-black/80 backdrop-blur px-3 py-2 rounded-lg">
              <Checkbox 
                id="chains"
                checked={showChainControl} 
                onCheckedChange={(c) => setShowChainControl(!!c)}
                className="border-slate-500 data-[state=checked]:bg-amber-500"
              />
              <label htmlFor="chains" className="text-sm text-white cursor-pointer flex items-center gap-1">
                <Snowflake className="h-3 w-3 text-amber-500" /> Chain Zones
              </label>
            </div>
          )}
        </div>

        {/* Selected Marker Info */}
        {selectedMarker && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80">
            <Card className="bg-black/90 backdrop-blur border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-10 w-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: getMarkerColor(selectedMarker.type) }}
                    >
                      <MarkerIcon type={selectedMarker.type} />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{selectedMarker.name}</p>
                      {selectedMarker.details && (
                        <p className="text-sm text-slate-400">{selectedMarker.details}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedMarker(null)} className="text-slate-500 hover:text-white">
                    ✕
                  </button>
                </div>
                {selectedMarker.type === 'vehicle' && (
                  <Button className="w-full mt-3 bg-[#CC0000] hover:bg-[#AA0000]">
                    View Vehicle
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Trip Planner */}
      <div className="p-4 md:p-6 space-y-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Navigation className="h-5 w-5 text-[#CC0000]" />
              Trip Planner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-slate-800 border-slate-700 text-white"
                  >
                    <Calendar className="mr-2 h-4 w-4 text-[#CC0000]" />
                    {mounted && dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                        </>
                      ) : (
                        format(dateRange.from, 'MMM d, yyyy')
                      )
                    ) : (
                      'Select dates'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700">
                  <CalendarUI
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    disabled={{ before: new Date() }}
                  />
                </PopoverContent>
              </Popover>

              <Button className="bg-[#CC0000] hover:bg-[#AA0000]">
                Find Vehicles Along Route
              </Button>

              <Button variant="outline" className="border-slate-700 text-slate-300" onClick={shareRoute}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Route
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Distance Calculator */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Reno to Lake Tahoe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#CC0000]">{RENO_TO_TAHOE_MILES}</p>
                <p className="text-sm text-slate-400">miles</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">{RENO_TO_TAHOE_TIME}</p>
                <p className="text-sm text-slate-400">drive time</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">I-80 / US-50</p>
                <p className="text-sm text-slate-400">routes</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                {isWinter() ? (
                  <>
                    <Badge className="bg-amber-500 mb-1">
                      <Snowflake className="h-3 w-3 mr-1" />
                      R2
                    </Badge>
                    <p className="text-sm text-slate-400">chain control</p>
                  </>
                ) : (
                  <>
                    <Badge className="bg-green-500 mb-1">Clear</Badge>
                    <p className="text-sm text-slate-400">road conditions</p>
                  </>
                )}
              </div>
            </div>

            {isWinter() && (
              <div className="mt-4 flex items-start gap-3 bg-amber-900/20 border border-amber-700 rounded-lg p-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-400">Winter Driving Notice</p>
                  <p className="text-xs text-amber-300/80">
                    Chain controls may be in effect. AWD/4WD recommended for Tahoe trips November through April.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ski Resorts */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Mountain className="h-5 w-5 text-blue-500" />
              Tahoe Ski Resorts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {SKI_RESORTS.map(resort => (
                <button
                  key={resort.id}
                  className="bg-slate-800 hover:bg-slate-700 rounded-lg p-3 text-left transition-colors"
                  onClick={() => setSelectedMarker(resort)}
                >
                  <p className="font-medium text-white text-sm">{resort.name}</p>
                  <p className="text-xs text-slate-400">{resort.details}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
