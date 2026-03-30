import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await request.json()
  const { sold_price, booking_action } = body // booking_action: 'honor' | 'cancel' | 'contact'
  
  // Verify ownership and get listing
  const { data: listing } = await supabase
    .from('vehicle_listings')
    .select(`
      *,
      vehicle:vehicles(id, make, model, year, host_id)
    `)
    .eq('id', id)
    .eq('host_id', user.id)
    .single()
  
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }
  
  const vehicleId = listing.vehicle_id
  
  // Check for active trip
  const { data: activeTrip } = await supabase
    .from('bookings')
    .select('id, renter_id, start_date, end_date')
    .eq('vehicle_id', vehicleId)
    .eq('status', 'active')
    .single()
  
  if (activeTrip) {
    return NextResponse.json({
      error: 'Vehicle has an active trip in progress',
      active_trip: activeTrip,
    }, { status: 400 })
  }
  
  // Check for future bookings
  const { data: futureBookings } = await supabase
    .from('bookings')
    .select('id, renter_id, start_date, end_date, total_price_cents, renter:profiles(id, full_name, email)')
    .eq('vehicle_id', vehicleId)
    .in('status', ['confirmed', 'pending'])
    .gte('start_date', new Date().toISOString())
  
  const hasFutureBookings = futureBookings && futureBookings.length > 0
  
  // Handle future bookings based on action
  if (hasFutureBookings && booking_action) {
    if (booking_action === 'cancel') {
      // Cancel all future bookings with refund
      for (const booking of futureBookings) {
        await supabase
          .from('bookings')
          .update({ status: 'cancelled', cancellation_reason: 'Vehicle sold' })
          .eq('id', booking.id)
        
        // Process full refund via Stripe
        if (booking.stripe_payment_intent_id) {
          try {
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
            await stripe.refunds.create({
              payment_intent: booking.stripe_payment_intent_id,
              reason: 'requested_by_customer',
            })
          } catch (refundError) {
            console.error('[Car Lot] Refund failed:', refundError)
          }
        }
        
        // Notify renter via SecureLink
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'send_notification',
              user_id: booking.renter_id,
              type: 'both',
              template: 'booking_cancelled_vehicle_sold',
              data: {
                vehicle: `${listing.vehicle.year} ${listing.vehicle.make} ${listing.vehicle.model}`,
                start_date: booking.start_date,
                refund_amount: booking.total_price_cents / 100,
              },
            }),
          })
        } catch (e) {
          console.error('Failed to notify renter:', e)
        }
      }
    } else if (booking_action === 'contact') {
      // Mark listing as pending and notify host to contact renters
      await supabase
        .from('vehicle_listings')
        .update({ status: 'pending' })
        .eq('id', id)
      
      return NextResponse.json({
        success: true,
        message: 'Listing marked as pending. Please contact affected renters.',
        affected_bookings: futureBookings,
      })
    }
    // 'honor' means we proceed without cancelling bookings
  }
  
  // Mark as sold
  const soldAt = new Date().toISOString()
  
  // Update listing
  await supabase
    .from('vehicle_listings')
    .update({
      status: 'sold',
      sold_at: soldAt,
    })
    .eq('id', id)
  
  // Update vehicle
  await supabase
    .from('vehicles')
    .update({
      sale_status: 'sold',
      sold_at: soldAt,
      sold_price: sold_price,
      for_sale: false,
      sell_while_renting: false,
      is_active: false, // Archive vehicle
    })
    .eq('id', vehicleId)
  
  // Pause Eagle tracking
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/eagle/vehicles/${vehicleId}/pause`, {
      method: 'POST',
    })
  } catch (e) {
    console.error('Failed to pause Eagle:', e)
  }
  
  // Calculate earnings summary
  const { data: earnings } = await supabase
    .from('bookings')
    .select('total_price_cents')
    .eq('vehicle_id', vehicleId)
    .eq('status', 'completed')
  
  const totalRentalEarnings = earnings?.reduce((sum, b) => sum + b.total_price_cents, 0) || 0
  
  // Send SecureLink congratulations
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_notification',
        user_id: user.id,
        type: 'email',
        template: 'vehicle_sold_congratulations',
        data: {
          vehicle: `${listing.vehicle.year} ${listing.vehicle.make} ${listing.vehicle.model}`,
          sold_price: sold_price,
          rental_earnings: totalRentalEarnings / 100,
          total_earnings: (sold_price + totalRentalEarnings / 100),
        },
      }),
    })
  } catch (e) {
    console.error('Failed to send congratulations:', e)
  }
  
  // Award Funtime badge: Car Lot Closer
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/funtime`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'award_badge',
        user_id: user.id,
        badge: 'car_lot_closer',
      }),
    })
  } catch (e) {
    console.error('Failed to award badge:', e)
  }
  
  return NextResponse.json({
    success: true,
    message: 'Vehicle marked as sold!',
    summary: {
      sold_price: sold_price,
      rental_earnings: totalRentalEarnings / 100,
      total_earnings: sold_price + totalRentalEarnings / 100,
      cancelled_bookings: booking_action === 'cancel' ? futureBookings?.length : 0,
    },
  })
}

// GET check for conflicts before marking sold
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Get listing
  const { data: listing } = await supabase
    .from('vehicle_listings')
    .select('vehicle_id')
    .eq('id', id)
    .eq('host_id', user.id)
    .single()
  
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }
  
  // Check for active trip
  const { data: activeTrip } = await supabase
    .from('bookings')
    .select('id, start_date, end_date, renter:profiles(full_name)')
    .eq('vehicle_id', listing.vehicle_id)
    .eq('status', 'active')
    .single()
  
  // Check for future bookings
  const { data: futureBookings } = await supabase
    .from('bookings')
    .select('id, start_date, end_date, total_price_cents, renter:profiles(full_name)')
    .eq('vehicle_id', listing.vehicle_id)
    .in('status', ['confirmed', 'pending'])
    .gte('start_date', new Date().toISOString())
    .order('start_date')
  
  return NextResponse.json({
    has_active_trip: !!activeTrip,
    active_trip: activeTrip,
    future_bookings_count: futureBookings?.length || 0,
    future_bookings: futureBookings || [],
  })
}
