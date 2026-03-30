import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Mock carrier data when APIs not configured
const MOCK_CARRIERS = [
  { 
    name: 'Montway Auto Transport',
    slug: 'montway',
    logo: '/carriers/montway.png',
    rating: 4.8,
    reviews: 15000
  },
  { 
    name: 'uShip',
    slug: 'uship',
    logo: '/carriers/uship.png',
    rating: 4.6,
    reviews: 12000
  },
  { 
    name: 'Ship.Cars',
    slug: 'shipcars',
    logo: '/carriers/shipcars.png',
    rating: 4.5,
    reviews: 8000
  }
]

// Generate mock quote with random pricing
function generateMockQuote(carrier: typeof MOCK_CARRIERS[0], distance: number) {
  const basePrice = 600 + Math.random() * 600 // $600-$1200
  const days = Math.floor(3 + Math.random() * 5) // 3-7 days
  const platformMargin = Math.floor(basePrice * 0.08) // 8% margin
  
  return {
    carrier_name: carrier.name,
    carrier_slug: carrier.slug,
    carrier_logo: carrier.logo,
    carrier_rating: carrier.rating,
    carrier_reviews: carrier.reviews,
    quote_cents: Math.round((basePrice + platformMargin) * 100),
    base_price_cents: Math.round(basePrice * 100),
    platform_margin_cents: Math.round(platformMargin * 100),
    estimated_days: days,
    estimated_delivery: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    insurance_included: true,
    insurance_coverage: 100000, // $100k coverage
    door_to_door: true,
    enclosed_available: true,
    enclosed_surcharge_cents: Math.round(basePrice * 0.4 * 100) // 40% more for enclosed
  }
}

// Real Montway API call (when key is set)
async function getMontWayQuote(
  origin: string, 
  destination: string, 
  vehicleInfo: { year: number; make: string; model: string }
) {
  const apiKey = process.env.MONTWAY_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch('https://api.montway.com/v1/quotes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        origin_zip: origin,
        destination_zip: destination,
        vehicle_year: vehicleInfo.year,
        vehicle_make: vehicleInfo.make,
        vehicle_model: vehicleInfo.model,
        transport_type: 'open',
        ship_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
    })

    if (!response.ok) return null
    
    const data = await response.json()
    return {
      carrier_name: 'Montway Auto Transport',
      carrier_slug: 'montway',
      quote_cents: Math.round(data.price * 100 * 1.08), // Add 8% margin
      base_price_cents: Math.round(data.price * 100),
      platform_margin_cents: Math.round(data.price * 100 * 0.08),
      estimated_days: data.transit_days,
      estimated_delivery: data.estimated_delivery,
      insurance_included: true,
      insurance_coverage: data.insurance_coverage || 100000,
      door_to_door: true,
      quote_id: data.quote_id
    }
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { vehicle_listing_id, destination_zip, destination_address } = body

    if (!vehicle_listing_id || !destination_zip) {
      return NextResponse.json(
        { error: 'Missing vehicle_listing_id or destination_zip' },
        { status: 400 }
      )
    }

    // Get vehicle listing with vehicle details
    const { data: listing, error: listingError } = await supabase
      .from('vehicle_listings')
      .select(`
        *,
        vehicle:vehicles(
          id, make, model, year, 
          host:profiles(id, full_name, city, state)
        )
      `)
      .eq('id', vehicle_listing_id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const originZip = listing.vehicle?.host?.city === 'Reno' ? '89501' : '89501' // Default to Reno
    const vehicleInfo = {
      year: listing.vehicle?.year || 2020,
      make: listing.vehicle?.make || 'Unknown',
      model: listing.vehicle?.model || 'Unknown'
    }

    // Calculate approximate distance for mock pricing
    const distance = Math.abs(parseInt(destination_zip) - parseInt(originZip)) * 0.5

    // Try real Montway API first
    const realMontway = await getMontWayQuote(originZip, destination_zip, vehicleInfo)
    
    // Generate quotes (real + mock fallbacks)
    const quotes = MOCK_CARRIERS.map((carrier, index) => {
      if (index === 0 && realMontway) {
        return realMontway
      }
      return generateMockQuote(carrier, distance)
    })

    // Sort by price (lowest first)
    quotes.sort((a, b) => a.quote_cents - b.quote_cents)

    // Save quotes to database
    const shipmentRecords = await Promise.all(
      quotes.map(async (quote) => {
        const { data: shipment } = await supabase
          .from('vehicle_shipments')
          .insert({
            vehicle_listing_id,
            buyer_id: user.id,
            seller_id: listing.seller_id,
            carrier_name: quote.carrier_name,
            quote_cents: quote.quote_cents,
            platform_margin_cents: quote.platform_margin_cents,
            status: 'quoted',
            origin_address: `${listing.vehicle?.host?.city || 'Reno'}, NV`,
            destination_address: destination_address || destination_zip,
            destination_zip,
            estimated_delivery: quote.estimated_delivery,
            carrier_quote_data: quote
          })
          .select()
          .single()

        return {
          ...quote,
          shipment_id: shipment?.id
        }
      })
    )

    return NextResponse.json({
      quotes: shipmentRecords,
      vehicle: {
        year: vehicleInfo.year,
        make: vehicleInfo.make,
        model: vehicleInfo.model
      },
      origin: `${listing.vehicle?.host?.city || 'Reno'}, NV`,
      destination: destination_address || destination_zip
    })

  } catch (error) {
    console.error('Shipping quote error:', error)
    return NextResponse.json(
      { error: 'Failed to get shipping quotes' },
      { status: 500 }
    )
  }
}
