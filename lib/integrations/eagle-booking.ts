/**
 * Eagle Fleet System - Booking Integration
 * Real-time GPS monitoring during active rentals
 */

import { createClient } from '@/lib/supabase/server'
import { isServiceLive } from '@/lib/env-check'

const GEOFENCE_RADIUS_MILES = 15
const SPEED_ALERT_THRESHOLD = 85
const MONITORING_INTERVAL_MINUTES = 30

/**
 * Activate Eagle monitoring when booking becomes active
 */
export async function activateBookingMonitoring(bookingId: string): Promise<void> {
  const supabase = await createClient()
  
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, vehicle:vehicles(*, host:profiles(*))')
    .eq('id', bookingId)
    .single()
  
  if (!booking?.vehicle?.bouncie_imei) {
    console.log(`[Eagle] No Bouncie device for booking ${bookingId}`)
    return
  }
  
  const vehicle = booking.vehicle
  
  // Register geofence around pickup location
  if (isServiceLive('BOUNCIE')) {
    const { BouncieClient } = await import('@/lib/eagle/bouncie')
    const bouncie = new BouncieClient()
    
    await bouncie.registerGeofence(
      bookingId,
      vehicle.pickup_lat || 39.5296,
      vehicle.pickup_lng || -119.8138,
      GEOFENCE_RADIUS_MILES
    )
  }
  
  // Log monitoring activation
  await supabase.from('fleet_alerts').insert({
    vehicle_id: vehicle.id,
    booking_id: bookingId,
    alert_type: 'monitoring_started',
    severity: 'info',
    title: 'Eagle Monitoring Activated',
    description: `GPS monitoring active for booking. Geofence: ${GEOFENCE_RADIUS_MILES} mile radius.`,
    is_acknowledged: true,
  })
  
  console.log(`[Eagle] Monitoring activated for booking ${bookingId}, vehicle ${vehicle.id}`)
}

/**
 * Deactivate Eagle monitoring when booking completes
 */
export async function deactivateBookingMonitoring(bookingId: string): Promise<void> {
  const supabase = await createClient()
  
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, vehicle:vehicles(*)')
    .eq('id', bookingId)
    .single()
  
  if (!booking?.vehicle?.bouncie_imei) return
  
  // Remove geofence
  if (isServiceLive('BOUNCIE')) {
    const { BouncieClient } = await import('@/lib/eagle/bouncie')
    const bouncie = new BouncieClient()
    await bouncie.removeGeofence(bookingId)
  }
  
  // Run post-trip health check via Pulse
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/pulse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'post_trip_check',
      vehicleId: booking.vehicle_id,
      bookingId,
    })
  })
  
  console.log(`[Eagle] Monitoring deactivated for booking ${bookingId}`)
}

/**
 * Process real-time alerts during booking
 */
export async function processBookingAlert(
  bookingId: string,
  alertType: 'speeding' | 'geofence_exit' | 'hard_brake' | 'crash',
  data: any
): Promise<void> {
  const supabase = await createClient()
  
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, vehicle:vehicles(*, host:profiles(*)), renter:profiles(*)')
    .eq('id', bookingId)
    .single()
  
  if (!booking) return
  
  const vehicle = booking.vehicle
  const host = vehicle.host
  
  // Determine severity and message
  let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium'
  let title = ''
  let message = ''
  let notifyHost = false
  
  switch (alertType) {
    case 'speeding':
      if (data.speed > SPEED_ALERT_THRESHOLD) {
        severity = 'high'
        title = 'Speed Alert'
        message = `${vehicle.year} ${vehicle.make} ${vehicle.model} detected traveling at ${data.speed} mph`
        notifyHost = true
      }
      break
      
    case 'geofence_exit':
      severity = 'high'
      title = 'Boundary Exit Alert'
      message = `${vehicle.year} ${vehicle.make} ${vehicle.model} has left the ${GEOFENCE_RADIUS_MILES} mile pickup zone`
      notifyHost = true
      break
      
    case 'hard_brake':
      severity = 'medium'
      title = 'Hard Brake Detected'
      message = `Hard braking event detected for ${vehicle.year} ${vehicle.make} ${vehicle.model}`
      break
      
    case 'crash':
      severity = 'critical'
      title = 'CRASH DETECTED'
      message = `Potential crash detected for ${vehicle.year} ${vehicle.make} ${vehicle.model}. Location: ${data.lat}, ${data.lng}`
      notifyHost = true
      break
  }
  
  // Create alert record
  await supabase.from('fleet_alerts').insert({
    vehicle_id: vehicle.id,
    booking_id: bookingId,
    alert_type: alertType,
    severity,
    title,
    description: message,
    location_lat: data.lat,
    location_lng: data.lng,
    metadata: data,
  })
  
  // Notify host immediately for critical alerts
  if (notifyHost && host?.phone) {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'urgent_alert',
        recipientPhone: host.phone,
        recipientEmail: host.email,
        subject: title,
        message,
        severity,
      })
    })
  }
  
  // For crashes, also notify admin and emergency contacts
  if (alertType === 'crash') {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'admin_notification',
        type: 'crash_alert',
        bookingId,
        vehicleId: vehicle.id,
        location: { lat: data.lat, lng: data.lng },
      })
    })
  }
}

/**
 * Pulse monitoring check (runs every 30 minutes during active trips)
 */
export async function pulseMonitoringCheck(vehicleId: string): Promise<void> {
  const supabase = await createClient()
  
  // Get active booking for vehicle
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, vehicle:vehicles(*, host:profiles(*))')
    .eq('vehicle_id', vehicleId)
    .eq('status', 'active')
    .single()
  
  if (!booking) return
  
  // Get latest telemetry
  const { data: telemetry } = await supabase
    .from('fleet_telemetry')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single()
  
  if (!telemetry) return
  
  // Check for issues
  const issues: string[] = []
  
  if (telemetry.speed_mph > SPEED_ALERT_THRESHOLD) {
    await processBookingAlert(booking.id, 'speeding', {
      speed: telemetry.speed_mph,
      lat: telemetry.latitude,
      lng: telemetry.longitude,
    })
  }
  
  // Check if outside geofence
  const pickupLat = booking.vehicle.pickup_lat || 39.5296
  const pickupLng = booking.vehicle.pickup_lng || -119.8138
  const distance = calculateDistance(
    pickupLat, pickupLng,
    telemetry.latitude, telemetry.longitude
  )
  
  if (distance > GEOFENCE_RADIUS_MILES) {
    await processBookingAlert(booking.id, 'geofence_exit', {
      lat: telemetry.latitude,
      lng: telemetry.longitude,
      distance,
    })
  }
}

/**
 * Calculate distance between two coordinates in miles
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
