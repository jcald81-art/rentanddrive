import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET: Fetch delivery rides for a booking or user
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const bookingId = searchParams.get('bookingId')
  const rideId = searchParams.get('rideId')

  try {
    if (rideId) {
      // Fetch single ride
      const { data, error } = await supabase
        .from('delivery_rides')
        .select('*')
        .eq('id', rideId)
        .single()
      
      if (error) throw error
      return NextResponse.json(data)
    }

    if (bookingId) {
      // Fetch rides for a booking
      const { data, error } = await supabase
        .from('delivery_rides')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return NextResponse.json(data)
    }

    // Fetch all user's rides (as host or renter)
    const { data, error } = await supabase
      .from('delivery_rides')
      .select(`
        *,
        booking:bookings(id, start_date, end_date),
        vehicle:vehicles(id, year, make, model, images)
      `)
      .or(`host_id.eq.${user.id},renter_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) throw error
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching delivery rides:', error)
    return NextResponse.json({ error: 'Failed to fetch delivery rides' }, { status: 500 })
  }
}

// POST: Request a new delivery ride
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      bookingId,
      rideType, // 'pickup' or 'return'
      provider, // 'uber' or 'lyft'
      pickupAddress,
      pickupLat,
      pickupLng,
      dropoffAddress,
      dropoffLat,
      dropoffLng,
    } = body

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, vehicle:vehicles(*)')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify user is host or renter
    if (booking.host_id !== user.id && booking.guest_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Create delivery ride record
    const { data: ride, error: rideError } = await supabase
      .from('delivery_rides')
      .insert({
        booking_id: bookingId,
        vehicle_id: booking.vehicle_id,
        host_id: booking.host_id,
        renter_id: booking.guest_id,
        ride_type: rideType,
        provider,
        status: 'pending',
        pickup_address: pickupAddress,
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        dropoff_address: dropoffAddress,
        dropoff_lat: dropoffLat,
        dropoff_lng: dropoffLng,
      })
      .select()
      .single()

    if (rideError) throw rideError

    // In production, this would call Uber/Lyft API
    // For now, we simulate the request
    const estimatedFare = Math.floor(Math.random() * 2000) + 1500 // $15-35
    const estimatedMinutes = Math.floor(Math.random() * 15) + 5

    // Update with estimated fare
    const { data: updatedRide, error: updateError } = await supabase
      .from('delivery_rides')
      .update({
        status: 'requested',
        estimated_fare_cents: estimatedFare,
        estimated_arrival: new Date(Date.now() + estimatedMinutes * 60 * 1000).toISOString(),
      })
      .eq('id', ride.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      ride: updatedRide,
      message: `${provider === 'uber' ? 'Uber' : 'Lyft'} ride requested successfully`,
      estimatedFare: estimatedFare / 100,
      estimatedArrival: estimatedMinutes,
    })

  } catch (error) {
    console.error('Error creating delivery ride:', error)
    return NextResponse.json({ error: 'Failed to request ride' }, { status: 500 })
  }
}

// PATCH: Update ride status (webhook simulation)
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const body = await request.json()
    const { rideId, status, driverInfo, moboKeyAction } = body

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    // Add driver info if provided
    if (driverInfo) {
      updateData.driver_name = driverInfo.name
      updateData.driver_phone = driverInfo.phone
      updateData.driver_photo_url = driverInfo.photoUrl
      updateData.driver_vehicle_make = driverInfo.vehicleMake
      updateData.driver_vehicle_model = driverInfo.vehicleModel
      updateData.driver_vehicle_color = driverInfo.vehicleColor
      updateData.driver_vehicle_plate = driverInfo.vehiclePlate
      updateData.driver_rating = driverInfo.rating
    }

    // Handle MoboKey unlock/lock events
    if (moboKeyAction === 'unlock') {
      updateData.mobokey_unlock_at = new Date().toISOString()
    } else if (moboKeyAction === 'lock') {
      updateData.mobokey_lock_at = new Date().toISOString()
    }

    // Set actual times based on status
    if (status === 'arrived_at_pickup') {
      updateData.actual_pickup_time = new Date().toISOString()
    } else if (status === 'completed') {
      updateData.actual_dropoff_time = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('delivery_rides')
      .update(updateData)
      .eq('id', rideId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, ride: data })

  } catch (error) {
    console.error('Error updating delivery ride:', error)
    return NextResponse.json({ error: 'Failed to update ride' }, { status: 500 })
  }
}
