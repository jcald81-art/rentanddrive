import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      bookingId,
      vehicleId,
      inspectionType, // 'pre_trip' | 'post_trip'
      mileage,
      fuelLevel,
      notes,
    } = await request.json()

    if (!bookingId || !vehicleId || !inspectionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify user is involved
    if (booking.renter_id !== user.id && booking.host_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Create inspection
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .insert({
        booking_id: bookingId,
        vehicle_id: vehicleId,
        inspector_id: user.id,
        inspection_type: inspectionType,
        mileage,
        fuel_level: fuelLevel,
        notes,
        status: 'in_progress',
      })
      .select()
      .single()

    if (inspectionError) throw inspectionError

    return NextResponse.json({
      success: true,
      inspection: {
        id: inspection.id,
        type: inspectionType,
        status: 'in_progress',
      },
    })
  } catch (error) {
    console.error('[Inspections Create Error]:', error)
    return NextResponse.json(
      { error: 'Failed to create inspection' },
      { status: 500 }
    )
  }
}
