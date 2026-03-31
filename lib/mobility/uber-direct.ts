const UBER_BASE = 'https://api.uber.com/v1'
const CUSTOMER_ID = process.env.UBER_DIRECT_CUSTOMER_ID!

interface UberTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

export interface DeliveryQuote {
  id: string
  created: string
  expires: string
  fee: number
  currency: string
  dropoff_eta: string
  pickup_eta: string
  kind: string
  pickup_address: string
  dropoff_address: string
}

export interface UberDelivery {
  id: string
  quote_id: string
  status: 'pending' | 'pickup' | 'pickup_complete' | 
          'dropoff' | 'delivered' | 'canceled' | 'returned'
  tracking_url: string
  pickup: {
    name: string
    address: string
    eta: string
    location: { lat: number; lng: number }
  }
  dropoff: {
    name: string
    address: string
    eta: string
    location: { lat: number; lng: number }
  }
  courier?: {
    name: string
    vehicle_type: string
    phone_number: string
    location: { lat: number; lng: number }
  }
  live_mode: boolean
  fee: {
    currency: string
    total_fee: number
  }
}

// Get OAuth2 token
async function getUberToken(): Promise<string> {
  const response = await fetch('https://auth.uber.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.UBER_CLIENT_ID!,
      client_secret: process.env.UBER_CLIENT_SECRET!,
      grant_type: 'client_credentials',
      scope: 'eats.deliveries',
    }),
  })
  const data: UberTokenResponse = await response.json()
  return data.access_token
}

// Get delivery price quote
export async function getDeliveryQuote(
  pickup_address: string,
  dropoff_address: string
): Promise<DeliveryQuote> {
  const token = await getUberToken()
  const response = await fetch(
    `${UBER_BASE}/customers/${CUSTOMER_ID}/delivery_quotes`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pickup_address, dropoff_address }),
    }
  )
  if (!response.ok) {
    const err = await response.json()
    throw new Error(`Uber quote error: ${err.message}`)
  }
  const data = await response.json()
  return data
}

// Create delivery
export async function createDelivery({
  quote_id,
  pickup_address,
  pickup_name,
  pickup_phone,
  pickup_notes,
  dropoff_address,
  dropoff_name,
  dropoff_phone,
  dropoff_notes,
  booking_id,
  vehicle_name,
}: {
  quote_id: string
  pickup_address: string
  pickup_name: string
  pickup_phone: string
  pickup_notes: string
  dropoff_address: string
  dropoff_name: string
  dropoff_phone: string
  dropoff_notes: string
  booking_id: string
  vehicle_name: string
}): Promise<UberDelivery> {
  const token = await getUberToken()

  const response = await fetch(
    `${UBER_BASE}/customers/${CUSTOMER_ID}/deliveries`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quote_id,
        pickup: {
          name: pickup_name,
          address: pickup_address,
          phone_number: pickup_phone,
          notes: pickup_notes,
        },
        dropoff: {
          name: dropoff_name,
          address: dropoff_address,
          phone_number: dropoff_phone,
          notes: dropoff_notes,
        },
        manifest_items: [{
          name: `RAD Vehicle Keys — ${vehicle_name}`,
          quantity: 1,
          size: 'small',
          price: 0,
        }],
        external_id: booking_id,
        testSpecifications: process.env.NODE_ENV !== 'production'
          ? { robo_courier_specification: { mode: 'auto' } }
          : undefined,
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`Uber delivery error: ${err.message}`)
  }

  return response.json()
}

// Get delivery status
export async function getDeliveryStatus(
  delivery_id: string
): Promise<UberDelivery> {
  const token = await getUberToken()
  const response = await fetch(
    `${UBER_BASE}/customers/${CUSTOMER_ID}/deliveries/${delivery_id}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  )
  return response.json()
}

// Cancel delivery
export async function cancelDelivery(delivery_id: string): Promise<void> {
  const token = await getUberToken()
  await fetch(
    `${UBER_BASE}/customers/${CUSTOMER_ID}/deliveries/${delivery_id}/cancel`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    }
  )
}
