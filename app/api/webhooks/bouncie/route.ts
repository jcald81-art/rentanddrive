import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Bouncie webhook types
type BouncieWebhookType = 
  | 'tripStart' 
  | 'tripData' 
  | 'tripMetrics' 
  | 'tripEnd' 
  | 'battery' 
  | 'mil' 
  | 'deviceConnect' 
  | 'deviceDisconnect'
  | 'vinChange'
  | 'applicationGeoZone'
  | 'userGeoZone'

interface BouncieWebhookPayload {
  eventType: BouncieWebhookType
  imei: string
  transactionId: string
  data: Record<string, unknown>
}

export async function POST(request: NextRequest) {
  // Verify webhook authorization
  const authHeader = request.headers.get('Authorization') || request.headers.get('X-Bouncie-Authorization')
  
  if (authHeader !== process.env.BOUNCIE_WEBHOOK_SECRET) {
    console.error('[v0] Bouncie webhook: Invalid authorization')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload: BouncieWebhookPayload = await request.json()
    const { eventType, imei, data } = payload

    console.log(`[v0] Bouncie webhook received: ${eventType} for IMEI ${imei}`)

    // Find the device by IMEI
    const { data: device } = await supabase
      .from('bouncie_devices')
      .select('id, vehicle_id')
      .eq('imei', imei)
      .single()

    if (!device) {
      console.log(`[v0] Bouncie webhook: Unknown device IMEI ${imei}`)
      return NextResponse.json({ status: 'device_not_registered' })
    }

    // Process based on event type
    switch (eventType) {
      case 'tripStart':
        await handleTripStart(device, data)
        break
      case 'tripData':
        await handleTripData(device, data)
        break
      case 'tripMetrics':
        await handleTripMetrics(device, data)
        break
      case 'tripEnd':
        await handleTripEnd(device, data)
        break
      case 'battery':
        await handleBatteryAlert(device, data)
        break
      case 'mil':
        await handleMilAlert(device, data)
        break
      case 'deviceConnect':
        await handleDeviceConnect(device, data)
        break
      case 'deviceDisconnect':
        await handleDeviceDisconnect(device, data)
        break
      case 'applicationGeoZone':
      case 'userGeoZone':
        await handleGeofenceEvent(device, data)
        break
      default:
        console.log(`[v0] Bouncie webhook: Unknown event type ${eventType}`)
    }

    return NextResponse.json({ status: 'processed' })
  } catch (error) {
    console.error('[v0] Bouncie webhook error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

async function handleTripStart(device: { id: string; vehicle_id: string }, data: Record<string, unknown>) {
  const tripData = data as {
    transactionId: string
    timestamp: string
    location: { lat: number; lon: number }
  }

  // Check if there's an active booking for this vehicle
  const { data: activeBooking } = await supabase
    .from('bookings')
    .select('id')
    .eq('vehicle_id', device.vehicle_id)
    .eq('status', 'active')
    .lte('start_date', new Date().toISOString())
    .gte('end_date', new Date().toISOString())
    .single()

  await supabase.from('bouncie_trips').insert({
    device_id: device.id,
    vehicle_id: device.vehicle_id,
    bouncie_trip_id: tripData.transactionId,
    start_time: tripData.timestamp,
    start_location: {
      lat: tripData.location.lat,
      lng: tripData.location.lon,
    },
    is_during_booking: !!activeBooking,
    booking_id: activeBooking?.id || null,
  })

  // If no active booking, create an alert for unauthorized use
  if (!activeBooking) {
    await createAlert(device, 'unauthorized_use', 'critical', 
      'Vehicle Moving Without Active Booking',
      `Vehicle started a trip but has no active booking. Location: ${tripData.location.lat}, ${tripData.location.lon}`,
      tripData
    )
  }
}

async function handleTripData(device: { id: string; vehicle_id: string }, data: Record<string, unknown>) {
  const locationData = data as {
    timestamp: string
    location: { lat: number; lon: number }
    speed: number
    heading: number
  }

  // Check if there's an active booking for this vehicle to get renter info
  const { data: activeBooking } = await supabase
    .from('bookings')
    .select('id, renter_id')
    .eq('vehicle_id', device.vehicle_id)
    .eq('status', 'active')
    .lte('start_date', new Date().toISOString())
    .gte('end_date', new Date().toISOString())
    .single()

  // Fire weather and traffic monitors in parallel for active rentals
  if (activeBooking) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    await Promise.all([
      fetch(`${baseUrl}/api/weather/monitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId: activeBooking.id,
          renterId: activeBooking.renter_id,
          lat: locationData.location.lat,
          lng: locationData.location.lon,
          timestamp: locationData.timestamp
        })
      }).catch(err => console.error('[Bouncie] Weather monitor failed:', err)),
      fetch(`${baseUrl}/api/traffic/monitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalId: activeBooking.id,
          vehicleId: device.vehicle_id,
          renterId: activeBooking.renter_id,
          lat: locationData.location.lat,
          lng: locationData.location.lon,
          timestamp: locationData.timestamp
        })
      }).catch(err => console.error('[Bouncie] Traffic monitor failed:', err))
    ])
  }

  // Store location
  await supabase.from('bouncie_locations').insert({
    device_id: device.id,
    vehicle_id: device.vehicle_id,
    latitude: locationData.location.lat,
    longitude: locationData.location.lon,
    speed_mph: locationData.speed,
    heading: locationData.heading,
    recorded_at: locationData.timestamp,
  })

  // Check for speeding (over 90 mph)
  if (locationData.speed > 90) {
    await createAlert(device, 'speeding', 'warning',
      'High Speed Detected',
      `Vehicle traveling at ${locationData.speed} mph`,
      locationData
    )
  }

  // Update device last seen
  await supabase
    .from('bouncie_devices')
    .update({ last_seen_at: locationData.timestamp })
    .eq('id', device.id)
}

async function handleTripMetrics(device: { id: string; vehicle_id: string }, data: Record<string, unknown>) {
  const metrics = data as {
    transactionId: string
    hardBrakes: number
    hardAccelerations: number
    idleTime: number
    maxSpeed: number
    averageSpeed: number
    distance: number
  }

  // Update trip with metrics
  await supabase
    .from('bouncie_trips')
    .update({
      hard_brakes: metrics.hardBrakes,
      hard_accelerations: metrics.hardAccelerations,
      idle_time_minutes: Math.round(metrics.idleTime / 60),
      max_speed_mph: metrics.maxSpeed,
      avg_speed_mph: metrics.averageSpeed,
      distance_miles: metrics.distance,
    })
    .eq('bouncie_trip_id', metrics.transactionId)

  // Alert for harsh driving
  if (metrics.hardBrakes > 5 || metrics.hardAccelerations > 5) {
    await createAlert(device, 'harsh_driving', 'warning',
      'Harsh Driving Detected',
      `Trip had ${metrics.hardBrakes} hard brakes and ${metrics.hardAccelerations} hard accelerations`,
      metrics
    )
  }
}

async function handleTripEnd(device: { id: string; vehicle_id: string }, data: Record<string, unknown>) {
  const tripEnd = data as {
    transactionId: string
    timestamp: string
    location: { lat: number; lon: number }
  }

  await supabase
    .from('bouncie_trips')
    .update({
      end_time: tripEnd.timestamp,
      end_location: {
        lat: tripEnd.location.lat,
        lng: tripEnd.location.lon,
      },
    })
    .eq('bouncie_trip_id', tripEnd.transactionId)
}

async function handleBatteryAlert(device: { id: string; vehicle_id: string }, data: Record<string, unknown>) {
  const batteryData = data as {
    voltage: number
    timestamp: string
  }

  // Update device battery
  await supabase
    .from('bouncie_devices')
    .update({ 
      battery_voltage: batteryData.voltage,
      last_seen_at: batteryData.timestamp,
    })
    .eq('id', device.id)

  // Alert for low battery (under 12V)
  if (batteryData.voltage < 12) {
    await createAlert(device, 'low_battery', batteryData.voltage < 11 ? 'critical' : 'warning',
      'Low Vehicle Battery',
      `Battery voltage at ${batteryData.voltage}V - vehicle may not start`,
      batteryData
    )
  }
}

async function handleMilAlert(device: { id: string; vehicle_id: string }, data: Record<string, unknown>) {
  const milData = data as {
    codes: string[]
    timestamp: string
  }

  await createAlert(device, 'mil_on', 'critical',
    'Check Engine Light On',
    `Diagnostic codes: ${milData.codes.join(', ')}`,
    milData
  )
}

async function handleDeviceConnect(device: { id: string; vehicle_id: string }, data: Record<string, unknown>) {
  const connectData = data as { timestamp: string }
  
  await supabase
    .from('bouncie_devices')
    .update({ 
      is_active: true,
      last_seen_at: connectData.timestamp,
    })
    .eq('id', device.id)
}

async function handleDeviceDisconnect(device: { id: string; vehicle_id: string }, data: Record<string, unknown>) {
  const disconnectData = data as { timestamp: string }
  
  await supabase
    .from('bouncie_devices')
    .update({ is_active: false })
    .eq('id', device.id)

  await createAlert(device, 'device_disconnect', 'warning',
    'GPS Tracker Disconnected',
    'The Bouncie device has been disconnected from the vehicle',
    disconnectData
  )
}

async function handleGeofenceEvent(device: { id: string; vehicle_id: string }, data: Record<string, unknown>) {
  const geoData = data as {
    zoneName: string
    eventType: 'enter' | 'exit'
    timestamp: string
    location: { lat: number; lon: number }
  }

  if (geoData.eventType === 'exit') {
    await createAlert(device, 'geofence_exit', 'warning',
      `Vehicle Left: ${geoData.zoneName}`,
      `Vehicle exited the ${geoData.zoneName} geofence area`,
      geoData
    )
  }
}

async function createAlert(
  device: { id: string; vehicle_id: string },
  alertType: string,
  severity: 'info' | 'warning' | 'critical',
  title: string,
  description: string,
  data: Record<string, unknown>
) {
  // Get vehicle info for alert message
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('make, model, year, license_plate')
    .eq('id', device.vehicle_id)
    .single()

  const vehicleName = vehicle 
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.license_plate || 'No plate'})`
    : `Vehicle ID: ${device.vehicle_id}`

  // Insert alert
  const { data: alert } = await supabase
    .from('bouncie_alerts')
    .insert({
      device_id: device.id,
      vehicle_id: device.vehicle_id,
      alert_type: alertType,
      severity,
      title,
      description,
      data,
    })
    .select()
    .single()

  // For critical alerts, send SMS to owner and trigger fleet monitor
  if (severity === 'critical' && alert) {
    // Send SMS alert to joe@rentanddrive.net owner phone
    await sendCriticalSmsAlert(vehicleName, title, description, alertType)

    // Trigger fleet monitoring agent
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/agents/fleet-monitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alert.id }),
      })
    } catch (error) {
      console.error('[v0] Failed to trigger fleet monitor agent:', error)
    }
  }

  // Log to agent_logs
  await supabase.from('agent_logs').insert({
    agent_name: 'bouncie_webhook',
    action_type: `alert_${alertType}`,
    input_data: data,
    output_data: { alert_id: alert?.id, severity, title, sms_sent: severity === 'critical' },
    status: 'completed',
  })
}

// Send critical SMS alert to fleet owner
async function sendCriticalSmsAlert(
  vehicleName: string,
  title: string,
  description: string,
  alertType: string
) {
  const ownerPhone = process.env.FLEET_OWNER_PHONE // joe@rentanddrive.net's phone
  
  if (!ownerPhone || !process.env.TWILIO_ACCOUNT_SID) {
    console.log('[v0] SMS alert skipped - no phone or Twilio configured')
    return
  }

  const message = `[R&D ALERT] ${title}\n${vehicleName}\n${description}`

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`
    
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: ownerPhone,
        From: process.env.TWILIO_PHONE_NUMBER!,
        Body: message,
      }),
    })

    if (!response.ok) {
      console.error('[v0] SMS alert failed:', await response.text())
    } else {
      console.log(`[v0] Critical SMS alert sent for ${alertType}`)
    }
  } catch (error) {
    console.error('[v0] SMS alert error:', error)
  }
}
