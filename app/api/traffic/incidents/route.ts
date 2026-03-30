import { NextRequest, NextResponse } from 'next/server'

// TomTom incident type codes
// 0: Unknown, 1: Accident, 2: Fog, 3: Dangerous Conditions, 4: Rain
// 5: Ice, 6: Jam, 7: Lane Closed, 8: Road Closed, 9: Road Works
// 10: Wind, 11: Flooding, 12: Detour, 14: Broken Down Vehicle

// TomTom delay magnitude codes
// 0: Unknown, 1: Minor (<5 min), 2: Moderate (5-10 min)
// 3: Major (10-30 min), 4: Undefined (road closed)

const incidentTypeMap: Record<number, string> = {
  0: 'Unknown',
  1: 'Accident',
  2: 'Fog',
  3: 'Dangerous Conditions',
  4: 'Rain',
  5: 'Ice',
  6: 'Jam',
  7: 'Lane Closed',
  8: 'Road Closed',
  9: 'Road Works',
  10: 'Wind',
  11: 'Flooding',
  12: 'Detour',
  14: 'Broken Down Vehicle'
}

const severityMap: Record<number, 'minor' | 'moderate' | 'major' | 'closed'> = {
  0: 'minor',
  1: 'minor',
  2: 'moderate',
  3: 'major',
  4: 'closed'
}

// Cache for API responses (60 second TTL)
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 60000 // 60 seconds

function getCacheKey(lat: number, lng: number): string {
  // Round to 3 decimal places for cache grouping
  return `${lat.toFixed(3)},${lng.toFixed(3)}`
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = parseFloat(searchParams.get('lat') || '39.5296')
  const lng = parseFloat(searchParams.get('lng') || '-119.8138')
  const radiusMiles = parseFloat(searchParams.get('radiusMiles') || '5')

  // Check cache
  const cacheKey = getCacheKey(lat, lng)
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data)
  }

  try {
    // Try TomTom API if key is available
    if (process.env.TOMTOM_API_KEY) {
      const latDelta = radiusMiles / 69
      const lngDelta = radiusMiles / (69 * Math.cos(lat * Math.PI / 180))
      const bbox = `${lng - lngDelta},${lat - latDelta},${lng + lngDelta},${lat + latDelta}`

      const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${process.env.TOMTOM_API_KEY}&bbox=${bbox}&fields={incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startPoint,endPoint,from,to,length,delay,roadNumbers,timeValidity}}}&language=en-GB&timeValidityFilter=present`

      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        const incidents = normalizeIncidents(data.incidents || [], lat, lng)
        const flowData = await fetchFlowData(lat, lng)

        const result = {
          incidents,
          flowData,
          checkedAt: new Date().toISOString(),
          location: { city: 'Reno', state: 'NV', lat, lng }
        }

        cache.set(cacheKey, { data: result, timestamp: Date.now() })
        console.log(`TomTom API: ${incidents.length} incidents found near ${lat},${lng}`)
        return NextResponse.json(result)
      }
    }

    // Fallback to mock data
    const mockResult = getMockData(lat, lng)
    cache.set(cacheKey, { data: mockResult, timestamp: Date.now() })
    return NextResponse.json(mockResult)

  } catch (error) {
    console.error('Traffic API error:', error)
    // Return empty incidents on error - don't crash rental flow
    return NextResponse.json({
      incidents: [],
      flowData: { currentSpeed: 65, freeFlowSpeed: 65, congestionPercent: 0 },
      checkedAt: new Date().toISOString(),
      location: { city: 'Reno', state: 'NV', lat, lng }
    })
  }
}

function normalizeIncidents(rawIncidents: unknown[], renterLat: number, renterLng: number) {
  if (!Array.isArray(rawIncidents)) return []

  return rawIncidents.map((incident: unknown, index: number) => {
    const inc = incident as Record<string, unknown>
    const props = (inc.properties || {}) as Record<string, unknown>
    const geom = (inc.geometry || {}) as Record<string, unknown>
    const coords = (geom.coordinates as number[][]) || [[renterLng, renterLat]]
    const incidentLat = coords[0]?.[1] || renterLat
    const incidentLng = coords[0]?.[0] || renterLng

    return {
      id: `incident-${index}-${Date.now()}`,
      type: incidentTypeMap[(inc.type as number) || 0] || 'Unknown',
      iconCode: (inc.type as number) || 0,
      severity: severityMap[(props.magnitudeOfDelay as number) || 0] || 'minor',
      description: ((props.events as Array<{ description: string }>)?.[0]?.description) || 'Traffic incident reported',
      road: ((props.roadNumbers as string[]) || ['Unknown Road']).join(', '),
      from: (props.from as string) || '',
      to: (props.to as string) || '',
      delayMinutes: Math.round(((props.delay as number) || 0) / 60),
      distanceMiles: calculateDistance(renterLat, renterLng, incidentLat, incidentLng),
      coordinates: { lat: incidentLat, lng: incidentLng },
      reportedAt: new Date().toISOString(),
      source: 'TomTom'
    }
  }).sort((a, b) => a.distanceMiles - b.distanceMiles)
}

async function fetchFlowData(lat: number, lng: number) {
  if (!process.env.TOMTOM_API_KEY) {
    return { currentSpeed: 58, freeFlowSpeed: 65, congestionPercent: 11 }
  }

  try {
    const flowUrl = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${process.env.TOMTOM_API_KEY}&point=${lat},${lng}`
    const response = await fetch(flowUrl)
    
    if (response.ok) {
      const data = await response.json()
      const flow = data.flowSegmentData || {}
      return {
        currentSpeed: flow.currentSpeed || 65,
        freeFlowSpeed: flow.freeFlowSpeed || 65,
        congestionPercent: Math.round(100 - (flow.currentSpeed / flow.freeFlowSpeed * 100)) || 0
      }
    }
  } catch (error) {
    console.error('Flow data fetch error:', error)
  }

  return { currentSpeed: 58, freeFlowSpeed: 65, congestionPercent: 11 }
}

function getMockData(lat: number, lng: number) {
  // Realistic mock data for Reno/Sparks/Tahoe area
  const mockIncidents = [
    {
      id: 'mock-1',
      type: 'Accident',
      iconCode: 1,
      severity: 'moderate' as const,
      description: 'Multi-vehicle accident — right lane blocked',
      road: 'I-80 Eastbound',
      from: 'Exit 14 (McCarran Blvd)',
      to: 'Exit 15 (Sparks)',
      delayMinutes: 12,
      distanceMiles: 1.4,
      coordinates: { lat: lat + 0.02, lng: lng + 0.03 },
      reportedAt: new Date(Date.now() - 14 * 60000).toISOString(),
      source: 'Mock'
    },
    {
      id: 'mock-2',
      type: 'Road Works',
      iconCode: 9,
      severity: 'minor' as const,
      description: 'Construction zone — reduced speed limit',
      road: 'US-395 Northbound',
      from: 'Moana Lane',
      to: 'Plumb Lane',
      delayMinutes: 5,
      distanceMiles: 2.8,
      coordinates: { lat: lat - 0.03, lng: lng + 0.01 },
      reportedAt: new Date(Date.now() - 45 * 60000).toISOString(),
      source: 'Mock'
    }
  ]

  return {
    incidents: mockIncidents,
    flowData: {
      currentSpeed: 52,
      freeFlowSpeed: 65,
      congestionPercent: 20
    },
    checkedAt: new Date().toISOString(),
    location: { city: 'Reno', state: 'NV', lat, lng }
  }
}
