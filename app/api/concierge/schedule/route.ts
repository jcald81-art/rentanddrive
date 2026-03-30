import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const LYFT_API_URL = 'https://api.lyft.com/v1'
const UBER_API_URL = 'https://api.uber.com/v1.2'

interface ScheduleRequest {
  booking_id: string
  direction: 'pickup' | 'dropoff'
  pickup_address?: string
  scheduled_time?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ScheduleRequest = await request.json()
    const { booking_id, direction, pickup_address, scheduled_time } = body

    if (!booking_id || !direction) {
      return NextResponse.json(
        { error: 'booking_id and direction are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get booking details with renter info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        start_date,
        end_date,
        renter_id,
        vehicle:vehicles (
          id,
          location_address,
          location_city,
          location_lat,
          location_lng
        ),
        renter:profiles!bookings_renter_id_fkey (
          id,
          full_name,
          phone
        )
      `)
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    const vehicle = booking.vehicle as { location_address?: string; location_city?: string } | null
    const renter = booking.renter as { full_name?: string; phone?: string } | null

    if (!renter?.phone) {
      return NextResponse.json(
        { error: 'Renter phone number required for ride scheduling' },
        { status: 400 }
      )
    }

    // Determine pickup and dropoff based on direction
    const vehicleAddress = vehicle?.location_address || `${vehicle?.location_city || 'Reno'}, NV`
    
    let ridePickup: string
    let rideDropoff: string
    let rideTime: string

    if (direction === 'pickup') {
      // Renter needs ride TO the vehicle
      ridePickup = pickup_address || 'Reno-Tahoe International Airport, Reno, NV'
      rideDropoff = vehicleAddress
      rideTime = scheduled_time || booking.start_date
    } else {
      // Renter needs ride FROM the vehicle back
      ridePickup = vehicleAddress
      rideDropoff = pickup_address || 'Reno-Tahoe International Airport, Reno, NV'
      rideTime = scheduled_time || booking.end_date
    }

    // Try Lyft first, fall back to Uber
    let rideResult = await scheduleLyftRide({
      riderName: renter.full_name || 'Rent and Drive Customer',
      riderPhone: renter.phone,
      pickup: ridePickup,
      dropoff: rideDropoff,
      scheduledTime: rideTime,
    })

    if (!rideResult.success) {
      console.log('[v0] Lyft failed, trying Uber:', rideResult.error)
      rideResult = await scheduleUberRide({
        riderName: renter.full_name || 'Rent and Drive Customer',
        riderPhone: renter.phone,
        pickup: ridePickup,
        dropoff: rideDropoff,
        scheduledTime: rideTime,
      })
    }

    if (!rideResult.success) {
      return NextResponse.json(
        { error: 'Failed to schedule ride with both Lyft and Uber', details: rideResult.error },
        { status: 500 }
      )
    }

    // Save ride to database
    const { data: ride, error: rideError } = await supabase
      .from('ride_concierge')
      .insert({
        booking_id,
        ride_type: rideResult.provider,
        ride_direction: direction,
        rider_name: renter.full_name || 'Customer',
        rider_phone: renter.phone,
        pickup_address: ridePickup,
        dropoff_address: rideDropoff,
        scheduled_time: rideTime,
        ride_status: 'scheduled',
        external_ride_id: rideResult.rideId,
        driver_name: rideResult.driverName,
        driver_phone: rideResult.driverPhone,
        vehicle_description: rideResult.vehicleDescription,
        eta_minutes: rideResult.etaMinutes,
        cost_cents: rideResult.costCents,
      })
      .select()
      .single()

    if (rideError) {
      console.error('[v0] Failed to save ride:', rideError)
      return NextResponse.json(
        { error: 'Ride scheduled but failed to save to database' },
        { status: 500 }
      )
    }

    // Update booking flags
    await supabase
      .from('bookings')
      .update({
        concierge_enabled: true,
        [direction === 'pickup' ? 'concierge_pickup_requested' : 'concierge_dropoff_requested']: true,
      })
      .eq('id', booking_id)

    // Send SMS to renter
    await sendRideSms(renter.phone, {
      direction,
      provider: rideResult.provider,
      pickup: ridePickup,
      dropoff: rideDropoff,
      scheduledTime: new Date(rideTime).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      driverName: rideResult.driverName,
      vehicleDescription: rideResult.vehicleDescription,
    })

    return NextResponse.json({
      success: true,
      ride: {
        id: ride.id,
        provider: rideResult.provider,
        status: 'scheduled',
        pickup: ridePickup,
        dropoff: rideDropoff,
        scheduledTime: rideTime,
        eta: rideResult.etaMinutes,
      },
    })
  } catch (error) {
    console.error('[v0] Concierge schedule error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface RideParams {
  riderName: string
  riderPhone: string
  pickup: string
  dropoff: string
  scheduledTime: string
}

interface RideResult {
  success: boolean
  provider: 'lyft' | 'uber'
  rideId?: string
  driverName?: string
  driverPhone?: string
  vehicleDescription?: string
  etaMinutes?: number
  costCents?: number
  error?: string
}

async function scheduleLyftRide(params: RideParams): Promise<RideResult> {
  const apiKey = process.env.LYFT_API_KEY

  // If no API key, return mock response for development
  if (!apiKey) {
    console.log('[v0] No LYFT_API_KEY, using mock response')
    return {
      success: true,
      provider: 'lyft',
      rideId: `lyft_mock_${Date.now()}`,
      driverName: 'Demo Driver',
      driverPhone: '+17755551234',
      vehicleDescription: 'Black Toyota Camry',
      etaMinutes: 8,
      costCents: 1500,
    }
  }

  try {
    // Lyft Concierge API call
    const response = await fetch(`${LYFT_API_URL}/rides`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ride_type: 'lyft',
        origin: {
          address: params.pickup,
        },
        destination: {
          address: params.dropoff,
        },
        passenger: {
          first_name: params.riderName.split(' ')[0],
          last_name: params.riderName.split(' ').slice(1).join(' ') || 'Customer',
          phone_number: params.riderPhone,
        },
        scheduled_time: params.scheduledTime,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, provider: 'lyft', error: errorText }
    }

    const data = await response.json()
    return {
      success: true,
      provider: 'lyft',
      rideId: data.ride_id,
      driverName: data.driver?.first_name,
      driverPhone: data.driver?.phone_number,
      vehicleDescription: data.vehicle ? `${data.vehicle.color} ${data.vehicle.make} ${data.vehicle.model}` : undefined,
      etaMinutes: data.origin?.eta_seconds ? Math.ceil(data.origin.eta_seconds / 60) : undefined,
      costCents: data.price_quote?.estimated_cost_cents_max,
    }
  } catch (error) {
    return { success: false, provider: 'lyft', error: String(error) }
  }
}

async function scheduleUberRide(params: RideParams): Promise<RideResult> {
  const apiKey = process.env.UBER_API_KEY

  // If no API key, return mock response for development
  if (!apiKey) {
    console.log('[v0] No UBER_API_KEY, using mock response')
    return {
      success: true,
      provider: 'uber',
      rideId: `uber_mock_${Date.now()}`,
      driverName: 'Demo Driver',
      driverPhone: '+17755555678',
      vehicleDescription: 'White Honda Accord',
      etaMinutes: 6,
      costCents: 1400,
    }
  }

  try {
    // Uber Central API call
    const response = await fetch(`${UBER_API_URL}/requests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: 'uberX', // Default to UberX
        start_address: params.pickup,
        end_address: params.dropoff,
        rider: {
          first_name: params.riderName.split(' ')[0],
          last_name: params.riderName.split(' ').slice(1).join(' ') || 'Customer',
          phone_number: params.riderPhone,
        },
        scheduled_time: params.scheduledTime,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, provider: 'uber', error: errorText }
    }

    const data = await response.json()
    return {
      success: true,
      provider: 'uber',
      rideId: data.request_id,
      driverName: data.driver?.name,
      driverPhone: data.driver?.phone_number,
      vehicleDescription: data.vehicle ? `${data.vehicle.make} ${data.vehicle.model}` : undefined,
      etaMinutes: data.eta,
      costCents: data.fare?.value ? Math.round(data.fare.value * 100) : undefined,
    }
  } catch (error) {
    return { success: false, provider: 'uber', error: String(error) }
  }
}

async function sendRideSms(
  phone: string,
  details: {
    direction: string
    provider: string
    pickup: string
    dropoff: string
    scheduledTime: string
    driverName?: string
    vehicleDescription?: string
  }
) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log('[v0] Twilio not configured, skipping SMS')
    return
  }

  const directionText = details.direction === 'pickup' ? 'to your rental vehicle' : 'from your rental vehicle'
  const message = `Rent & Drive: Your ${details.provider.toUpperCase()} ride ${directionText} is scheduled for ${details.scheduledTime}.\n\nPickup: ${details.pickup}\nDropoff: ${details.dropoff}${details.driverName ? `\nDriver: ${details.driverName}` : ''}${details.vehicleDescription ? `\nVehicle: ${details.vehicleDescription}` : ''}\n\nQuestions? Text us back or call (775) 555-RENT`

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`
    
    await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: phone,
        From: process.env.TWILIO_PHONE_NUMBER!,
        Body: message,
      }),
    })
  } catch (error) {
    console.error('[v0] Failed to send ride SMS:', error)
  }
}
