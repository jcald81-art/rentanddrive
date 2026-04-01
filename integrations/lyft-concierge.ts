/**
 * Lyft Concierge Integration — Vehicle Delivery (Primary Provider)
 *
 * Lyft Concierge allows businesses to request Lyft rides on behalf of passengers
 * without requiring the passenger to have a Lyft account.
 * RAD uses this as the PRIMARY delivery provider (Uber Direct is fallback).
 *
 * Docs: https://developer.lyft.com/docs/lyft-concierge
 */

const LYFT_API = 'https://api.lyft.com'

export type LyftRideStatus =
  | 'pending'
  | 'accepted'
  | 'arrived'
  | 'pickedUp'
  | 'droppedOff'
  | 'canceled'
  | 'noShow'

export interface LyftRideLocation {
  lat: number
  lng: number
  address?: string
}

export interface LyftPassenger {
  firstName: string
  lastName: string
  phoneNumber: string // E.164 format: +17755551234
}

export interface LyftRide {
  rideId: string
  status: LyftRideStatus
  driver?: {
    firstName: string
    phoneNumber: string
    rating: number
    vehicle: {
      make: string
      model: string
      year: number
      licensePlate: string
      color: string
    }
    location?: LyftRideLocation
  }
  origin: LyftRideLocation
  destination: LyftRideLocation
  passenger: LyftPassenger
  estimatedCost?: { amount: number; currency: string }
  etaSeconds?: number
  createdAt: string
  statusChangedAt: string
}

async function getLyftToken(): Promise<string> {
  const res = await fetch(`${LYFT_API}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.LYFT_CLIENT_ID}:${process.env.LYFT_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: 'grant_type=client_credentials&scope=concierge',
  })
  if (!res.ok) throw new Error(`Lyft auth failed: ${res.status}`)
  const { access_token } = await res.json()
  return access_token
}

/**
 * Get a price estimate before dispatching
 */
export async function getRideEstimate(params: {
  origin: LyftRideLocation
  destination: LyftRideLocation
}): Promise<{ estimatedCost: number; currency: string; etaMinutes: number }> {
  if (!process.env.LYFT_CLIENT_ID) {
    return { estimatedCost: 1800, currency: 'USD', etaMinutes: 15 }
  }

  const token = await getLyftToken()
  const url = new URL(`${LYFT_API}/v1/cost`)
  url.searchParams.set('ride_type', 'lyft')
  url.searchParams.set('start_lat', String(params.origin.lat))
  url.searchParams.set('start_lng', String(params.origin.lng))
  url.searchParams.set('end_lat', String(params.destination.lat))
  url.searchParams.set('end_lng', String(params.destination.lng))

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) return { estimatedCost: 1800, currency: 'USD', etaMinutes: 15 }

  const data = await res.json()
  const costEstimate = data.cost_estimates?.[0]
  return {
    estimatedCost: costEstimate?.estimated_cost_cents_max ?? 1800,
    currency: costEstimate?.currency ?? 'USD',
    etaMinutes: Math.round((costEstimate?.duration_seconds ?? 900) / 60),
  }
}

/**
 * Dispatch a Lyft Concierge ride — no Lyft account needed for the passenger
 */
export async function dispatchRide(params: {
  bookingId: string
  passenger: LyftPassenger
  origin: LyftRideLocation
  destination: LyftRideLocation
  scheduledAt?: Date
}): Promise<LyftRide> {
  if (!process.env.LYFT_CLIENT_ID) {
    // Mock for development
    return {
      rideId: `mock_lyft_${Date.now()}`,
      status: 'pending',
      origin: params.origin,
      destination: params.destination,
      passenger: params.passenger,
      etaSeconds: 900,
      createdAt: new Date().toISOString(),
      statusChangedAt: new Date().toISOString(),
    }
  }

  const token = await getLyftToken()
  const nameParts = params.passenger.firstName.split(' ')

  const body: Record<string, unknown> = {
    ride_type: 'lyft',
    passenger: {
      first_name: nameParts[0],
      last_name: params.passenger.lastName || nameParts[1] || 'Renter',
      phone_number: params.passenger.phoneNumber,
    },
    origin: { lat: params.origin.lat, lng: params.origin.lng },
    destination: {
      lat: params.destination.lat,
      lng: params.destination.lng,
      address: params.destination.address,
    },
  }

  if (params.scheduledAt) {
    body.scheduled_at = params.scheduledAt.toISOString()
  }

  const res = await fetch(`${LYFT_API}/v1/concierge/rides`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`Lyft dispatch failed: ${await res.text()}`)
  const ride = await res.json()

  return {
    rideId: ride.ride_id,
    status: ride.status,
    origin: params.origin,
    destination: params.destination,
    passenger: params.passenger,
    etaSeconds: ride.eta_seconds,
    createdAt: ride.created_at ?? new Date().toISOString(),
    statusChangedAt: ride.status_changed_at ?? new Date().toISOString(),
  }
}

/**
 * Get live ride status + driver location
 */
export async function getRideStatus(rideId: string): Promise<LyftRide> {
  const token = await getLyftToken()
  const res = await fetch(`${LYFT_API}/v1/rides/${rideId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Lyft ride not found: ${rideId}`)
  return res.json()
}

/**
 * Cancel a ride
 */
export async function cancelRide(
  rideId: string,
  reason: 'other' | 'no_show' | 'service_failure' = 'other'
): Promise<void> {
  const token = await getLyftToken()
  await fetch(`${LYFT_API}/v1/rides/${rideId}/cancel`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cancel_reason: reason }),
  })
}
