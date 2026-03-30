import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET single listing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('vehicle_listings')
    .select(`
      *,
      vehicle:vehicles(
        id, make, model, year, mileage, vin, 
        primary_image_url, images, category, 
        has_awd, license_plate, price_per_day_cents,
        host:profiles(id, full_name, avatar_url, phone)
      )
    `)
    .eq('id', id)
    .single()
  
  if (error || !data) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }
  
  return NextResponse.json(data)
}

// PATCH update listing
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Verify ownership
  const { data: listing } = await supabase
    .from('vehicle_listings')
    .select('host_id, vehicle_id')
    .eq('id', id)
    .single()
  
  if (!listing || listing.host_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }
  
  const body = await request.json()
  const { asking_price, condition, seller_notes, rent_to_own_discount_cents, status } = body
  
  const updates: any = {}
  if (asking_price !== undefined) updates.asking_price = asking_price
  if (condition !== undefined) updates.condition = condition
  if (seller_notes !== undefined) updates.seller_notes = seller_notes
  if (rent_to_own_discount_cents !== undefined) updates.rent_to_own_discount_cents = rent_to_own_discount_cents
  if (status !== undefined) updates.status = status
  
  const { data, error } = await supabase
    .from('vehicle_listings')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
  
  // Update vehicle if status changed
  if (status === 'withdrawn') {
    await supabase
      .from('vehicles')
      .update({
        for_sale: false,
        sell_while_renting: false,
        sale_status: 'not_listed',
      })
      .eq('id', listing.vehicle_id)
  }
  
  return NextResponse.json(data)
}

// DELETE listing (withdraw)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Verify ownership
  const { data: listing } = await supabase
    .from('vehicle_listings')
    .select('host_id, vehicle_id')
    .eq('id', id)
    .single()
  
  if (!listing || listing.host_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }
  
  // Withdraw listing
  await supabase
    .from('vehicle_listings')
    .update({ status: 'withdrawn' })
    .eq('id', id)
  
  // Update vehicle
  await supabase
    .from('vehicles')
    .update({
      for_sale: false,
      sell_while_renting: false,
      sale_status: 'not_listed',
    })
    .eq('id', listing.vehicle_id)
  
  return NextResponse.json({ success: true })
}
