/**
 * Smartcar Unified Vehicle API Integration
 * Handles vehicle connectivity, telemetry, and control for all supported makes
 */

import { createClient } from '@/lib/supabase/server'
import { recordBlockchainEvent } from '@/lib/blockchain'

const SMARTCAR_CLIENT_ID = process.env.SMARTCAR_CLIENT_ID
const SMARTCAR_CLIENT_SECRET = process.env.SMARTCAR_CLIENT_SECRET
const SMARTCAR_REDIRECT_URI = process.env.SMARTCAR_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/smartcar/callback`

interface SmartcarVehicle {
  id: string
  vin: string
  make: string
  model: string
  year: number
}

interface SmartcarTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export async function getAuthUrl(vehicleId: string, hostId: string): Promise<string> {
  const state = Buffer.from(JSON.stringify({ vehicleId, hostId })).toString('base64')
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SMARTCAR_CLIENT_ID || 'demo_client',
    redirect_uri: SMARTCAR_REDIRECT_URI,
    scope: [
      'read_vehicle_info',
      'read_odometer',
      'read_location',
      'read_fuel',
      'read_battery',
      'read_charge',
      'read_tires',
      'control_security',
      'control_charge',
    ].join(' '),
    state,
    mode: process.env.NODE_ENV === 'production' ? 'live' : 'test',
  })

  return `https://connect.smartcar.com/oauth/authorize?${params.toString()}`
}

export async function exchangeCode(code: string): Promise<SmartcarTokens | null> {
  if (!SMARTCAR_CLIENT_ID || !SMARTCAR_CLIENT_SECRET) {
    // Mock mode
    return {
      access_token: `mock_access_${Date.now()}`,
      refresh_token: `mock_refresh_${Date.now()}`,
      expires_in: 7200,
      token_type: 'Bearer',
    }
  }

  try {
    const response = await fetch('https://auth.smartcar.com/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${SMARTCAR_CLIENT_ID}:${SMARTCAR_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SMARTCAR_REDIRECT_URI,
      }),
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${await response.text()}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[v0] Smartcar token exchange failed:', error)
    return null
  }
}

export async function refreshTokens(refreshToken: string): Promise<SmartcarTokens | null> {
  if (!SMARTCAR_CLIENT_ID || !SMARTCAR_CLIENT_SECRET) {
    // Mock mode
    return {
      access_token: `mock_access_${Date.now()}`,
      refresh_token: `mock_refresh_${Date.now()}`,
      expires_in: 7200,
      token_type: 'Bearer',
    }
  }

  try {
    const response = await fetch('https://auth.smartcar.com/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${SMARTCAR_CLIENT_ID}:${SMARTCAR_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${await response.text()}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[v0] Smartcar token refresh failed:', error)
    return null
  }
}

export async function getVehicleIds(accessToken: string): Promise<string[]> {
  if (accessToken.startsWith('mock_')) {
    return ['mock_vehicle_1']
  }

  try {
    const response = await fetch('https://api.smartcar.com/v2.0/vehicles', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    if (!response.ok) throw new Error('Failed to get vehicles')

    const data = await response.json()
    return data.vehicles || []
  } catch (error) {
    console.error('[v0] Failed to get Smartcar vehicles:', error)
    return []
  }
}

export async function getVehicleInfo(accessToken: string, smartcarVehicleId: string): Promise<SmartcarVehicle | null> {
  if (accessToken.startsWith('mock_')) {
    return {
      id: smartcarVehicleId,
      vin: 'MOCK12345678901234',
      make: 'Tesla',
      model: 'Model 3',
      year: 2023,
    }
  }

  try {
    const response = await fetch(`https://api.smartcar.com/v2.0/vehicles/${smartcarVehicleId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    if (!response.ok) throw new Error('Failed to get vehicle info')

    return await response.json()
  } catch (error) {
    console.error('[v0] Failed to get Smartcar vehicle info:', error)
    return null
  }
}

export async function getVehicleTelemetry(vehicleId: string): Promise<{
  odometer?: number
  fuelPercent?: number
  batteryPercent?: number
  batteryRange?: number
  isCharging?: boolean
  chargeState?: string
  latitude?: number
  longitude?: number
  isLocked?: boolean
  tirePressure?: Record<string, number>
} | null> {
  const supabase = await createClient()

  // Get connection and refresh token if needed
  const { data: connection } = await supabase
    .from('smartcar_connections')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .single()

  if (!connection) return null

  // Check if token needs refresh
  if (new Date(connection.token_expires_at) < new Date()) {
    const newTokens = await refreshTokens(connection.refresh_token_encrypted)
    if (!newTokens) {
      await supabase
        .from('smartcar_connections')
        .update({ sync_error: 'Token refresh failed' })
        .eq('id', connection.id)
      return null
    }

    await supabase
      .from('smartcar_connections')
      .update({
        access_token_encrypted: newTokens.access_token,
        refresh_token_encrypted: newTokens.refresh_token,
        token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
      })
      .eq('id', connection.id)

    connection.access_token_encrypted = newTokens.access_token
  }

  const accessToken = connection.access_token_encrypted

  // Mock data for development
  if (accessToken.startsWith('mock_')) {
    const mockTelemetry = {
      odometer: 12500 + Math.random() * 100,
      batteryPercent: 65 + Math.random() * 30,
      batteryRange: 180 + Math.random() * 50,
      isCharging: Math.random() > 0.7,
      chargeState: 'not_charging',
      latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
      longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
      isLocked: true,
    }

    // Store telemetry
    await supabase.from('smartcar_telemetry').insert({
      vehicle_id: vehicleId,
      smartcar_connection_id: connection.id,
      odometer_km: mockTelemetry.odometer,
      battery_percent: mockTelemetry.batteryPercent,
      battery_range_km: mockTelemetry.batteryRange,
      is_charging: mockTelemetry.isCharging,
      charge_state: mockTelemetry.chargeState,
      latitude: mockTelemetry.latitude,
      longitude: mockTelemetry.longitude,
      is_locked: mockTelemetry.isLocked,
    })

    // Update vehicle
    await supabase
      .from('vehicles')
      .update({
        current_battery_percent: mockTelemetry.batteryPercent,
        current_range_km: mockTelemetry.batteryRange,
      })
      .eq('id', vehicleId)

    await supabase
      .from('smartcar_connections')
      .update({ last_sync_at: new Date().toISOString(), sync_error: null })
      .eq('id', connection.id)

    return mockTelemetry
  }

  // Real API calls
  try {
    const vehicleUrl = `https://api.smartcar.com/v2.0/vehicles/${connection.smartcar_vehicle_id}`
    const headers = { 'Authorization': `Bearer ${accessToken}` }

    const [odometerRes, batteryRes, locationRes, lockRes] = await Promise.allSettled([
      fetch(`${vehicleUrl}/odometer`, { headers }),
      fetch(`${vehicleUrl}/battery`, { headers }),
      fetch(`${vehicleUrl}/location`, { headers }),
      fetch(`${vehicleUrl}/security`, { headers }),
    ])

    const telemetry: Record<string, unknown> = {}

    if (odometerRes.status === 'fulfilled' && odometerRes.value.ok) {
      const data = await odometerRes.value.json()
      telemetry.odometer = data.distance
    }

    if (batteryRes.status === 'fulfilled' && batteryRes.value.ok) {
      const data = await batteryRes.value.json()
      telemetry.batteryPercent = data.percentRemaining * 100
      telemetry.batteryRange = data.range
      telemetry.isCharging = data.isPluggedIn
    }

    if (locationRes.status === 'fulfilled' && locationRes.value.ok) {
      const data = await locationRes.value.json()
      telemetry.latitude = data.latitude
      telemetry.longitude = data.longitude
    }

    if (lockRes.status === 'fulfilled' && lockRes.value.ok) {
      const data = await lockRes.value.json()
      telemetry.isLocked = data.isLocked
    }

    // Store telemetry
    await supabase.from('smartcar_telemetry').insert({
      vehicle_id: vehicleId,
      smartcar_connection_id: connection.id,
      odometer_km: telemetry.odometer,
      battery_percent: telemetry.batteryPercent,
      battery_range_km: telemetry.batteryRange,
      is_charging: telemetry.isCharging,
      latitude: telemetry.latitude,
      longitude: telemetry.longitude,
      is_locked: telemetry.isLocked,
    })

    // Update vehicle
    if (telemetry.batteryPercent !== undefined) {
      await supabase
        .from('vehicles')
        .update({
          current_battery_percent: telemetry.batteryPercent,
          current_range_km: telemetry.batteryRange,
        })
        .eq('id', vehicleId)
    }

    await supabase
      .from('smartcar_connections')
      .update({ last_sync_at: new Date().toISOString(), sync_error: null })
      .eq('id', connection.id)

    return telemetry as ReturnType<typeof getVehicleTelemetry> extends Promise<infer T> ? T : never
  } catch (error) {
    console.error('[v0] Failed to get telemetry:', error)
    await supabase
      .from('smartcar_connections')
      .update({ sync_error: String(error) })
      .eq('id', connection.id)
    return null
  }
}

export async function lockVehicle(vehicleId: string): Promise<{ success: boolean; error?: string }> {
  return controlSecurity(vehicleId, 'LOCK')
}

export async function unlockVehicle(vehicleId: string): Promise<{ success: boolean; error?: string }> {
  return controlSecurity(vehicleId, 'UNLOCK')
}

async function controlSecurity(vehicleId: string, action: 'LOCK' | 'UNLOCK'): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: connection } = await supabase
    .from('smartcar_connections')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .single()

  if (!connection) {
    return { success: false, error: 'Vehicle not connected' }
  }

  const accessToken = connection.access_token_encrypted

  // Mock mode
  if (accessToken.startsWith('mock_')) {
    // Record blockchain event for lock/unlock
    await recordBlockchainEvent({
      vehicleId,
      eventType: action === 'LOCK' ? 'rental_end' : 'rental_start',
      eventData: { action, source: 'smartcar', timestamp: new Date().toISOString() },
    })
    return { success: true }
  }

  try {
    const response = await fetch(
      `https://api.smartcar.com/v2.0/vehicles/${connection.smartcar_vehicle_id}/security`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      }
    )

    if (!response.ok) {
      throw new Error(`Security control failed: ${await response.text()}`)
    }

    // Record blockchain event
    await recordBlockchainEvent({
      vehicleId,
      eventType: action === 'LOCK' ? 'rental_end' : 'rental_start',
      eventData: { action, source: 'smartcar', timestamp: new Date().toISOString() },
    })

    return { success: true }
  } catch (error) {
    console.error('[v0] Smartcar security control failed:', error)
    return { success: false, error: String(error) }
  }
}

export async function connectVehicle(
  vehicleId: string,
  hostId: string,
  tokens: SmartcarTokens,
  smartcarVehicleId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // Get vehicle info
    const vehicleInfo = await getVehicleInfo(tokens.access_token, smartcarVehicleId)

    if (!vehicleInfo) {
      return { success: false, error: 'Failed to get vehicle info' }
    }

    // Check if it's an EV
    const evMakes = ['tesla', 'rivian', 'lucid', 'polestar', 'bmw i', 'audi e-tron', 'ford mustang mach-e', 'chevrolet bolt']
    const isEv = evMakes.some(make => 
      vehicleInfo.make.toLowerCase().includes(make) || 
      vehicleInfo.model.toLowerCase().includes('electric')
    )

    // Create connection
    await supabase.from('smartcar_connections').upsert({
      vehicle_id: vehicleId,
      host_id: hostId,
      smartcar_vehicle_id: smartcarVehicleId,
      access_token_encrypted: tokens.access_token,
      refresh_token_encrypted: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      vin: vehicleInfo.vin,
      make: vehicleInfo.make,
      model: vehicleInfo.model,
      year: vehicleInfo.year,
      is_ev: isEv,
      capabilities: ['read_odometer', 'read_location', 'read_battery', 'control_security'],
    }, {
      onConflict: 'vehicle_id',
    })

    // Update vehicle
    await supabase
      .from('vehicles')
      .update({
        smartcar_connected: true,
        is_ev: isEv,
      })
      .eq('id', vehicleId)

    return { success: true }
  } catch (error) {
    console.error('[v0] Smartcar connection failed:', error)
    return { success: false, error: String(error) }
  }
}
