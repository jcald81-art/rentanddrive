const LYFT_BASE = 'https://api.lyft.com/v1'

interface LyftToken {
  access_token: string
  expires_in: number
  token_type: string
}

export interface LyftRideType {
  ride_type: string
  display_name: string
  estimated_cost_cents_min: number
  estimated_cost_cents_max: number
  estimated_duration_seconds: number
  is_valid_for_pickup: boolean
}

export interface LyftRide {
  ride_id: string
  status: 'pending' | 'accepted' | 'arrived' | 
          'pickedUp' | 'droppedOff' | 'canceled'
  ride_type: string
  pickup: {
    lat: number
    lng: number
    address: string
    eta_seconds: number
  }
  destination: {
    lat: number
    lng: number
    address: string
    eta_seconds: number
  }
  driver?: {
    first_name: string
    phone_number: string
    rating: string
    vehicle: {
      make: string
      model: string
      license_plate: string
      color: string
    }
    location: {
      lat: number
      lng: number
      bearing: number
    }
  }
  price_quote?: {
    estimated_cost_cents_min: number
    estimated_cost_cents_max: number
    estimated_distance_miles: number
    estimated_duration_seconds: number
    primetime_percentage: string
    currency: string
  }
  receipt?: {
    total_charged_amount: string
    currency: string
    charges: Array<{
      amount: string
      currency: string
      payment_method: string
    }>
  }
}

async function getLyftToken(): Promise<string> {
  const response = await fetch(`${LYFT_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(
        `${process.env.LYFT_CLIENT_ID}:${process.env.LYFT_CLIENT_SECRET}`
      ).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'rides.request public',
    }),
  })
  const data: LyftToken = await response.json()
  return data.access_token
}

// Get available ride types and pricing
export async function getRideEstimate(
  pickup_lat: number,
  pickup_lng: number,
  dropoff_lat: number,
  dropoff_lng: number
): Promise<LyftRideType[]> {
  const token = await getLyftToken()
  const response = await fetch(
    `${LYFT_BASE}/cost?ride_type=lyft&start_lat=${pickup_lat}` +
    `&start_lng=${pickup_lng}&end_lat=${dropoff_lat}&end_lng=${dropoff_lng}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  )
  const data = await response.json()
  return data.cost_estimates || []
}

// Get driver ETA
export async function getDriverETA(
  lat: number,
  lng: number
): Promise<number> {
  const token = await getLyftToken()
  const response = await fetch(
    `${LYFT_BASE}/eta?lat=${lat}&lng=${lng}&ride_type=lyft`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  )
  const data = await response.json()
  return data.eta_estimates?.[0]?.eta_seconds || 300
}

// Book a ride via Concierge (no Lyft account needed)
export async function bookConciergeRide({
  passenger_first_name,
  passenger_last_name,
  passenger_phone,
  pickup_lat,
  pickup_lng,
  pickup_address,
  dropoff_lat,
  dropoff_lng,
  dropoff_address,
  scheduled_at,
  booking_id,
  ride_type = 'lyft',
}: {
  passenger_first_name: string
  passenger_last_name: string
  passenger_phone: string
  pickup_lat: number
  pickup_lng: number
  pickup_address: string
  dropoff_lat: number
  dropoff_lng: number
  dropoff_address: string
  scheduled_at?: string
  booking_id: string
  ride_type?: string
}): Promise<LyftRide> {
  const token = await getLyftToken()

  const body: Record<string, unknown> = {
    ride_type,
    origin: {
      lat: pickup_lat,
      lng: pickup_lng,
      address: pickup_address,
    },
    destination: {
      lat: dropoff_lat,
      lng: dropoff_lng,
      address: dropoff_address,
    },
    passenger: {
      first_name: passenger_first_name,
      last_name: passenger_last_name,
      phone_number: passenger_phone,
    },
  }

  if (scheduled_at) {
    body.scheduled_at = scheduled_at
  }

  const response = await fetch(`${LYFT_BASE}/rides`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`Lyft booking error: ${err.detail || err.error}`)
  }

  return response.json()
}

// Get ride status
export async function getRideStatus(ride_id: string): Promise<LyftRide> {
  const token = await getLyftToken()
  const response = await fetch(`${LYFT_BASE}/rides/${ride_id}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  return response.json()
}

// Cancel ride
export async function cancelRide(ride_id: string): Promise<void> {
  const token = await getLyftToken()
  await fetch(`${LYFT_BASE}/rides/${ride_id}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cancel_confirmation: true }),
  })
}
