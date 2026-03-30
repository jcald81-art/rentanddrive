/**
 * Eagle Fleet System - Bouncie API Client
 * Handles all interactions with the Bouncie GPS tracking API
 */

import { createClient } from '@/lib/supabase/server'

const BOUNCIE_API_URL = 'https://api.bouncie.dev/v1'

interface BouncieVehicle {
  imei: string
  nickName: string
  vin?: string
  make?: string
  model?: string
  year?: number
  stats: {
    lastUpdated: string
    location: {
      lat: number
      lon: number
      heading: number
      speed: number
      gpsStatus: string
    }
    mil: boolean
    battery: {
      status: string
      voltage: number
    }
    fuelLevel?: number
  }
}

interface BouncieTrip {
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
  path?: { lat: number; lon: number; timestamp: string; speed: number }[]
}

interface BouncieLocation {
  lat: number
  lon: number
  speed: number
  heading: number
  timestamp: string
  address?: string
}

interface GeofenceConfig {
  name: string
  lat: number
  lng: number
  radius: number // meters
  type: 'circle'
}

export class BouncieClient {
  private apiKey: string
  private authorizationToken: string | null = null

  constructor() {
    this.apiKey = process.env.BOUNCIE_API_KEY || ''
    this.authorizationToken = process.env.BOUNCIE_AUTH_TOKEN || null
  }

  private async getHeaders(): Promise<HeadersInit> {
    return {
      'Authorization': this.authorizationToken || this.apiKey,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Get all vehicles linked to the Bouncie account
   */
  async getVehicles(): Promise<BouncieVehicle[]> {
    try {
      const res = await fetch(`${BOUNCIE_API_URL}/vehicles`, {
        headers: await this.getHeaders(),
      })

      if (!res.ok) {
        console.error('[Eagle] Failed to fetch vehicles:', res.status, await res.text())
        return []
      }

      const data = await res.json()
      return data.vehicles || data || []
    } catch (error) {
      console.error('[Eagle] Error fetching vehicles:', error)
      return []
    }
  }

  /**
   * Get trips for a specific vehicle
   */
  async getTrips(
    imei: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<BouncieTrip[]> {
    try {
      const params = new URLSearchParams({ imei })
      
      if (startDate) {
        params.set('starts-after', startDate.toISOString())
      }
      if (endDate) {
        params.set('ends-before', endDate.toISOString())
      }

      const res = await fetch(`${BOUNCIE_API_URL}/trips?${params}`, {
        headers: await this.getHeaders(),
      })

      if (!res.ok) {
        console.error('[Eagle] Failed to fetch trips:', res.status)
        return []
      }

      const data = await res.json()
      return data.trips || data || []
    } catch (error) {
      console.error('[Eagle] Error fetching trips:', error)
      return []
    }
  }

  /**
   * Get current location of a vehicle by IMEI
   */
  async getLocation(imei: string): Promise<BouncieLocation | null> {
    try {
      const res = await fetch(`${BOUNCIE_API_URL}/vehicles/${imei}/location`, {
        headers: await this.getHeaders(),
      })

      if (!res.ok) {
        console.error('[Eagle] Failed to fetch location:', res.status)
        return null
      }

      return await res.json()
    } catch (error) {
      console.error('[Eagle] Error fetching location:', error)
      return null
    }
  }

  /**
   * Get vehicle diagnostics and health data
   */
  async getDiagnostics(imei: string): Promise<{
    mil: boolean
    dtcCodes: string[]
    battery: { voltage: number; status: string }
    fuelLevel?: number
  } | null> {
    try {
      const res = await fetch(`${BOUNCIE_API_URL}/vehicles/${imei}/diagnostics`, {
        headers: await this.getHeaders(),
      })

      if (!res.ok) {
        return null
      }

      return await res.json()
    } catch (error) {
      console.error('[Eagle] Error fetching diagnostics:', error)
      return null
    }
  }

  /**
   * Register a geofence for a booking
   * Used to track when vehicle leaves/enters expected area
   */
  async registerGeofence(
    bookingId: string,
    lat: number,
    lng: number,
    radius: number = 50000 // 50km default radius
  ): Promise<string | null> {
    try {
      const geofence: GeofenceConfig = {
        name: `booking_${bookingId}`,
        lat,
        lng,
        radius,
        type: 'circle',
      }

      const res = await fetch(`${BOUNCIE_API_URL}/geofences`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify(geofence),
      })

      if (!res.ok) {
        console.error('[Eagle] Failed to create geofence:', res.status)
        return null
      }

      const data = await res.json()
      const geofenceId = data.id || data.geofenceId

      // Store geofence in database
      const supabase = await createClient()
      await supabase.from('geofences').insert({
        id: geofenceId,
        booking_id: bookingId,
        name: geofence.name,
        center_lat: lat,
        center_lng: lng,
        radius_meters: radius,
        is_active: true,
      })

      return geofenceId
    } catch (error) {
      console.error('[Eagle] Error creating geofence:', error)
      return null
    }
  }

  /**
   * Remove a geofence when booking ends
   */
  async removeGeofence(bookingId: string): Promise<boolean> {
    try {
      const supabase = await createClient()
      
      // Find the geofence
      const { data: geofence } = await supabase
        .from('geofences')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('is_active', true)
        .single()

      if (!geofence) {
        return true // No active geofence
      }

      // Delete from Bouncie
      const res = await fetch(`${BOUNCIE_API_URL}/geofences/${geofence.id}`, {
        method: 'DELETE',
        headers: await this.getHeaders(),
      })

      // Mark as inactive in database regardless of API response
      await supabase
        .from('geofences')
        .update({ is_active: false })
        .eq('id', geofence.id)

      return res.ok
    } catch (error) {
      console.error('[Eagle] Error removing geofence:', error)
      return false
    }
  }

  /**
   * Get webhook access log for debugging
   */
  async getAccessLog(limit: number = 100): Promise<Array<{
    timestamp: string
    event_type: string
    imei: string
    data: Record<string, unknown>
  }>> {
    try {
      const supabase = await createClient()
      
      const { data } = await supabase
        .from('fleet_telemetry')
        .select('created_at, event_type, device_imei, raw_data')
        .order('created_at', { ascending: false })
        .limit(limit)

      return (data || []).map(row => ({
        timestamp: row.created_at,
        event_type: row.event_type || 'telemetry',
        imei: row.device_imei,
        data: row.raw_data || {},
      }))
    } catch (error) {
      console.error('[Eagle] Error fetching access log:', error)
      return []
    }
  }

  /**
   * Sync all Bouncie vehicles with our database
   */
  async syncVehicles(): Promise<{ synced: number; errors: number }> {
    const result = { synced: 0, errors: 0 }
    
    try {
      const vehicles = await this.getVehicles()
      const supabase = await createClient()

      for (const vehicle of vehicles) {
        try {
          // Update device info in vehicles table by VIN or IMEI
          if (vehicle.vin) {
            await supabase
              .from('vehicles')
              .update({
                bouncie_imei: vehicle.imei,
                last_location_lat: vehicle.stats?.location?.lat,
                last_location_lng: vehicle.stats?.location?.lon,
                last_location_speed: vehicle.stats?.location?.speed,
                last_location_updated: vehicle.stats?.lastUpdated,
                has_check_engine: vehicle.stats?.mil || false,
                battery_voltage: vehicle.stats?.battery?.voltage,
              })
              .eq('vin', vehicle.vin)
            
            result.synced++
          }
        } catch (err) {
          console.error('[Eagle] Error syncing vehicle:', vehicle.imei, err)
          result.errors++
        }
      }

      return result
    } catch (error) {
      console.error('[Eagle] Error in vehicle sync:', error)
      return result
    }
  }

  /**
   * Get trip summary for a booking period
   */
  async getBookingTripSummary(
    imei: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalMiles: number
    totalTrips: number
    totalHardBrakes: number
    totalHardAccelerations: number
    totalSpeedingSeconds: number
    maxSpeed: number
    averageSpeed: number
    drivingScore: number
  }> {
    const trips = await this.getTrips(imei, startDate, endDate)
    
    const summary = {
      totalMiles: 0,
      totalTrips: trips.length,
      totalHardBrakes: 0,
      totalHardAccelerations: 0,
      totalSpeedingSeconds: 0,
      maxSpeed: 0,
      averageSpeed: 0,
      drivingScore: 100,
    }

    if (trips.length === 0) return summary

    let totalSpeed = 0

    for (const trip of trips) {
      summary.totalMiles += trip.distance || 0
      summary.totalHardBrakes += trip.hardBrakes || 0
      summary.totalHardAccelerations += trip.hardAccelerations || 0
      summary.totalSpeedingSeconds += trip.speedingSeconds || 0
      summary.maxSpeed = Math.max(summary.maxSpeed, trip.maxSpeed || 0)
      totalSpeed += trip.averageSpeed || 0
    }

    summary.averageSpeed = totalSpeed / trips.length

    // Calculate driving score (100 = perfect, deduct for violations)
    let score = 100
    score -= summary.totalHardBrakes * 2 // -2 per hard brake
    score -= summary.totalHardAccelerations * 1 // -1 per hard accel
    score -= Math.floor(summary.totalSpeedingSeconds / 60) * 3 // -3 per minute speeding
    if (summary.maxSpeed > 90) score -= 10 // -10 for exceeding 90mph
    if (summary.maxSpeed > 100) score -= 20 // additional -20 for 100+mph
    
    summary.drivingScore = Math.max(0, Math.min(100, score))

    return summary
  }
}

// Export singleton instance
export const bouncie = new BouncieClient()
export type { BouncieVehicle, BouncieTrip, BouncieLocation }
