// Uses Google Maps Geocoding API
// Add GOOGLE_MAPS_API_KEY to Vercel env vars

export interface GeoLocation {
  lat: number
  lng: number
  formatted_address: string
}

const geocodeCache = new Map<string, GeoLocation>()

export async function geocodeAddress(
  address: string
): Promise<GeoLocation> {
  if (geocodeCache.has(address)) {
    return geocodeCache.get(address)!
  }

  const encoded = encodeURIComponent(address)
  const url = `https://maps.googleapis.com/maps/api/geocode/json` +
    `?address=${encoded}&key=${process.env.GOOGLE_MAPS_API_KEY}`

  const response = await fetch(url)
  const data = await response.json()

  if (data.status !== 'OK' || !data.results[0]) {
    throw new Error(`Geocoding failed for: ${address}`)
  }

  const result: GeoLocation = {
    lat: data.results[0].geometry.location.lat,
    lng: data.results[0].geometry.location.lng,
    formatted_address: data.results[0].formatted_address,
  }

  geocodeCache.set(address, result)
  return result
}

// Reverse geocode lat/lng to address
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string> {
  const cacheKey = `${lat},${lng}`
  
  const url = `https://maps.googleapis.com/maps/api/geocode/json` +
    `?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`

  const response = await fetch(url)
  const data = await response.json()

  if (data.status !== 'OK' || !data.results[0]) {
    throw new Error(`Reverse geocoding failed for: ${lat},${lng}`)
  }

  return data.results[0].formatted_address
}

// Calculate distance between two points (Haversine formula)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
