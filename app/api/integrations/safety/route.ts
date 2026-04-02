import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getRenterSafetyProfile,
  getVehicleSafetyStatus,
  executeRentalStartChecks,
  executeRentalEndChecks,
  prepareVehicleForHandover,
} from '@/lib/integrations/safety-service'

// GET: Get safety profile or vehicle status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const vehicleId = searchParams.get('vehicleId')

    if (type === 'renter') {
      const profile = await getRenterSafetyProfile(user.id)
      return NextResponse.json(profile)
    }

    if (type === 'vehicle' && vehicleId) {
      // Verify ownership or active booking
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('host_id')
        .eq('id', vehicleId)
        .single()

      const { data: activeBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('vehicle_id', vehicleId)
        .eq('renter_id', user.id)
        .in('status', ['confirmed', 'active'])
        .single()

      if (!vehicle || (vehicle.host_id !== user.id && !activeBooking)) {
        return NextResponse.json({ error: 'Not authorized for this vehicle' }, { status: 403 })
      }

      const status = await getVehicleSafetyStatus(vehicleId)
      return NextResponse.json(status)
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
  } catch (error) {
    console.error('[v0] Safety GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Execute safety checks
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, bookingId, vehicleId, pickupTime } = body

    // Verify booking access
    if (bookingId) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('id, renter_id, vehicle_id, host_id:vehicles!inner(host_id)')
        .eq('id', bookingId)
        .single()

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      const isHost = booking.host_id === user.id
      const isRenter = booking.renter_id === user.id

      if (!isHost && !isRenter) {
        return NextResponse.json({ error: 'Not authorized for this booking' }, { status: 403 })
      }
    }

    switch (action) {
      case 'rental_start': {
        if (!bookingId) {
          return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
        }

        const { data: booking } = await supabase
          .from('bookings')
          .select('renter_id, vehicle_id')
          .eq('id', bookingId)
          .single()

        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        const result = await executeRentalStartChecks(
          bookingId,
          booking.renter_id,
          booking.vehicle_id
        )

        // Update booking status if all checks passed
        if (result.passed) {
          await supabase
            .from('bookings')
            .update({ status: 'active', started_at: new Date().toISOString() })
            .eq('id', bookingId)
        }

        return NextResponse.json(result)
      }

      case 'rental_end': {
        if (!bookingId) {
          return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
        }

        const { data: booking } = await supabase
          .from('bookings')
          .select('vehicle_id')
          .eq('id', bookingId)
          .single()

        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        const result = await executeRentalEndChecks(bookingId, booking.vehicle_id)

        // Update booking status if all checks passed
        if (result.passed) {
          await supabase
            .from('bookings')
            .update({ status: 'completed', ended_at: new Date().toISOString() })
            .eq('id', bookingId)
        }

        return NextResponse.json(result)
      }

      case 'prepare_handover': {
        if (!vehicleId || !pickupTime) {
          return NextResponse.json({ error: 'Vehicle ID and pickup time required' }, { status: 400 })
        }

        const result = await prepareVehicleForHandover(vehicleId, new Date(pickupTime))
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[v0] Safety POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
