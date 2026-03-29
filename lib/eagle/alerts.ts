/**
 * Eagle Fleet System - Alert Processor
 * Processes Bouncie webhook events and creates fleet alerts
 */

import { createClient } from '@/lib/supabase/server'

// Alert severity levels
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

// Bouncie event types we handle
export type BouncieEventType = 
  | 'trip-start'
  | 'trip-end'
  | 'hard-brake'
  | 'hard-accel'
  | 'speed-threshold'
  | 'geofence-enter'
  | 'geofence-exit'
  | 'mil-on'
  | 'mil-off'
  | 'low-battery'
  | 'battery-disconnect'
  | 'idle-start'
  | 'idle-end'
  | 'location-update'
  | 'tow-alert'
  | 'crash-detected'

interface BouncieWebhookPayload {
  eventType: BouncieEventType
  timestamp: string
  imei: string
  vin?: string
  transactionId?: string
  data: {
    lat?: number
    lon?: number
    speed?: number
    heading?: number
    address?: string
    geofenceId?: string
    geofenceName?: string
    speedThreshold?: number
    currentSpeed?: number
    batteryVoltage?: number
    mil?: boolean
    dtcCodes?: string[]
    [key: string]: unknown
  }
}

interface ProcessedAlert {
  id: string
  severity: AlertSeverity
  type: string
  title: string
  description: string
  vehicle_id?: string
  booking_id?: string
  renter_id?: string
  host_id?: string
  requires_action: boolean
  notified: boolean
}

/**
 * Classify event severity based on type and context
 */
function classifySeverity(eventType: BouncieEventType, data: BouncieWebhookPayload['data']): AlertSeverity {
  switch (eventType) {
    case 'crash-detected':
    case 'tow-alert':
      return 'critical'
    
    case 'battery-disconnect':
    case 'mil-on':
    case 'geofence-exit':
      return 'high'
    
    case 'speed-threshold':
      const speed = data.currentSpeed || 0
      if (speed > 100) return 'critical'
      if (speed > 90) return 'high'
      return 'medium'
    
    case 'hard-brake':
    case 'hard-accel':
      return 'medium'
    
    case 'low-battery':
    case 'idle-start':
      return 'low'
    
    case 'trip-start':
    case 'trip-end':
    case 'geofence-enter':
    case 'location-update':
    case 'mil-off':
    case 'idle-end':
    default:
      return 'info'
  }
}

/**
 * Generate human-readable alert title and description
 */
function generateAlertContent(
  eventType: BouncieEventType, 
  data: BouncieWebhookPayload['data'],
  vehicleInfo?: { make: string; model: string; year: number; license_plate: string }
): { title: string; description: string } {
  const vehicleName = vehicleInfo 
    ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.license_plate})`
    : 'Vehicle'

  switch (eventType) {
    case 'crash-detected':
      return {
        title: `CRASH DETECTED - ${vehicleName}`,
        description: `A potential crash has been detected. Location: ${data.address || `${data.lat}, ${data.lon}`}. Immediate attention required.`,
      }
    
    case 'tow-alert':
      return {
        title: `TOW ALERT - ${vehicleName}`,
        description: `Vehicle appears to be moving without engine running (possible tow). Last known location: ${data.address || `${data.lat}, ${data.lon}`}.`,
      }
    
    case 'battery-disconnect':
      return {
        title: `Battery Disconnected - ${vehicleName}`,
        description: `GPS tracker battery has been disconnected. This may indicate tampering or maintenance.`,
      }
    
    case 'geofence-exit':
      return {
        title: `Geofence Violation - ${vehicleName}`,
        description: `Vehicle has exited the permitted area "${data.geofenceName || 'Rental Zone'}". Current location: ${data.address || `${data.lat}, ${data.lon}`}.`,
      }
    
    case 'speed-threshold':
      return {
        title: `Speed Alert - ${vehicleName}`,
        description: `Vehicle traveling at ${data.currentSpeed} mph, exceeding the ${data.speedThreshold || 85} mph threshold.`,
      }
    
    case 'hard-brake':
      return {
        title: `Hard Brake Event - ${vehicleName}`,
        description: `Hard braking detected at ${data.speed || 0} mph. Location: ${data.address || `${data.lat}, ${data.lon}`}.`,
      }
    
    case 'hard-accel':
      return {
        title: `Hard Acceleration - ${vehicleName}`,
        description: `Aggressive acceleration detected. Location: ${data.address || `${data.lat}, ${data.lon}`}.`,
      }
    
    case 'mil-on':
      return {
        title: `Check Engine Light ON - ${vehicleName}`,
        description: `Check engine light has been triggered. DTC codes: ${data.dtcCodes?.join(', ') || 'Unknown'}.`,
      }
    
    case 'low-battery':
      return {
        title: `Low Battery Warning - ${vehicleName}`,
        description: `Vehicle battery voltage low at ${data.batteryVoltage}V. May need charging or replacement.`,
      }
    
    case 'trip-start':
      return {
        title: `Trip Started - ${vehicleName}`,
        description: `New trip started from ${data.address || `${data.lat}, ${data.lon}`}.`,
      }
    
    case 'trip-end':
      return {
        title: `Trip Ended - ${vehicleName}`,
        description: `Trip completed at ${data.address || `${data.lat}, ${data.lon}`}.`,
      }
    
    default:
      return {
        title: `${eventType} - ${vehicleName}`,
        description: `Event recorded at ${data.address || `${data.lat}, ${data.lon}`}.`,
      }
  }
}

/**
 * Process a Bouncie webhook event and create appropriate alerts
 */
export async function processBouncieEvent(payload: BouncieWebhookPayload): Promise<ProcessedAlert | null> {
  const supabase = await createClient()
  
  try {
    // Look up the vehicle by IMEI or VIN
    let vehicle = null
    if (payload.vin) {
      const { data } = await supabase
        .from('vehicles')
        .select('id, make, model, year, license_plate, host_id, bouncie_imei')
        .eq('vin', payload.vin)
        .single()
      vehicle = data
    } else if (payload.imei) {
      const { data } = await supabase
        .from('vehicles')
        .select('id, make, model, year, license_plate, host_id, bouncie_imei')
        .eq('bouncie_imei', payload.imei)
        .single()
      vehicle = data
    }

    if (!vehicle) {
      console.warn('[Eagle] Unknown vehicle for event:', payload.imei || payload.vin)
      return null
    }

    // Find active booking for this vehicle
    const { data: activeBooking } = await supabase
      .from('bookings')
      .select('id, renter_id')
      .eq('vehicle_id', vehicle.id)
      .eq('status', 'active')
      .single()

    // Classify severity
    const severity = classifySeverity(payload.eventType, payload.data)
    
    // Generate alert content
    const { title, description } = generateAlertContent(
      payload.eventType, 
      payload.data,
      vehicle
    )

    // Determine if this alert requires action
    const requiresAction = ['critical', 'high'].includes(severity)

    // Skip info-level events (just log telemetry, don't create alerts)
    if (severity === 'info') {
      return null
    }

    // Create the alert
    const { data: alert, error } = await supabase
      .from('fleet_alerts')
      .insert({
        vehicle_id: vehicle.id,
        booking_id: activeBooking?.id || null,
        alert_type: payload.eventType,
        severity,
        title,
        description,
        location_lat: payload.data.lat,
        location_lng: payload.data.lon,
        location_address: payload.data.address,
        raw_data: payload.data,
        requires_action: requiresAction,
        is_resolved: false,
        is_acknowledged: false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Eagle] Failed to create alert:', error)
      return null
    }

    const processedAlert: ProcessedAlert = {
      id: alert.id,
      severity,
      type: payload.eventType,
      title,
      description,
      vehicle_id: vehicle.id,
      booking_id: activeBooking?.id,
      renter_id: activeBooking?.renter_id,
      host_id: vehicle.host_id,
      requires_action: requiresAction,
      notified: false,
    }

    // For critical/high alerts, trigger immediate notification via SecureLink
    if (['critical', 'high'].includes(severity)) {
      await sendAlertNotification(processedAlert, vehicle, activeBooking)
      processedAlert.notified = true

      // Update alert as notified
      await supabase
        .from('fleet_alerts')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', alert.id)
    }

    return processedAlert
  } catch (error) {
    console.error('[Eagle] Error processing event:', error)
    return null
  }
}

/**
 * Send SMS notification for critical alerts via SecureLink
 */
async function sendAlertNotification(
  alert: ProcessedAlert,
  vehicle: { make: string; model: string; year: number; license_plate: string; host_id: string },
  activeBooking: { id: string; renter_id: string } | null
): Promise<void> {
  const supabase = await createClient()

  try {
    // Get host phone number
    const { data: host } = await supabase
      .from('profiles')
      .select('phone, full_name')
      .eq('id', vehicle.host_id)
      .single()

    if (host?.phone && process.env.TWILIO_ACCOUNT_SID) {
      // Send SMS via Twilio
      const twilioClient = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      )

      const message = `🚨 ${alert.title}\n\n${alert.description}\n\nView details: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/fleet-alerts\n\n— SecureLink | R&D Intelligence System`

      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: host.phone,
      })

      console.log('[Eagle] Alert SMS sent to host:', host.full_name)
    }

    // Also notify admin for critical alerts
    if (alert.severity === 'critical' && process.env.ADMIN_PHONE) {
      const twilioClient = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      )

      await twilioClient.messages.create({
        body: `🚨 CRITICAL: ${alert.title}\n\n${alert.description}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: process.env.ADMIN_PHONE,
      })
    }

    // Create in-app notification
    await supabase.from('notifications').insert({
      user_id: vehicle.host_id,
      type: 'fleet_alert',
      title: alert.title,
      message: alert.description,
      data: {
        alert_id: alert.id,
        vehicle_id: alert.vehicle_id,
        severity: alert.severity,
      },
      priority: alert.severity === 'critical' ? 'urgent' : 'high',
    })

  } catch (error) {
    console.error('[Eagle] Failed to send alert notification:', error)
  }
}

/**
 * Get active alerts for a vehicle
 */
export async function getVehicleAlerts(vehicleId: string): Promise<Array<{
  id: string
  type: string
  severity: AlertSeverity
  title: string
  description: string
  created_at: string
  is_resolved: boolean
}>> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('fleet_alerts')
    .select('id, alert_type, severity, title, description, created_at, is_resolved')
    .eq('vehicle_id', vehicleId)
    .eq('is_resolved', false)
    .order('created_at', { ascending: false })
    .limit(50)

  return (data || []).map(row => ({
    id: row.id,
    type: row.alert_type,
    severity: row.severity as AlertSeverity,
    title: row.title,
    description: row.description,
    created_at: row.created_at,
    is_resolved: row.is_resolved,
  }))
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
  alertId: string, 
  userId: string,
  notes?: string
): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('fleet_alerts')
    .update({
      is_acknowledged: true,
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
      notes,
    })
    .eq('id', alertId)

  return !error
}

/**
 * Resolve an alert
 */
export async function resolveAlert(
  alertId: string,
  userId: string,
  resolution: string
): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('fleet_alerts')
    .update({
      is_resolved: true,
      resolved_by: userId,
      resolved_at: new Date().toISOString(),
      resolution_notes: resolution,
    })
    .eq('id', alertId)

  return !error
}

export type { BouncieWebhookPayload, ProcessedAlert }
