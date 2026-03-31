import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(c) {
          c.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    booking_id,
    renter_phone,
    renter_name,
    pickup_lat,
    pickup_lng,
    dropoff_lat,
    dropoff_lng,
    vehicle_address,
    scheduled_at, // ISO string or null for immediate
  } = await req.json()

  if (!booking_id) {
    return NextResponse.json({ error: 'booking_id required' }, { status: 400 })
  }

  // Check if Lyft credentials are configured
  if (!process.env.LYFT_CLIENT_ID || !process.env.LYFT_CLIENT_SECRET) {
    // Mock response for development
    const mockRideId = `mock_ride_${Date.now()}`

    await supabase.from('ride_dispatches').insert({
      booking_id,
      provider: 'lyft',
      ride_id: mockRideId,
      status: 'pending',
      renter_id: user.id,
      scheduled_at: scheduled_at ?? null,
      estimated_pickup_minutes: 12,
    })

    await supabase
      .from('bookings')
      .update({ ride_dispatch_id: mockRideId, ride_provider: 'lyft' })
      .eq('id', booking_id)

    return NextResponse.json({
      ride_id: mockRideId,
      status: 'pending',
      eta_minutes: 12,
      mock: true,
    })
  }

  try {
    // Get Lyft Concierge access token
    const tokenRes = await fetch('https://api.lyft.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.LYFT_CLIENT_ID}:${process.env.LYFT_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: 'grant_type=client_credentials&scope=concierge',
    })

    if (!tokenRes.ok) {
      console.error('[Lyft] Token error:', await tokenRes.text())
      return NextResponse.json({ error: 'Failed to authenticate with Lyft' }, { status: 500 })
    }

    const { access_token } = await tokenRes.json()

    // Parse renter name
    const nameParts = (renter_name || 'RAD Renter').split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || 'Renter'

    // Dispatch Lyft — Concierge API (no Lyft account required for passenger)
    const rideRes = await fetch('https://api.lyft.com/v1/concierge/rides', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        ride_type: 'lyft',
        passenger: {
          first_name: firstName,
          last_name: lastName,
          phone_number: renter_phone,
        },
        origin: {
          lat: parseFloat(pickup_lat),
          lng: parseFloat(pickup_lng),
        },
        destination: {
          lat: parseFloat(dropoff_lat),
          lng: parseFloat(dropoff_lng),
          address: vehicle_address,
        },
        ...(scheduled_at ? { scheduled_at } : {}),
      }),
    })

    const ride = await rideRes.json()

    if (ride.error) {
      console.error('[Lyft] Dispatch error:', ride.error)
      return NextResponse.json({ error: ride.error }, { status: 400 })
    }

    // Store ride record in Supabase
    await supabase.from('ride_dispatches').insert({
      booking_id,
      provider: 'lyft',
      ride_id: ride.ride_id,
      status: ride.status,
      renter_id: user.id,
      scheduled_at: scheduled_at ?? null,
      estimated_pickup_minutes: ride.eta_seconds ? Math.round(ride.eta_seconds / 60) : null,
    })

    // Update booking with ride info
    await supabase
      .from('bookings')
      .update({ ride_dispatch_id: ride.ride_id, ride_provider: 'lyft' })
      .eq('id', booking_id)

    return NextResponse.json({
      ride_id: ride.ride_id,
      status: ride.status,
      eta_minutes: ride.eta_seconds ? Math.round(ride.eta_seconds / 60) : null,
    })
  } catch (error) {
    console.error('[Lyft] Dispatch error:', error)
    return NextResponse.json({ error: 'Failed to dispatch ride' }, { status: 500 })
  }
}
