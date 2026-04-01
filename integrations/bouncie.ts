/**
 * Bouncie Integration — RADar Fleet Tracking
 *
 * Real-time GPS tracking, geofencing, and diagnostics via Bouncie OBD2 devices.
 * Each RAD vehicle has a Bouncie device plugged into the OBD2 port under the dashboard.
 *
 * Docs: https://developer.bouncie.com
 */

const BOUNCIE_API = 'https://api.bouncie.com/v1'

export interface BouncieVehicle {
  imei: string
  nickName: string
  make: string
  model: string
  year: number
  vin: string
  stats: {
    isTracking: boolean
    lastUpdated: string
    location: { lat: number; lon: number }
    speed: number
    mil: boolean // check engine light
    battery: { status: string }
    fuelLevel?: number
    odometer?: number
  }
}

export interface BouncieTrip {
  transactionId: string
  imei: string
  startTime: string
  endTime: string
  distance: number
  hardBrakes: number
  hardAccelerations: number
  speeding: number
  path: Array<{ lat: number; lon: number; timestamp: string }>
}

export interface GeofenceEvent {
  imei: string
  type: 'entry' | 'exit'
  geofenceName: string
  timestamp: string
  location: { lat: number; lon: number }
}

// Pre-defined RAD geofence zones
export const RAD_GEOFENCES = {
  RNO_AIRPORT: {
    name: 'Reno-Tahoe International Airport',
    lat: 39.4991,
    lon: -119.7681,
    radius: 1500, // meters
  },
  DOWNTOWN_RENO: {
    name: 'Downtown Reno',
    lat: 39.5296,
    lon: -119.8138,
    radius: 3000,
  },
  LAKE_TAHOE_NORTH: {
    name: 'North Lake Tahoe',
    lat: 39.2403,
    lon: -119.9829,
    radius: 8000,
  },
  LAKE_TAHOE_SOUTH: {
    name: 'South Lake Tahoe',
    lat: 38.9399,
    lon: -119.9772,
    radius: 8000,
  },
  SPARKS: {
    name: 'Sparks, NV',
    lat: 39.5349,
    lon: -119.7527,
    radius: 5000,
  },
}

async function getBouncieToken(): Promise<string> {
  if (process.env.BOUNCIE_ACCESS_TOKEN) {
    return process.env.BOUNCIE_ACCESS_TOKEN
  }
  throw new Error('BOUNCIE_ACCESS_TOKEN not configured')
}

/**
 * Get all Bouncie vehicles associated with the RAD account
 */
export async function getAllVehicles(): Promise<BouncieVehicle[]> {
  const token = await getBouncieToken()
  const res = await fetch(`${BOUNCIE_API}/vehicles`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 30 },
  })
  if (!res.ok) throw new Error(`Bouncie API error: ${res.status}`)
  return res.json()
}

/**
 * Get live vehicle stats by IMEI
 */
export async function getVehicleStats(imei: string): Promise<BouncieVehicle> {
  const token = await getBouncieToken()
  const res = await fetch(`${BOUNCIE_API}/vehicles?imei=${imei}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 10 },
  })
  if (!res.ok) throw new Error(`Bouncie vehicle not found: ${imei}`)
  const vehicles = await res.json()
  return vehicles[0]
}

/**
 * Get trip history for a vehicle (last N days)
 */
export async function getVehicleTrips(
  imei: string,
  days = 30
): Promise<BouncieTrip[]> {
  const token = await getBouncieToken()
  const gteDate = new Date()
  gteDate.setDate(gteDate.getDate() - days)

  const res = await fetch(
    `${BOUNCIE_API}/trips?imei=${imei}&gps-format=polyline&gte=${gteDate.toISOString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    }
  )
  if (!res.ok) throw new Error(`Failed to fetch trips for ${imei}`)
  return res.json()
}

/**
 * Create or update a geofence for a vehicle
 */
export async function upsertGeofence(params: {
  imei: string
  name: string
  lat: number
  lon: number
  radius: number
  type: 'circle'
}): Promise<void> {
  const token = await getBouncieToken()
  await fetch(`${BOUNCIE_API}/geofences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imei: params.imei,
      name: params.name,
      type: params.type,
      center: { lat: params.lat, lon: params.lon },
      radius: params.radius,
    }),
  })
}

/**
 * Set up standard RAD geofences for a newly onboarded vehicle
 */
export async function setupRADGeofences(imei: string): Promise<void> {
  for (const [, zone] of Object.entries(RAD_GEOFENCES)) {
    await upsertGeofence({
      imei,
      name: zone.name,
      lat: zone.lat,
      lon: zone.lon,
      radius: zone.radius,
      type: 'circle',
    })
  }
}

/**
 * Check if a vehicle is currently within any RAD geofence zone
 */
export function checkGeofenceStatus(
  lat: number,
  lon: number
): { inZone: boolean; zone: string | null } {
  for (const [, zone] of Object.entries(RAD_GEOFENCES)) {
    const R = 6371000 // Earth radius in meters
    const dLat = ((lat - zone.lat) * Math.PI) / 180
    const dLon = ((lon - zone.lon) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((zone.lat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    if (distance <= zone.radius) {
      return { inZone: true, zone: zone.name }
    }
  }
  return { inZone: false, zone: null }
}
