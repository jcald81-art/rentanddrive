import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET inquiries (for host)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Get inquiries for listings the user owns
  const { data, error } = await supabase
    .from('car_lot_inquiries')
    .select(`
      *,
      listing:vehicle_listings(
        id, asking_price,
        vehicle:vehicles(id, make, model, year, primary_image_url)
      ),
      buyer:profiles(id, full_name, email, phone, avatar_url)
    `)
    .in('listing_id', 
      supabase.from('vehicle_listings').select('id').eq('host_id', user.id)
    )
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching inquiries:', error)
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 })
  }
  
  return NextResponse.json(data || [])
}

// POST create inquiry
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  const { listing_id, message, offer_amount } = body
  
  if (!listing_id || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  
  // Get listing details for notification
  const { data: listing } = await supabase
    .from('vehicle_listings')
    .select(`
      *,
      vehicle:vehicles(make, model, year),
      host:profiles(id, email, phone)
    `)
    .eq('id', listing_id)
    .single()
  
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }
  
  // Create inquiry
  const { data: inquiry, error } = await supabase
    .from('car_lot_inquiries')
    .insert({
      listing_id,
      buyer_id: user.id,
      message,
      offer_amount: offer_amount || null,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating inquiry:', error)
    return NextResponse.json({ error: 'Failed to create inquiry' }, { status: 500 })
  }
  
  // Update inquiry count on listing
  await supabase.rpc('increment_listing_inquiries', { listing_id })
  
  // Send SecureLink SMS to host
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_sms',
        user_id: listing.host_id,
        message: `New inquiry on your ${listing.vehicle?.year} ${listing.vehicle?.make} ${listing.vehicle?.model}! ${offer_amount ? `Offer: $${offer_amount.toLocaleString()}` : 'Check HostsLab for details.'}`,
      }),
    })
  } catch (e) {
    console.error('Failed to send notification:', e)
  }
  
  return NextResponse.json(inquiry)
}
