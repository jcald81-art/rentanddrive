import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rideId: string }> }
) {
  try {
    const { rideId } = await params
    const supabase = await createClient()

    // Get ride from database
    const { data: ride, error } = await supabase
      .from('ride_concierge')
      .select('*')
      .eq('id', rideId)
      .single()

    if (error || !ride) {
      return NextResponse.json(
        { error: 'Ride not found' },
        { status: 404 }
      )
    }

    // Check status from external provider if ride is active
    if (ride.ride_status !== 'completed' && ride.ride_status !== 'cancelled') {
      const externalStatus = await checkExternalRideStatus(
        ride.ride_type,
        ride.external_ride_id
      )

      // Update local status if changed
      if (externalStatus && externalStatus.status !== ride.ride_status) {
        const { data: updatedRide } = await supabase
          .from('ride_concierge')
          .update({
            ride_status: externalStatus.status,
            driver_name: externalStatus.driverName || ride.driver_name,
            driver_phone: externalStatus.driverPhone || ride.driver_phone,
            vehicle_description: externalStatus.vehicleDescription || ride.vehicle_description,
            eta_minutes: externalStatus.etaMinutes || ride.eta_minutes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', rideId)
          .select()
          .single()

        if (updatedRide) {
          return NextResponse.json({ ride: updatedRide })
        }
      }
    }

    return NextResponse.json({ ride })
  } catch (error) {
    console.error('[v0] Concierge status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Cancel a ride
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ rideId: string }> }
) {
  try {
    const { rideId } = await params
    const supabase = await createClient()

    // Get ride from database
    const { data: ride, error } = await supabase
      .from('ride_concierge')
      .select('*')
      .eq('id', rideId)
      .single()

    if (error || !ride) {
      return NextResponse.json(
        { error: 'Ride not found' },
        { status: 404 }
      )
    }

    if (ride.ride_status === 'completed' || ride.ride_status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed or already cancelled ride' },
        { status: 400 }
      )
    }

    // Cancel with external provider
    await cancelExternalRide(ride.ride_type, ride.external_ride_id)

    // Update local status
    const { data: updatedRide } = await supabase
      .from('ride_concierge')
      .update({
        ride_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .select()
      .single()

    return NextResponse.json({ 
      success: true, 
      ride: updatedRide 
    })
  } catch (error) {
    console.error('[v0] Concierge cancel error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface ExternalStatus {
  status: string
  driverName?: string
  driverPhone?: string
  vehicleDescription?: string
  etaMinutes?: number
}

async function checkExternalRideStatus(
  provider: string,
  externalRideId: string | null
): Promise<ExternalStatus | null> {
  if (!externalRideId) return null

  // Mock response if no API keys
  if (externalRideId.includes('mock')) {
    // Simulate status progression for demo
    const mockStatuses = ['scheduled', 'dispatched', 'en_route', 'arrived']
    const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)]
    return {
      status: randomStatus,
      driverName: 'Demo Driver',
      driverPhone: '+17755551234',
      vehicleDescription: provider === 'lyft' ? 'Black Toyota Camry' : 'White Honda Accord',
      etaMinutes: Math.floor(Math.random() * 10) + 3,
    }
  }

  if (provider === 'lyft') {
    const apiKey = process.env.LYFT_API_KEY
    if (!apiKey) return null

    try {
      const response = await fetch(
        `https://api.lyft.com/v1/rides/${externalRideId}`,
        {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        }
      )

      if (!response.ok) return null

      const data = await response.json()
      return {
        status: mapLyftStatus(data.status),
        driverName: data.driver?.first_name,
        driverPhone: data.driver?.phone_number,
        vehicleDescription: data.vehicle 
          ? `${data.vehicle.color} ${data.vehicle.make} ${data.vehicle.model}` 
          : undefined,
        etaMinutes: data.origin?.eta_seconds 
          ? Math.ceil(data.origin.eta_seconds / 60) 
          : undefined,
      }
    } catch (error) {
      console.error('[v0] Lyft status check error:', error)
      return null
    }
  }

  if (provider === 'uber') {
    const apiKey = process.env.UBER_API_KEY
    if (!apiKey) return null

    try {
      const response = await fetch(
        `https://api.uber.com/v1.2/requests/${externalRideId}`,
        {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        }
      )

      if (!response.ok) return null

      const data = await response.json()
      return {
        status: mapUberStatus(data.status),
        driverName: data.driver?.name,
        driverPhone: data.driver?.phone_number,
        vehicleDescription: data.vehicle 
          ? `${data.vehicle.make} ${data.vehicle.model}` 
          : undefined,
        etaMinutes: data.eta,
      }
    } catch (error) {
      console.error('[v0] Uber status check error:', error)
      return null
    }
  }

  return null
}

async function cancelExternalRide(
  provider: string,
  externalRideId: string | null
): Promise<boolean> {
  if (!externalRideId || externalRideId.includes('mock')) {
    return true // Mock cancellation
  }

  if (provider === 'lyft') {
    const apiKey = process.env.LYFT_API_KEY
    if (!apiKey) return true

    try {
      const response = await fetch(
        `https://api.lyft.com/v1/rides/${externalRideId}/cancel`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}` },
        }
      )
      return response.ok
    } catch (error) {
      console.error('[v0] Lyft cancel error:', error)
      return false
    }
  }

  if (provider === 'uber') {
    const apiKey = process.env.UBER_API_KEY
    if (!apiKey) return true

    try {
      const response = await fetch(
        `https://api.uber.com/v1.2/requests/${externalRideId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${apiKey}` },
        }
      )
      return response.ok
    } catch (error) {
      console.error('[v0] Uber cancel error:', error)
      return false
    }
  }

  return true
}

function mapLyftStatus(lyftStatus: string): string {
  const statusMap: Record<string, string> = {
    pending: 'scheduled',
    accepted: 'dispatched',
    arrived: 'arrived',
    pickedUp: 'en_route',
    droppedOff: 'completed',
    canceled: 'cancelled',
  }
  return statusMap[lyftStatus] || lyftStatus
}

function mapUberStatus(uberStatus: string): string {
  const statusMap: Record<string, string> = {
    processing: 'scheduled',
    accepted: 'dispatched',
    arriving: 'en_route',
    in_progress: 'en_route',
    completed: 'completed',
    rider_canceled: 'cancelled',
    driver_canceled: 'cancelled',
  }
  return statusMap[uberStatus] || uberStatus
}
