/**
 * Tesla Fleet API Integration
 * Handles Tesla-specific features beyond Smartcar capabilities
 */

import { createClient } from '@/lib/supabase/server'
import { recordBlockchainEvent } from '@/lib/blockchain'

const TESLA_FLEET_API_URL = process.env.TESLA_FLEET_API_URL || 'https://fleet-api.prd.na.vn.cloud.tesla.com'
const TESLA_CLIENT_ID = process.env.TESLA_CLIENT_ID
const TESLA_CLIENT_SECRET = process.env.TESLA_CLIENT_SECRET

interface TeslaVehicle {
  id: string
  vehicle_id: number
  vin: string
  display_name: string
  state: string
}

interface TeslaTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

export async function getAuthUrl(vehicleId: string, hostId: string): Promise<string> {
  const state = Buffer.from(JSON.stringify({ vehicleId, hostId, provider: 'tesla' })).toString('base64')
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: TESLA_CLIENT_ID || 'demo_client',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/tesla/callback`,
    scope: 'openid offline_access vehicle_device_data vehicle_cmds vehicle_charging_cmds',
    state,
  })

  return `https://auth.tesla.com/oauth2/v3/authorize?${params.toString()}`
}

export async function exchangeCode(code: string): Promise<TeslaTokens | null> {
  if (!TESLA_CLIENT_ID || !TESLA_CLIENT_SECRET) {
    return {
      access_token: `mock_tesla_access_${Date.now()}`,
      refresh_token: `mock_tesla_refresh_${Date.now()}`,
      expires_in: 28800,
    }
  }

  try {
    const response = await fetch('https://auth.tesla.com/oauth2/v3/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: TESLA_CLIENT_ID,
        client_secret: TESLA_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/tesla/callback`,
      }),
    })

    if (!response.ok) throw new Error(await response.text())
    return await response.json()
  } catch (error) {
    console.error('[v0] Tesla token exchange failed:', error)
    return null
  }
}

export async function getVehicles(accessToken: string): Promise<TeslaVehicle[]> {
  if (accessToken.startsWith('mock_')) {
    return [{
      id: 'mock_tesla_1',
      vehicle_id: 123456789,
      vin: 'MOCKTESLAVIN12345',
      display_name: 'My Tesla',
      state: 'online',
    }]
  }

  try {
    const response = await fetch(`${TESLA_FLEET_API_URL}/api/1/vehicles`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    if (!response.ok) throw new Error(await response.text())
    const data = await response.json()
    return data.response || []
  } catch (error) {
    console.error('[v0] Failed to get Tesla vehicles:', error)
    return []
  }
}

export async function getVehicleData(vehicleId: string): Promise<{
  chargeState?: {
    batteryLevel: number
    batteryRange: number
    chargingState: string
    chargePortOpen: boolean
    chargerPower: number
    minutesToFullCharge: number
    superchargerSessionActive: boolean
  }
  climateState?: {
    insideTemp: number
    outsideTemp: number
    isPreconditioning: boolean
    isClimateOn: boolean
  }
  vehicleState?: {
    locked: boolean
    sentryMode: boolean
    softwareVersion: string
    odometer: number
  }
  driveState?: {
    latitude: number
    longitude: number
    heading: number
    speed: number | null
  }
} | null> {
  const supabase = await createClient()

  const { data: connection } = await supabase
    .from('tesla_fleet_connections')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .single()

  if (!connection) return null

  const accessToken = connection.access_token_encrypted

  // Mock data
  if (accessToken.startsWith('mock_')) {
    const mockData = {
      chargeState: {
        batteryLevel: 72,
        batteryRange: 205,
        chargingState: 'Disconnected',
        chargePortOpen: false,
        chargerPower: 0,
        minutesToFullCharge: 0,
        superchargerSessionActive: false,
      },
      climateState: {
        insideTemp: 21,
        outsideTemp: 18,
        isPreconditioning: false,
        isClimateOn: false,
      },
      vehicleState: {
        locked: true,
        sentryMode: true,
        softwareVersion: '2024.44.25',
        odometer: 15234,
      },
      driveState: {
        latitude: 37.7749,
        longitude: -122.4194,
        heading: 180,
        speed: null,
      },
    }

    await supabase
      .from('tesla_fleet_connections')
      .update({
        charge_state: mockData.chargeState,
        climate_state: mockData.climateState,
        vehicle_state: mockData.vehicleState,
        drive_state: mockData.driveState,
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', connection.id)

    return mockData
  }

  try {
    const response = await fetch(
      `${TESLA_FLEET_API_URL}/api/1/vehicles/${connection.tesla_vehicle_id}/vehicle_data`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    )

    if (!response.ok) throw new Error(await response.text())

    const { response: data } = await response.json()

    const result = {
      chargeState: data.charge_state ? {
        batteryLevel: data.charge_state.battery_level,
        batteryRange: data.charge_state.battery_range,
        chargingState: data.charge_state.charging_state,
        chargePortOpen: data.charge_state.charge_port_door_open,
        chargerPower: data.charge_state.charger_power,
        minutesToFullCharge: data.charge_state.minutes_to_full_charge,
        superchargerSessionActive: data.charge_state.fast_charger_present,
      } : undefined,
      climateState: data.climate_state ? {
        insideTemp: data.climate_state.inside_temp,
        outsideTemp: data.climate_state.outside_temp,
        isPreconditioning: data.climate_state.is_preconditioning,
        isClimateOn: data.climate_state.is_climate_on,
      } : undefined,
      vehicleState: data.vehicle_state ? {
        locked: data.vehicle_state.locked,
        sentryMode: data.vehicle_state.sentry_mode,
        softwareVersion: data.vehicle_state.car_version,
        odometer: data.vehicle_state.odometer,
      } : undefined,
      driveState: data.drive_state ? {
        latitude: data.drive_state.latitude,
        longitude: data.drive_state.longitude,
        heading: data.drive_state.heading,
        speed: data.drive_state.speed,
      } : undefined,
    }

    await supabase
      .from('tesla_fleet_connections')
      .update({
        charge_state: result.chargeState,
        climate_state: result.climateState,
        vehicle_state: result.vehicleState,
        drive_state: result.driveState,
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', connection.id)

    return result
  } catch (error) {
    console.error('[v0] Failed to get Tesla vehicle data:', error)
    return null
  }
}

export async function preconditionVehicle(vehicleId: string, enable: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: connection } = await supabase
    .from('tesla_fleet_connections')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .single()

  if (!connection) {
    return { success: false, error: 'Tesla not connected' }
  }

  const accessToken = connection.access_token_encrypted

  // Mock mode
  if (accessToken.startsWith('mock_')) {
    await supabase
      .from('tesla_fleet_connections')
      .update({ preconditioning_enabled: enable })
      .eq('id', connection.id)
    
    return { success: true }
  }

  try {
    const endpoint = enable ? 'auto_conditioning_start' : 'auto_conditioning_stop'
    const response = await fetch(
      `${TESLA_FLEET_API_URL}/api/1/vehicles/${connection.tesla_vehicle_id}/command/${endpoint}`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    )

    if (!response.ok) throw new Error(await response.text())

    await supabase
      .from('tesla_fleet_connections')
      .update({ preconditioning_enabled: enable })
      .eq('id', connection.id)

    await supabase
      .from('vehicles')
      .update({ preconditioning_available: true })
      .eq('id', vehicleId)

    return { success: true }
  } catch (error) {
    console.error('[v0] Tesla preconditioning failed:', error)
    return { success: false, error: String(error) }
  }
}

export async function setSentryMode(vehicleId: string, enable: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: connection } = await supabase
    .from('tesla_fleet_connections')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .single()

  if (!connection) {
    return { success: false, error: 'Tesla not connected' }
  }

  const accessToken = connection.access_token_encrypted

  if (accessToken.startsWith('mock_')) {
    await supabase
      .from('tesla_fleet_connections')
      .update({ sentry_mode_enabled: enable })
      .eq('id', connection.id)
    
    // Record blockchain event
    await recordBlockchainEvent({
      vehicleId,
      eventType: 'inspection',
      eventData: { type: 'sentry_mode', enabled: enable, timestamp: new Date().toISOString() },
    })
    
    return { success: true }
  }

  try {
    const response = await fetch(
      `${TESLA_FLEET_API_URL}/api/1/vehicles/${connection.tesla_vehicle_id}/command/set_sentry_mode`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ on: enable }),
      }
    )

    if (!response.ok) throw new Error(await response.text())

    await supabase
      .from('tesla_fleet_connections')
      .update({ sentry_mode_enabled: enable })
      .eq('id', connection.id)

    await recordBlockchainEvent({
      vehicleId,
      eventType: 'inspection',
      eventData: { type: 'sentry_mode', enabled: enable, timestamp: new Date().toISOString() },
    })

    return { success: true }
  } catch (error) {
    console.error('[v0] Tesla sentry mode failed:', error)
    return { success: false, error: String(error) }
  }
}

export async function connectTesla(
  vehicleId: string,
  hostId: string,
  tokens: TeslaTokens,
  teslaVehicleId: string,
  vehicleInfo: TeslaVehicle
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // Check if there's a Smartcar connection to link
    const { data: smartcarConnection } = await supabase
      .from('smartcar_connections')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .single()

    await supabase.from('tesla_fleet_connections').upsert({
      vehicle_id: vehicleId,
      host_id: hostId,
      smartcar_connection_id: smartcarConnection?.id || null,
      tesla_vehicle_id: teslaVehicleId,
      access_token_encrypted: tokens.access_token,
      refresh_token_encrypted: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      vin: vehicleInfo.vin,
      display_name: vehicleInfo.display_name,
    }, {
      onConflict: 'vehicle_id',
    })

    await supabase
      .from('vehicles')
      .update({
        tesla_fleet_connected: true,
        is_ev: true,
        preconditioning_available: true,
      })
      .eq('id', vehicleId)

    return { success: true }
  } catch (error) {
    console.error('[v0] Tesla connection failed:', error)
    return { success: false, error: String(error) }
  }
}
