'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertPreferencesQuickPanel } from '@/components/AlertPreferencesQuickPanel'
import { TrafficCone, AlertTriangle, Settings, Navigation, ChevronRight } from 'lucide-react'

interface Incident {
  id: string
  type: string
  severity: 'minor' | 'moderate' | 'major' | 'closed'
  description: string
  road: string
  delayMinutes: number
  distanceMiles: number
  coordinates: { lat: number; lng: number }
}

interface DriveTrafficBannerProps {
  incidents: Incident[]
  rentalId: string
  currentLocation?: { lat: number; lng: number }
}

export function DriveTrafficBanner({ incidents, rentalId, currentLocation }: DriveTrafficBannerProps) {
  const [showSettings, setShowSettings] = useState(false)

  const hasMajor = incidents.some(i => i.severity === 'major' || i.severity === 'closed')
  const hasIncidents = incidents.length > 0

  const getAlternateRoute = () => {
    if (!currentLocation || !incidents[0]) return
    const incident = incidents[0]
    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${incident.coordinates.lat},${incident.coordinates.lng}&travelmode=driving`
    window.open(url, '_blank')
  }

  // Clear - subtle green
  if (!hasIncidents) {
    return (
      <>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-green-400">DriveTraffic — Clear roads ahead</span>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="text-gray-400 hover:text-white"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
        <AlertPreferencesQuickPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </>
    )
  }

  // Major incident - red pulsing
  if (hasMajor) {
    const majorIncident = incidents.find(i => i.severity === 'major' || i.severity === 'closed')
    return (
      <>
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="text-sm font-semibold text-red-400">
                MAJOR INCIDENT — {majorIncident?.type || 'Road closure'} ahead
              </span>
            </div>
            <button 
              onClick={() => setShowSettings(true)}
              className="text-gray-400 hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Link href={`/rental/${rentalId}/traffic`}>
              <Button size="sm" variant="outline" className="text-xs border-red-500/50 text-red-400 hover:bg-red-500/10">
                View Details
              </Button>
            </Link>
            <Button 
              size="sm" 
              onClick={getAlternateRoute}
              className="text-xs bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90"
            >
              <Navigation className="h-3 w-3 mr-1" />
              Reroute
            </Button>
          </div>
        </div>
        <AlertPreferencesQuickPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </>
    )
  }

  // Minor incidents - yellow
  return (
    <>
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrafficCone className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-yellow-400">
              Minor delays reported — {incidents.length} incident{incidents.length > 1 ? 's' : ''} ahead
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/rental/${rentalId}/traffic`} className="text-yellow-400 hover:text-yellow-300 text-sm flex items-center">
              View <ChevronRight className="h-4 w-4" />
            </Link>
            <button 
              onClick={() => setShowSettings(true)}
              className="text-gray-400 hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <AlertPreferencesQuickPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  )
}
