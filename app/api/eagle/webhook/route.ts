/**
 * Eagle Fleet System - Bouncie Webhook Handler
 * Receives and processes events from Bouncie GPS devices
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { processBouncieEvent, type BouncieWebhookPayload } from '@/lib/eagle/alerts'
import { saveTelemetry, saveTrip, type TelemetryPoint, type TripData } from '@/lib/eagle/telemetry'

// Bouncie event types
type EventType = 
  | 'trip-start' 
  | 'trip-end' 
  | 'trip-data'
  | 'location-update'
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
  | 'tow-alert'
  | 'crash-detected'

interface BouncieRawPayload {
  eventType: EventType
  timestamp: string
  imei: string
  vin?: string
  transactionId?: string
  trip?: {
    transactionId: string
    startTime: string
    endTime: string
    distance: number
    hardBrakes: number
    hardAccelerations: number
    speedingSeconds: number
    idleSeconds: number
    maxSpeed: number
    averageSpeed: number
    startLocation: { lat: number; lon: number; address?: string }
    endLocation: { lat: number; lon: number; address?: string }
    path?: Array<{ lat: number; lon: number; timestamp: string; speed: number }>
  }
  location?: {
    lat: number
    lon: number
    speed: number
    heading?: number
    altitude?: number
    address?: string
  }
  battery?: {
    voltage: number
    status: string
  }
  speed?: {
    current: number
    threshold: number
  }
  geofence?: {
    id: string
    name: string
    action: 'enter' | 'exit'
  }
  diagnostic?: {
    mil: boolean
    dtcCodes?: string[]
  }
}

/**
 * Validate Bouncie webhook signature
 */
function validateSignature(payload: string, signature: string): boolean {
  const secret = process.env.BOUNCIE_WEBHOOK_SECRET
  
  if (!secret) {
    console.warn('[Eagle] BOUNCIE_WEBHOOK_SECRET not configured')
    // In development, allow unsigned requests
    return process.env.NODE_ENV === 'development'
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return signature === expectedSignature || signature === `sha256=${expectedSignature}`
}

/**
 * POST handler for Bouncie webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature validation
    const rawBody = await request.text()
    const signature = request.headers.get('x-bouncie-signature') || 
                      request.headers.get('x-signature') || ''

    // Validate signature
    if (!validateSignature(rawBody, signature)) {
      console.error('[Eagle] Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse payload
    const payload: BouncieRawPayload = JSON.parse(rawBody)
    
    console.log(`[Eagle] Received event: ${payload.eventType} for ${payload.imei}`)

    // Route event to appropriate handler
    switch (payload.eventType) {
      case 'location-update':
        await handleLocationUpdate(payload)
        break

      case 'trip-end':
      case 'trip-data':
        if (payload.trip) {
          await handleTripEnd(payload)
        }
        break

      case 'trip-start':
      case 'hard-brake':
      case 'hard-accel':
      case 'speed-threshold':
      case 'geofence-enter':
      case 'geofence-exit':
      case 'mil-on':
      case 'mil-off':
      case 'low-battery':
      case 'battery-disconnect':
      case 'idle-start':
      case 'idle-end':
      case 'tow-alert':
      case 'crash-detected':
        await handleAlertEvent(payload)
        break

      default:
        console.log(`[Eagle] Unhandled event type: ${payload.eventType}`)
    }

    return NextResponse.json({ received: true, eventType: payload.eventType })

  } catch (error) {
    console.error('[Eagle] Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal processing error' }, 
      { status: 500 }
    )
  }
}

/**
 * Handle location update events
 */
async function handleLocationUpdate(payload: BouncieRawPayload): Promise<void> {
  if (!payload.location) return

  const telemetry: TelemetryPoint = {
    imei: payload.imei,
    vin: payload.vin,
    timestamp: payload.timestamp,
    lat: payload.location.lat,
    lng: payload.location.lon,
    speed: payload.location.speed,
    heading: payload.location.heading,
    altitude: payload.location.altitude,
    batteryVoltage: payload.battery?.voltage,
  }

  await saveTelemetry(telemetry)
}

/**
 * Handle trip end events with full trip data
 */
async function handleTripEnd(payload: BouncieRawPayload): Promise<void> {
  if (!payload.trip) return

  const trip: TripData = {
    transactionId: payload.trip.transactionId,
    imei: payload.imei,
    startTime: payload.trip.startTime,
    endTime: payload.trip.endTime,
    startLat: payload.trip.startLocation.lat,
    startLng: payload.trip.startLocation.lon,
    endLat: payload.trip.endLocation.lat,
    endLng: payload.trip.endLocation.lon,
    distanceMiles: payload.trip.distance,
    durationSeconds: Math.round(
      (new Date(payload.trip.endTime).getTime() - new Date(payload.trip.startTime).getTime()) / 1000
    ),
    maxSpeed: payload.trip.maxSpeed,
    averageSpeed: payload.trip.averageSpeed,
    hardBrakes: payload.trip.hardBrakes,
    hardAccelerations: payload.trip.hardAccelerations,
    speedingSeconds: payload.trip.speedingSeconds,
    idleSeconds: payload.trip.idleSeconds,
    path: payload.trip.path?.map(p => ({
      lat: p.lat,
      lng: p.lon,
      speed: p.speed,
      timestamp: p.timestamp,
    })),
  }

  const tripId = await saveTrip(trip)
  console.log(`[Eagle] Saved trip ${tripId}: ${trip.distanceMiles.toFixed(1)} miles`)

  // Also process as an alert event for the trip-end notification
  await handleAlertEvent(payload)
}

/**
 * Handle alert-worthy events
 */
async function handleAlertEvent(payload: BouncieRawPayload): Promise<void> {
  // Build the webhook payload for the alert processor
  const alertPayload: BouncieWebhookPayload = {
    eventType: payload.eventType as BouncieWebhookPayload['eventType'],
    timestamp: payload.timestamp,
    imei: payload.imei,
    vin: payload.vin,
    transactionId: payload.transactionId,
    data: {
      lat: payload.location?.lat,
      lon: payload.location?.lon,
      speed: payload.location?.speed,
      heading: payload.location?.heading,
      address: payload.location?.address,
      batteryVoltage: payload.battery?.voltage,
      currentSpeed: payload.speed?.current,
      speedThreshold: payload.speed?.threshold,
      geofenceId: payload.geofence?.id,
      geofenceName: payload.geofence?.name,
      mil: payload.diagnostic?.mil,
      dtcCodes: payload.diagnostic?.dtcCodes,
    },
  }

  const alert = await processBouncieEvent(alertPayload)
  
  if (alert) {
    console.log(`[Eagle] Created ${alert.severity} alert: ${alert.title}`)
  }
}

/**
 * GET handler for webhook verification (some services require this)
 */
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge')
  
  if (challenge) {
    // Echo back challenge for webhook verification
    return NextResponse.json({ challenge })
  }

  return NextResponse.json({ 
    status: 'Eagle Fleet System webhook active',
    timestamp: new Date().toISOString(),
  })
}
