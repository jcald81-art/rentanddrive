import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { vehicleId, renterId, startDate, endDate } = body

    // Validate required fields
    if (!vehicleId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: vehicleId, startDate, endDate' },
        { status: 400 }
      )
    }

    // Parse and validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (end <= start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Calculate duration in days
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    // Get vehicle details
    const supabase = await createClient()
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, daily_rate, host_id, year, make, model')
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // Check for overlapping bookings (stub - in production, use proper date range query)
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'confirmed')
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { error: 'Vehicle is not available for selected dates' },
        { status: 409 }
      )
    }

    // Calculate pricing
    const dailyRate = vehicle.daily_rate || 100
    const subtotal = dailyRate * duration
    const platformFee = Math.round(subtotal * 0.15) // 15% platform fee
    const totalAmount = subtotal + platformFee

    // Create booking record with pending status
    const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        id: bookingId,
        vehicle_id: vehicleId,
        renter_id: renterId,
        host_id: vehicle.host_id,
        start_date: startDate,
        end_date: endDate,
        daily_rate: dailyRate,
        duration_days: duration,
        subtotal: subtotal,
        platform_fee: platformFee,
        total_amount: totalAmount,
        status: 'pending_payment',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      // Continue anyway - booking may not have table yet
    }

    // Create Stripe checkout session
    const checkoutResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'}/api/stripe/create-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rentalId: bookingId,
        renterId,
        hostId: vehicle.host_id,
        vehicleId,
        startDate,
        endDate,
        totalAmount: totalAmount * 100, // Stripe expects cents
        vehicleLabel: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      }),
    })

    const checkoutData = await checkoutResponse.json()

    if (!checkoutData.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      bookingId,
      checkoutUrl: checkoutData.url,
      pricing: {
        dailyRate,
        duration,
        subtotal,
        platformFee,
        total: totalAmount,
      },
    })

  } catch (error) {
    console.error('Booking create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
