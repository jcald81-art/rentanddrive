import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// igloohome API client
const IGLOO_API_URL = 'https://api.igloodeveloper.co/v1'

async function iglooRequest(endpoint: string, method: string, body?: object) {
  const response = await fetch(`${IGLOO_API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.IGLOO_API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  
  if (!response.ok) {
    throw new Error(`igloo API error: ${response.status}`)
  }
  
  return response.json()
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        vehicles(id, lockbox_id, lockbox_type),
        renter:profiles!bookings_renter_id_fkey(full_name, email, phone)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Verify user is authorized (renter or host)
    if (booking.renter_id !== user.id && booking.host_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this booking' }, { status: 403 })
    }

    const lockboxId = booking.vehicles?.lockbox_id
    if (!lockboxId) {
      return NextResponse.json({ error: 'No lockbox assigned to this vehicle' }, { status: 400 })
    }

    // Generate PIN based on booking dates
    const startTime = new Date(booking.start_date).getTime()
    const endTime = new Date(booking.end_date).getTime()

    let pin: string
    let accessCodeId: string | null = null

    if (process.env.IGLOO_API_KEY) {
      // Create access code via igloo API
      const iglooResponse = await iglooRequest('/accesscodes', 'POST', {
        lockId: lockboxId,
        name: `Booking ${bookingId.slice(0, 8)}`,
        type: 'timebound',
        startDate: startTime,
        endDate: endTime,
        accessType: 'pin',
      })

      pin = iglooResponse.pin
      accessCodeId = iglooResponse.accessCodeId
    } else {
      // Generate local PIN for development
      pin = Math.floor(1000 + Math.random() * 9000).toString()
    }

    // Store access code in database
    await supabase.from('lockbox_access_codes').insert({
      booking_id: bookingId,
      lockbox_id: lockboxId,
      access_code: pin,
      igloo_access_code_id: accessCodeId,
      valid_from: booking.start_date,
      valid_until: booking.end_date,
      created_by: user.id,
    })

    // Update booking with access code
    await supabase
      .from('bookings')
      .update({ 
        lockbox_pin: pin,
        lockbox_pin_expires_at: booking.end_date,
      })
      .eq('id', bookingId)

    // Log access
    await supabase.from('lockbox_access_codes').update({
      last_accessed_at: new Date().toISOString(),
    }).eq('booking_id', bookingId)

    return NextResponse.json({
      success: true,
      pin,
      validFrom: booking.start_date,
      validUntil: booking.end_date,
      lockboxType: booking.vehicles?.lockbox_type || 'igloo',
    })
  } catch (error) {
    console.error('[Igloo Generate Access Error]:', error)
    return NextResponse.json(
      { error: 'Failed to generate access code' },
      { status: 500 }
    )
  }
}
