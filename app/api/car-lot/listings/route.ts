import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET all active listings
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams
  
  let query = supabase
    .from('vehicle_listings')
    .select(`
      *,
      vehicle:vehicles(
        id, make, model, year, mileage, vin, 
        primary_image_url, images, category, 
        has_awd, license_plate, price_per_day_cents,
        host:profiles(id, full_name, avatar_url)
      )
    `)
    .eq('status', 'active')
    .order('listed_at', { ascending: false })

  // Apply filters
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const make = searchParams.get('make')
  const awd = searchParams.get('awd')
  
  if (minPrice) {
    query = query.gte('asking_price', parseInt(minPrice))
  }
  if (maxPrice) {
    query = query.lte('asking_price', parseInt(maxPrice))
  }

  const { data, error } = await query.limit(100)
  
  if (error) {
    console.error('Error fetching listings:', error)
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
  
  // Filter by make/awd in memory since joins don't support these filters directly
  let filteredData = data || []
  if (make) {
    filteredData = filteredData.filter((l: any) => 
      l.vehicle?.make?.toLowerCase().includes(make.toLowerCase())
    )
  }
  if (awd === 'true') {
    filteredData = filteredData.filter((l: any) => l.vehicle?.has_awd)
  }
  
  return NextResponse.json(filteredData)
}

// POST create new listing
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  const {
    vehicle_id,
    asking_price,
    condition,
    seller_notes,
    rent_to_own_discount_cents,
    sale_type,
  } = body
  
  // Verify user owns this vehicle
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('host_id')
    .eq('id', vehicle_id)
    .single()
  
  if (!vehicle || vehicle.host_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized to list this vehicle' }, { status: 403 })
  }
  
  // Create listing
  const { data: listing, error } = await supabase
    .from('vehicle_listings')
    .insert({
      vehicle_id,
      host_id: user.id,
      asking_price,
      condition: condition || 'good',
      seller_notes,
      rent_to_own_discount_cents: rent_to_own_discount_cents || 0,
      sale_type: sale_type || 'private',
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating listing:', error)
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
  }
  
  // Update vehicle flags
  await supabase
    .from('vehicles')
    .update({
      for_sale: true,
      sell_while_renting: true,
      sale_status: 'active',
      asking_price,
      sale_notes: seller_notes,
    })
    .eq('id', vehicle_id)
  
  // Send SecureLink notification to host
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_notification',
        user_id: user.id,
        type: 'email',
        template: 'listing_created',
        data: {
          vehicle_id,
          asking_price,
        },
      }),
    })
  } catch (e) {
    console.error('Failed to send notification:', e)
  }
  
  return NextResponse.json(listing)
}
