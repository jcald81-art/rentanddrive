/**
 * Uber Direct Integration — Vehicle Delivery
 *
 * Uses the Uber Direct (Uber Eats Delivery API) to dispatch couriers for
 * vehicle delivery and pickup. Lyft Concierge is the primary provider;
 * Uber Direct is the fallback.
 *
 * Docs: https://developer.uber.com/docs/deliveries
 */

const UBER_DIRECT_API = 'https://api.uber.com/v1/eats/deliveries'

export interface UberDeliveryQuote {
  quoteId: string
  externalId: string
  fee: number
  currency: string
  dropoffEta: string
  pickupEta: string
  expires: string
}

export interface UberDelivery {
  id: string
  externalId: string
  status: 'pending' | 'pickup' | 'pickup_complete' | 'dropoff' | 'delivered' | 'cancelled' | 'returned'
  trackingUrl: string
  courier?: {
    name: string
    phone: string
    photoUrl: string
    vehicleType: string
    latitude: number
    longitude: number
  }
  pickup: UberDeliveryLocation
  dropoff: UberDeliveryLocation
  fee: number
  currency: string
  createdAt: string
  updatedAt: string
}

export interface UberDeliveryLocation {
  name: string
  address: string
  address2?: string
  city: string
  state: string
  zip: string
  country: string
  lat: number
  lng: number
  phone?: string
  instructions?: string
  externalStoreId?: string
}

async function getUberToken(): Promise<string> {
  const res = await fetch('https://auth.uber.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.UBER_DIRECT_CLIENT_ID!,
      client_secret: process.env.UBER_DIRECT_CLIENT_SECRET!,
      grant_type: 'client_credentials',
      scope: 'eats.deliveries',
    }),
  })
  if (!res.ok) throw new Error(`Uber auth failed: ${res.status}`)
  const { access_token } = await res.json()
  return access_token
}

function uberHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Get a delivery quote before confirming
 */
export async function getDeliveryQuote(params: {
  bookingId: string
  pickup: UberDeliveryLocation
  dropoff: UberDeliveryLocation
}): Promise<UberDeliveryQuote> {
  if (!process.env.UBER_DIRECT_CLIENT_ID) {
    // Return mock quote in development
    return {
      quoteId: `mock_quote_${Date.now()}`,
      externalId: params.bookingId,
      fee: 1500, // $15.00 in cents
      currency: 'USD',
      dropoffEta: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      pickupEta: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      expires: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }
  }

  const token = await getUberToken()
  const res = await fetch(`${UBER_DIRECT_API}/quotes`, {
    method: 'POST',
    headers: uberHeaders(token),
    body: JSON.stringify({
      external_id: params.bookingId,
      pickup_address: `${params.pickup.address}, ${params.pickup.city}, ${params.pickup.state} ${params.pickup.zip}`,
      pickup_latitude: params.pickup.lat,
      pickup_longitude: params.pickup.lng,
      dropoff_address: `${params.dropoff.address}, ${params.dropoff.city}, ${params.dropoff.state} ${params.dropoff.zip}`,
      dropoff_latitude: params.dropoff.lat,
      dropoff_longitude: params.dropoff.lng,
      pickup_phone_number: params.pickup.phone,
    }),
  })

  if (!res.ok) throw new Error(`Uber quote failed: ${await res.text()}`)
  const data = await res.json()

  return {
    quoteId: data.id,
    externalId: params.bookingId,
    fee: data.fee,
    currency: data.currency,
    dropoffEta: data.dropoff_eta,
    pickupEta: data.pickup_eta,
    expires: data.expires,
  }
}

/**
 * Create a delivery (confirm quote and dispatch courier)
 */
export async function createDelivery(params: {
  quoteId: string
  bookingId: string
  manifest: string // what is being delivered ("2022 Toyota Camry keys")
  pickup: UberDeliveryLocation
  dropoff: UberDeliveryLocation
}): Promise<UberDelivery> {
  if (!process.env.UBER_DIRECT_CLIENT_ID) {
    // Return mock delivery
    return {
      id: `mock_delivery_${Date.now()}`,
      externalId: params.bookingId,
      status: 'pending',
      trackingUrl: `https://uberdirect.com/track/mock`,
      fee: 1500,
      currency: 'USD',
      pickup: params.pickup,
      dropoff: params.dropoff,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  const token = await getUberToken()
  const res = await fetch(UBER_DIRECT_API, {
    method: 'POST',
    headers: uberHeaders(token),
    body: JSON.stringify({
      quote_id: params.quoteId,
      external_id: params.bookingId,
      manifest_items: [{ name: params.manifest, quantity: 1, price: 0 }],
      pickup_name: params.pickup.name,
      pickup_address: `${params.pickup.address}, ${params.pickup.city}, ${params.pickup.state} ${params.pickup.zip}`,
      pickup_latitude: params.pickup.lat,
      pickup_longitude: params.pickup.lng,
      pickup_phone_number: params.pickup.phone,
      pickup_instructions: params.pickup.instructions,
      dropoff_name: params.dropoff.name,
      dropoff_address: `${params.dropoff.address}, ${params.dropoff.city}, ${params.dropoff.state} ${params.dropoff.zip}`,
      dropoff_latitude: params.dropoff.lat,
      dropoff_longitude: params.dropoff.lng,
      dropoff_phone_number: params.dropoff.phone,
      dropoff_instructions: params.dropoff.instructions,
    }),
  })

  if (!res.ok) throw new Error(`Uber delivery failed: ${await res.text()}`)
  return res.json()
}

/**
 * Get delivery status
 */
export async function getDeliveryStatus(deliveryId: string): Promise<UberDelivery> {
  const token = await getUberToken()
  const res = await fetch(`${UBER_DIRECT_API}/${deliveryId}`, {
    headers: uberHeaders(token),
  })
  if (!res.ok) throw new Error(`Uber delivery not found: ${deliveryId}`)
  return res.json()
}

/**
 * Cancel a delivery
 */
export async function cancelDelivery(deliveryId: string): Promise<void> {
  const token = await getUberToken()
  await fetch(`${UBER_DIRECT_API}/${deliveryId}/cancel`, {
    method: 'POST',
    headers: uberHeaders(token),
  })
}
