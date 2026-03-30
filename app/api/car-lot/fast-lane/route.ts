import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Mock API responses for instant offers
async function getCarvanaOffer(vin: string, mileage: number, condition: string): Promise<number> {
  // In production, call Carvana API
  // For now, generate realistic mock offer based on condition
  const basePrice = 15000 + Math.random() * 20000
  const conditionMultiplier = condition === 'excellent' ? 1.1 : condition === 'good' ? 1.0 : 0.85
  const mileageDeduction = Math.floor(mileage / 10000) * 500
  return Math.floor((basePrice * conditionMultiplier - mileageDeduction) * 100)
}

async function getCarMaxOffer(vin: string, mileage: number, condition: string): Promise<number> {
  // In production, call CarMax API
  const basePrice = 14500 + Math.random() * 21000
  const conditionMultiplier = condition === 'excellent' ? 1.12 : condition === 'good' ? 1.0 : 0.88
  const mileageDeduction = Math.floor(mileage / 10000) * 450
  return Math.floor((basePrice * conditionMultiplier - mileageDeduction) * 100)
}

async function getRenocarmaOffer(vin: string, mileage: number, condition: string): Promise<number> {
  // Local dealer - Renocarma (mock)
  const basePrice = 13000 + Math.random() * 18000
  const conditionMultiplier = condition === 'excellent' ? 1.15 : condition === 'good' ? 1.02 : 0.9
  const mileageDeduction = Math.floor(mileage / 10000) * 400
  return Math.floor((basePrice * conditionMultiplier - mileageDeduction) * 100)
}

// POST - Get instant offers
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  const { listing_id } = body
  
  // Get listing and vehicle details
  const { data: listing } = await supabase
    .from('vehicle_listings')
    .select(`
      *,
      vehicle:vehicles(id, vin, mileage, make, model, year)
    `)
    .eq('id', listing_id)
    .eq('host_id', user.id)
    .single()
  
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found or not authorized' }, { status: 404 })
  }
  
  const { vin, mileage } = listing.vehicle
  const condition = listing.condition || 'good'
  
  // Get offers from all three sources simultaneously
  const [carvanaOffer, carmaxOffer, dealerOffer] = await Promise.all([
    getCarvanaOffer(vin, mileage, condition),
    getCarMaxOffer(vin, mileage, condition),
    getRenocarmaOffer(vin, mileage, condition),
  ])
  
  // Set expiration to 48 hours from now
  const offerExpires = new Date()
  offerExpires.setHours(offerExpires.getHours() + 48)
  
  // Update listing with offers
  const { data: updatedListing, error } = await supabase
    .from('vehicle_listings')
    .update({
      sale_type: 'instant',
      fast_lane_status: 'offers_received',
      carvana_offer_cents: carvanaOffer,
      carmax_offer_cents: carmaxOffer,
      dealer_offer_cents: dealerOffer,
      offer_expires_at: offerExpires.toISOString(),
    })
    .eq('id', listing_id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating listing with offers:', error)
    return NextResponse.json({ error: 'Failed to save offers' }, { status: 500 })
  }
  
  return NextResponse.json({
    offers: {
      carvana: {
        name: 'Carvana',
        amount_cents: carvanaOffer,
        amount: carvanaOffer / 100,
        expires_at: offerExpires.toISOString(),
        logo: '/logos/carvana.png',
      },
      carmax: {
        name: 'CarMax',
        amount_cents: carmaxOffer,
        amount: carmaxOffer / 100,
        expires_at: offerExpires.toISOString(),
        logo: '/logos/carmax.png',
      },
      renocarma: {
        name: 'Renocarma (Local)',
        amount_cents: dealerOffer,
        amount: dealerOffer / 100,
        expires_at: offerExpires.toISOString(),
        logo: '/logos/renocarma.png',
      },
    },
    expires_at: offerExpires.toISOString(),
    listing: updatedListing,
  })
}

// PATCH - Accept or decline offer
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  const { listing_id, action, selected_buyer } = body
  
  // Verify ownership
  const { data: listing } = await supabase
    .from('vehicle_listings')
    .select('*, vehicle:vehicles(id, make, model, year)')
    .eq('id', listing_id)
    .eq('host_id', user.id)
    .single()
  
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }
  
  if (action === 'accept') {
    // Get accepted offer amount
    let acceptedAmount = 0
    if (selected_buyer === 'carvana') acceptedAmount = listing.carvana_offer_cents
    else if (selected_buyer === 'carmax') acceptedAmount = listing.carmax_offer_cents
    else if (selected_buyer === 'dealer') acceptedAmount = listing.dealer_offer_cents
    
    // Update listing as pending sale
    await supabase
      .from('vehicle_listings')
      .update({
        fast_lane_status: 'accepted',
        status: 'pending',
      })
      .eq('id', listing_id)
    
    // Update vehicle status
    await supabase
      .from('vehicles')
      .update({ sale_status: 'pending_sale' })
      .eq('id', listing.vehicle_id)
    
    // Send SecureLink notification
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_notification',
          user_id: user.id,
          type: 'email',
          template: 'fast_lane_accepted',
          data: {
            vehicle: `${listing.vehicle.year} ${listing.vehicle.make} ${listing.vehicle.model}`,
            buyer: selected_buyer,
            amount: acceptedAmount / 100,
          },
        }),
      })
    } catch (e) {
      console.error('Failed to send notification:', e)
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Offer from ${selected_buyer} accepted!`,
      amount: acceptedAmount / 100,
    })
  } else if (action === 'decline') {
    // Decline all offers
    await supabase
      .from('vehicle_listings')
      .update({
        fast_lane_status: 'declined',
        carvana_offer_cents: null,
        carmax_offer_cents: null,
        dealer_offer_cents: null,
        offer_expires_at: null,
      })
      .eq('id', listing_id)
    
    return NextResponse.json({ success: true, message: 'All offers declined' })
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
