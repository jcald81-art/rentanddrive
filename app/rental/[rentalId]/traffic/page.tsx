'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertPreferencesQuickPanel } from '@/components/AlertPreferencesQuickPanel'
import { RefreshCw, Settings, Car, Construction, TrafficCone, AlertTriangle, Navigation, Clock, MapPin, ChevronDown, ChevronUp, ExternalLink, BellOff } from 'lucide-react'

interface Incident {
  id: string
  type: string
  iconCode: number
  severity: 'minor' | 'moderate' | 'major' | 'closed'
  description: string
  road: string
  from: string
  to: string
  delayMinutes: number
  distanceMiles: number
  coordinates: { lat: number; lng: number }
  reportedAt: string
  source: string
}

interface TrafficData {
  incidents: Incident[]
  flowData: {
    currentSpeed: number
    freeFlowSpeed: number
    congestionPercent: number
  }
  checkedAt: string
  location: { city: string; state: string; lat: number; lng: number }
}

const severityColors = {
  minor: { bg: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500' },
  moderate: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500' },
  major: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
  closed: { bg: 'bg-red-600', text: 'text-red-600', border: 'border-red-600' }
}

const incidentIcons: Record<string, React.ElementType> = {
  'Accident': Car,
  'Road Closed': Construction,
  'Road Works': Construction,
  'Jam': TrafficCone,
  'Lane Closed': TrafficCone,
  'Broken Down Vehicle': Car,
  'default': AlertTriangle
}

export default function DriveTrafficPage() {
  const params = useParams()
  const rentalId = params.rentalId as string
  
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [incidentHistory] = useState<Incident[]>([])

  useEffect(() => {
    fetchTrafficData()
    const interval = setInterval(fetchTrafficData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchTrafficData = async () => {
    try {
      // Get current position (in production, get from Bouncie)
      const lat = 39.5296;
      const lng = -119.8138;
      
      const res = await fetch(`/api/traffic/incidents?lat=${lat}&lng=${lng}&radiusMiles=5`)
      if (res.ok) {
        const data = await res.json()
        setTrafficData(data)
      }
    } catch (error) {
      console.error('Failed to fetch traffic data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchTrafficData()
  }

  const getAlternateRoute = (incident: Incident) => {
    const origin = trafficData?.location
    if (!origin) return
    // Open Google Maps with alternate route
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${incident.coordinates.lat},${incident.coordinates.lng}&travelmode=driving`
    window.open(url, '_blank')
  }

  const getOverallStatus = () => {
    if (!trafficData?.incidents.length) {
      return { status: 'clear', message: 'Clear Ahead — No incidents in your area', color: 'text-green-500', bgColor: 'bg-green-500/10' }
    }
    const hasMajor = trafficData.incidents.some(i => i.severity === 'major' || i.severity === 'closed')
    if (hasMajor) {
      return { status: 'major', message: 'Major Incident — Road closure ahead, reroute recommended', color: 'text-red-500', bgColor: 'bg-red-500/10' }
    }
    return { status: 'minor', message: `Minor Delays — ${trafficData.incidents.length} incident${trafficData.incidents.length > 1 ? 's' : ''} reported ahead`, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' }
  }

  const formatTimeAgo = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    return `${Math.floor(minutes / 60)} hr ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#FFD84D]" />
      </div>
    )
  }

  const overallStatus = getOverallStatus()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <TrafficCone className="h-5 w-5 text-[#FFD84D]" />
              DriveTraffic — Live Conditions
            </h1>
            {trafficData?.location && (
              <p className="text-sm font-mono text-gray-400 mt-1">
                {trafficData.location.city}, {trafficData.location.state}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {trafficData?.checkedAt && formatTimeAgo(trafficData.checkedAt)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="text-gray-400 hover:text-white"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Current Route Status */}
        <Card className={`mb-6 border-0 ${overallStatus.bgColor}`}>
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${
                overallStatus.status === 'clear' ? 'bg-green-500' :
                overallStatus.status === 'minor' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <p className={`text-lg font-semibold ${overallStatus.color}`}>
                {overallStatus.message}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Traffic Flow */}
        {trafficData?.flowData && (
          <Card className="bg-[#1a1a1a] border-gray-800 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Current Traffic Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 mb-3">
                <div>
                  <span className="text-3xl font-mono font-bold text-white">
                    {trafficData.flowData.currentSpeed}
                  </span>
                  <span className="text-gray-500 ml-1">mph</span>
                </div>
                <div className="text-sm text-gray-500">
                  Normal: <span className="font-mono">{trafficData.flowData.freeFlowSpeed}</span> mph
                </div>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    trafficData.flowData.congestionPercent < 30 ? 'bg-green-500' :
                    trafficData.flowData.congestionPercent < 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${100 - trafficData.flowData.congestionPercent}%` }}
                />
              </div>
              {trafficData.flowData.congestionPercent > 20 && (
                <p className="text-sm text-red-400 mt-2">
                  Slowdown: {trafficData.flowData.congestionPercent}%
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Active Incidents */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Active Incidents</h2>
          {trafficData?.incidents.length === 0 ? (
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                  <Navigation className="h-6 w-6 text-green-500" />
                </div>
                <p className="text-gray-400">No incidents reported in your area</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {trafficData?.incidents.map((incident) => {
                const IconComponent = incidentIcons[incident.type] || incidentIcons.default
                const colors = severityColors[incident.severity]
                
                return (
                  <Card key={incident.id} className={`bg-[#1a1a1a] border-l-4 ${colors.border} border-t-0 border-r-0 border-b-0`}>
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${colors.bg}/10`}>
                          <IconComponent className={`h-5 w-5 ${colors.text}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`${colors.text} border-current font-mono text-xs`}>
                              {incident.type}
                            </Badge>
                            {incident.delayMinutes > 0 && (
                              <span className="text-red-400 font-mono text-sm">
                                +{incident.delayMinutes} min
                              </span>
                            )}
                          </div>
                          <p className="text-white font-medium">{incident.road}</p>
                          <p className="text-sm text-gray-400 mt-1">{incident.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="font-mono">{incident.distanceMiles.toFixed(1)}</span> mi ahead
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(incident.reportedAt)}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={() => getAlternateRoute(incident)}
                              className="bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90 text-xs"
                            >
                              <Navigation className="h-3 w-3 mr-1" />
                              Get Alternate Route
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-400 hover:text-white text-xs"
                            >
                              <BellOff className="h-3 w-3 mr-1" />
                              Snooze
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Map Placeholder */}
        <Card className="bg-[#1a1a1a] border-blue-500/30 mb-6">
          <CardContent className="py-12 text-center">
            <div className="border-2 border-dashed border-blue-500/30 rounded-lg p-8">
              <MapPin className="h-8 w-8 text-blue-500/50 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Live Traffic Map</p>
              <p className="text-xs text-gray-600 mt-1">Integrate TomTom Maps SDK or Google Maps JS API</p>
              <a
                href={`https://www.google.com/maps/@${trafficData?.location.lat || 39.5296},${trafficData?.location.lng || -119.8138},13z/data=!5m1!1e1`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#FFD84D] text-sm mt-3 hover:underline"
              >
                Open in Google Maps <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Incident History */}
        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardHeader 
            className="cursor-pointer"
            onClick={() => setShowHistory(!showHistory)}
          >
            <CardTitle className="text-sm text-gray-400 flex items-center justify-between">
              Incident History (This Rental)
              {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
          {showHistory && (
            <CardContent>
              {incidentHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No incidents encountered yet</p>
              ) : (
                <div className="space-y-2">
                  {incidentHistory.map((incident) => (
                    <div key={incident.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div>
                        <span className="text-sm text-white">{incident.type}</span>
                        <span className="text-xs text-gray-500 ml-2">{incident.road}</span>
                      </div>
                      <span className="text-xs font-mono text-gray-500">
                        +{incident.delayMinutes} min
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Alert Preferences Panel */}
        <AlertPreferencesQuickPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      </div>
    </div>
  )
}
