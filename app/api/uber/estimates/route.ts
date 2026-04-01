import { NextRequest, NextResponse } from 'next/server'

/**
 * Uber Rider API Integration for RentAndDrive
 * 
 * Uses Uber's Rider API to get ride estimates for pickup/dropoff locations.
 * Supports both sandbox and production environments.
 * 
 * Environment Variables Required:
 * - UBER_CLIENT_ID: Your Uber app client ID
 * - UBER_CLIENT_SECRET: Your Uber app client secret
 * - UBER_SERVER_TOKEN: (Optional) Server token for simpler auth
 * - UBER_SANDBOX: Set to 'true' for sandbox mode (default), 'false' for production
 * 
 * To switch to production:
 * 1. Set UBER_SANDBOX=false in your environment variables
 * 2. Ensure your Uber app is approved for production access
 * 3. Update credentials to production keys if different
 */

// API URLs - Toggle between sandbox and production
const UBER_SANDBOX_URL = 'https://sandbox-api.uber.com'
const UBER_PRODUCTION_URL = 'https://api.uber.com'

function getUberBaseUrl(): string {
  // Default to sandbox unless explicitly set to production
  const isSandbox = process.env.UBER_SANDBOX !== 'false'
  return isSandbox ? UBER_SANDBOX_URL : UBER_PRODUCTION_URL
}

// Simple in-memory token cache (use Upstash Redis in production for multi-instance)
let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get OAuth access token using client_credentials flow
 * Caches token in memory until expiration
 */
async function getUberAccessToken(): Promise<string | null> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  const clientId = process.env.UBER_CLIENT_ID
  const clientSecret = process.env.UBER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn('[Uber] Missing UBER_CLIENT_ID or UBER_CLIENT_SECRET')
    return null
  }

  try {
    const response = await fetch('https://login.uber.com/oauth/v2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'ride_request.estimate',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Uber] Token request failed:', response.status, errorText)
      return null
    }

    const data = await response.json()
    
    // Cache token with 5 minute buffer before expiration
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000,
    }

    return data.access_token
  } catch (error) {
    console.error('[Uber] Token fetch error:', error)
    return null
  }
}

/**
 * Popular Reno/Tahoe coordinates for testing
 * 
 * Reno-Tahoe International Airport (RNO): 39.4991, -119.7681
 * Downtown Reno: 39.5296, -119.8138
 * South Lake Tahoe: 38.9399, -119.9771
 * North Lake Tahoe (Tahoe City): 39.1677, -120.1455
 * Incline Village: 39.2515, -119.9531
 * Squaw Valley: 39.1969, -120.2358
 */

export interface UberProduct {
  product_id: string
  display_name: string
  description: string
  capacity: number
  image: string
}

export interface UberPriceEstimate {
  product_id: string
  display_name: string
  estimate: string
  low_estimate: number
  high_estimate: number
  surge_multiplier: number
  duration: number // seconds
  distance: number // miles
}

export interface UberTimeEstimate {
  product_id: string
  display_name: string
  estimate: number // seconds until pickup
}

export interface UberEstimatesResponse {
  prices: UberPriceEstimate[]
  times: UberTimeEstimate[]
  products: UberProduct[]
  deepLink: string
  isSandbox: boolean
  error?: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const pickupLat = searchParams.get('pickup_lat')
  const pickupLng = searchParams.get('pickup_lng')
  const dropoffLat = searchParams.get('dropoff_lat')
  const dropoffLng = searchParams.get('dropoff_lng')

  // Validate required parameters
  if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
    return NextResponse.json(
      { error: 'Missing required coordinates: pickup_lat, pickup_lng, dropoff_lat, dropoff_lng' },
      { status: 400 }
    )
  }

  // Generate deep link for Uber app (works without auth)
  const deepLink = `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}&dropoff[latitude]=${dropoffLat}&dropoff[longitude]=${dropoffLng}&client_id=${process.env.UBER_CLIENT_ID || 'rad-rentals'}`

  // Try to get real estimates from Uber API
  const accessToken = await getUberAccessToken()
  const baseUrl = getUberBaseUrl()
  const isSandbox = process.env.UBER_SANDBOX !== 'false'

  // If no valid token, return mock data with deep link
  if (!accessToken) {
    return NextResponse.json({
      prices: getMockPriceEstimates(),
      times: getMockTimeEstimates(),
      products: getMockProducts(),
      deepLink,
      isSandbox: true,
      mock: true,
    })
  }

  try {
    // Fetch all estimates in parallel
    const [productsRes, pricesRes, timesRes] = await Promise.all([
      // Get available products
      fetch(
        `${baseUrl}/v1.2/products?latitude=${pickupLat}&longitude=${pickupLng}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      ),
      // Get price estimates
      fetch(
        `${baseUrl}/v1.2/estimates/price?start_latitude=${pickupLat}&start_longitude=${pickupLng}&end_latitude=${dropoffLat}&end_longitude=${dropoffLng}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      ),
      // Get time estimates (ETA)
      fetch(
        `${baseUrl}/v1.2/estimates/time?start_latitude=${pickupLat}&start_longitude=${pickupLng}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      ),
    ])

    // Parse responses
    const products = productsRes.ok ? await productsRes.json() : { products: [] }
    const prices = pricesRes.ok ? await pricesRes.json() : { prices: [] }
    const times = timesRes.ok ? await timesRes.json() : { times: [] }

    return NextResponse.json({
      prices: prices.prices || getMockPriceEstimates(),
      times: times.times || getMockTimeEstimates(),
      products: products.products || getMockProducts(),
      deepLink,
      isSandbox,
    })
  } catch (error) {
    console.error('[Uber] API error:', error)
    
    // Return mock data on error with deep link still working
    return NextResponse.json({
      prices: getMockPriceEstimates(),
      times: getMockTimeEstimates(),
      products: getMockProducts(),
      deepLink,
      isSandbox: true,
      mock: true,
      error: 'Failed to fetch live estimates, showing approximate values',
    })
  }
}

// Mock data for development/fallback
function getMockPriceEstimates(): UberPriceEstimate[] {
  return [
    {
      product_id: 'uber-x',
      display_name: 'UberX',
      estimate: '$18-24',
      low_estimate: 18,
      high_estimate: 24,
      surge_multiplier: 1,
      duration: 1800, // 30 minutes
      distance: 15.5,
    },
    {
      product_id: 'uber-xl',
      display_name: 'UberXL',
      estimate: '$28-35',
      low_estimate: 28,
      high_estimate: 35,
      surge_multiplier: 1,
      duration: 1800,
      distance: 15.5,
    },
    {
      product_id: 'uber-black',
      display_name: 'Uber Black',
      estimate: '$45-60',
      low_estimate: 45,
      high_estimate: 60,
      surge_multiplier: 1,
      duration: 1800,
      distance: 15.5,
    },
  ]
}

function getMockTimeEstimates(): UberTimeEstimate[] {
  return [
    { product_id: 'uber-x', display_name: 'UberX', estimate: 180 }, // 3 min
    { product_id: 'uber-xl', display_name: 'UberXL', estimate: 300 }, // 5 min
    { product_id: 'uber-black', display_name: 'Uber Black', estimate: 420 }, // 7 min
  ]
}

function getMockProducts(): UberProduct[] {
  return [
    {
      product_id: 'uber-x',
      display_name: 'UberX',
      description: 'Affordable rides, all to yourself',
      capacity: 4,
      image: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/mono/product/v1/uberX.png',
    },
    {
      product_id: 'uber-xl',
      display_name: 'UberXL',
      description: 'Affordable rides for groups up to 6',
      capacity: 6,
      image: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/mono/product/v1/uberXL.png',
    },
    {
      product_id: 'uber-black',
      display_name: 'Uber Black',
      description: 'Premium rides in luxury cars',
      capacity: 4,
      image: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/mono/product/v1/uberBLACK.png',
    },
  ]
}
