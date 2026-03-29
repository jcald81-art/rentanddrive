import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Bouncie API base URL
const BOUNCIE_API_URL = 'https://api.bouncie.com/v1'

interface GeofenceRequest {
  booking_id: string
  action: 'create' | 'delete'
}

/**
 * Geofence Auto-Management API
 * 
 * Called when booking status changes:
 * - booking becomes 'active' → create geofence around pickup location
 * - booking becomes 'completed' or 'cancelled' → remove geofence
 */
export async function POST(request: NextRequest) {
  try {
    const { booking_id, action }: GeofenceRequest = await request.json()

    if (!booking_id || !action) {
      return NextResponse.json(
        { error: 'booking_id and action are required' },
        { status: 400 }
      )
    }

    // Fetch booking with vehicle info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        start_date,
        end_date,
        pickup_location,
        vehicle:vehicles(
          id,
          make,
          model,
          year,
          bouncie_device:bouncie_devices(
            id,
            bouncie_device_id,
            imei
          )
        )
      `)
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const device = booking.vehicle?.bouncie_device?.[0]
    if (!device) {
      return NextResponse.json({ 
        success: false, 
        message: 'Vehicle has no Bouncie device registered' 
      })
    }

    if (action === 'create') {
      return await createGeofence(booking, device)
    } else if (action === 'delete') {
      return await deleteGeofence(booking, device)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('[v0] Geofence API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function createGeofence(
  booking: any, 
  device: { id: string; bouncie_device_id: string; imei: string }
) {
  // Default Reno/Tahoe geofence if no specific pickup location
  const defaultCenter = { lat: 39.5296, lng: -119.8138 }
  const pickupLocation = booking.pickup_location || defaultCenter
  
  // Create geofence name based on booking
  const geofenceName = `Booking-${booking.id.substring(0, 8)}`
  
  // Geofence radius: 100 miles to cover Reno/Tahoe area
  const radiusMiles = 100

  try {
    // Call Bouncie API to create geofence
    const response = await fetch(`${BOUNCIE_API_URL}/user/geozones`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BOUNCIE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imei: device.imei,
        name: geofenceName,
        center: {
          lat: pickupLocation.lat || defaultCenter.lat,
          lon: pickupLocation.lng || defaultCenter.lng,
        },
        radius: radiusMiles * 1609.34, // Convert to meters
        notifyOnExit: true,
        notifyOnEnter: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[v0] Bouncie geofence create failed:', errorText)
      
      // Still record the attempt in database for manual handling
      await supabase.from('agent_logs').insert({
        agent_name: 'geofence_manager',
        action_type: 'create_geofence',
        input_data: { booking_id: booking.id, device_imei: device.imei },
        output_data: { error: errorText, status: response.status },
        status: 'error',
      })

      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create geofence in Bouncie' 
      })
    }

    const geofenceData = await response.json()

    // Store geofence reference in database
    await supabase.from('bouncie_geofences').insert({
      booking_id: booking.id,
      vehicle_id: booking.vehicle.id,
      device_id: device.id,
      bouncie_geozone_id: geofenceData.id,
      name: geofenceName,
      center_lat: pickupLocation.lat || defaultCenter.lat,
      center_lng: pickupLocation.lng || defaultCenter.lng,
      radius_miles: radiusMiles,
      is_active: true,
    })

    // Log success
    await supabase.from('agent_logs').insert({
      agent_name: 'geofence_manager',
      action_type: 'create_geofence',
      input_data: { booking_id: booking.id, device_imei: device.imei },
      output_data: { geofence_id: geofenceData.id, name: geofenceName },
      status: 'success',
    })

    return NextResponse.json({ 
      success: true, 
      geofence_id: geofenceData.id,
      message: `Geofence "${geofenceName}" created for booking` 
    })

  } catch (error) {
    console.error('[v0] Geofence creation error:', error)
    return NextResponse.json({ success: false, error: String(error) })
  }
}

async function deleteGeofence(
  booking: any,
  device: { id: string; bouncie_device_id: string; imei: string }
) {
  try {
    // Find existing geofence for this booking
    const { data: geofence } = await supabase
      .from('bouncie_geofences')
      .select('id, bouncie_geozone_id, name')
      .eq('booking_id', booking.id)
      .eq('is_active', true)
      .single()

    if (!geofence) {
      return NextResponse.json({ 
        success: true, 
        message: 'No active geofence found for this booking' 
      })
    }

    // Call Bouncie API to delete geofence
    const response = await fetch(
      `${BOUNCIE_API_URL}/user/geozones/${geofence.bouncie_geozone_id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.BOUNCIE_ACCESS_TOKEN}`,
        },
      }
    )

    // Mark geofence as inactive in our database regardless of API response
    await supabase
      .from('bouncie_geofences')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', geofence.id)

    // Log the action
    await supabase.from('agent_logs').insert({
      agent_name: 'geofence_manager',
      action_type: 'delete_geofence',
      input_data: { booking_id: booking.id, geofence_id: geofence.bouncie_geozone_id },
      output_data: { api_success: response.ok },
      status: 'success',
    })

    return NextResponse.json({ 
      success: true, 
      message: `Geofence "${geofence.name}" removed` 
    })

  } catch (error) {
    console.error('[v0] Geofence deletion error:', error)
    return NextResponse.json({ success: false, error: String(error) })
  }
}

// GET: List active geofences
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const vehicleId = searchParams.get('vehicle_id')
  const bookingId = searchParams.get('booking_id')

  let query = supabase
    .from('bouncie_geofences')
    .select('*')
    .eq('is_active', true)

  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId)
  }
  if (bookingId) {
    query = query.eq('booking_id', bookingId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch geofences' }, { status: 500 })
  }

  return NextResponse.json({ geofences: data })
}
