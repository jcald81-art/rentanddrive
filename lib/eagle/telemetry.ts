/**
 * Eagle Fleet System - Telemetry Processor
 * Saves telemetry data and calculates driving scores
 */

import { createClient } from '@/lib/supabase/server'

interface TelemetryPoint {
  imei: string
  vin?: string
  timestamp: string
  lat: number
  lng: number
  speed: number
  heading?: number
  altitude?: number
  batteryVoltage?: number
  fuelLevel?: number
  engineRunning?: boolean
  mil?: boolean
  odometer?: number
}

interface TripData {
  transactionId: string
  imei: string
  startTime: string
  endTime: string
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  distanceMiles: number
  durationSeconds: number
  maxSpeed: number
  averageSpeed: number
  hardBrakes: number
  hardAccelerations: number
  speedingSeconds: number
  idleSeconds: number
  path?: Array<{ lat: number; lng: number; speed: number; timestamp: string }>
}

interface DrivingScoreBreakdown {
  overall: number
  speedingScore: number
  brakingScore: number
  accelerationScore: number
  idleScore: number
  factors: string[]
}

/**
 * Save a telemetry point to the database
 */
export async function saveTelemetry(point: TelemetryPoint): Promise<boolean> {
  const supabase = await createClient()

  try {
    // Find vehicle by IMEI or VIN
    let vehicleId: string | null = null
    
    if (point.vin) {
      const { data } = await supabase
        .from('vehicles')
        .select('id')
        .eq('vin', point.vin)
        .single()
      vehicleId = data?.id
    } else if (point.imei) {
      const { data } = await supabase
        .from('vehicles')
        .select('id')
        .eq('bouncie_imei', point.imei)
        .single()
      vehicleId = data?.id
    }

    // Save telemetry record
    const { error } = await supabase.from('fleet_telemetry').insert({
      vehicle_id: vehicleId,
      device_imei: point.imei,
      event_type: 'location',
      lat: point.lat,
      lng: point.lng,
      speed_mph: point.speed,
      heading: point.heading,
      altitude_ft: point.altitude,
      battery_voltage: point.batteryVoltage,
      fuel_level: point.fuelLevel,
      engine_running: point.engineRunning,
      mil_status: point.mil,
      odometer_miles: point.odometer,
      recorded_at: point.timestamp,
      raw_data: point,
    })

    if (error) {
      console.error('[Eagle] Failed to save telemetry:', error)
      return false
    }

    // Update vehicle's last known location
    if (vehicleId) {
      await supabase
        .from('vehicles')
        .update({
          last_location_lat: point.lat,
          last_location_lng: point.lng,
          last_location_speed: point.speed,
          last_location_updated: point.timestamp,
          has_check_engine: point.mil || false,
          battery_voltage: point.batteryVoltage,
        })
        .eq('id', vehicleId)
    }

    return true
  } catch (error) {
    console.error('[Eagle] Error saving telemetry:', error)
    return false
  }
}

/**
 * Save a completed trip record
 */
export async function saveTrip(trip: TripData): Promise<string | null> {
  const supabase = await createClient()

  try {
    // Find vehicle by IMEI
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('id')
      .eq('bouncie_imei', trip.imei)
      .single()

    if (!vehicle) {
      console.warn('[Eagle] Unknown vehicle for trip:', trip.imei)
      return null
    }

    // Find active booking for this vehicle during this trip
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, renter_id')
      .eq('vehicle_id', vehicle.id)
      .eq('status', 'active')
      .lte('start_date', trip.endTime)
      .gte('end_date', trip.startTime)
      .single()

    // Calculate driving score for this trip
    const scoreBreakdown = calculateTripScore(trip)

    // Insert trip record
    const { data: tripRecord, error } = await supabase
      .from('trip_records')
      .insert({
        vehicle_id: vehicle.id,
        booking_id: booking?.id || null,
        renter_id: booking?.renter_id || null,
        bouncie_transaction_id: trip.transactionId,
        start_time: trip.startTime,
        end_time: trip.endTime,
        start_lat: trip.startLat,
        start_lng: trip.startLng,
        end_lat: trip.endLat,
        end_lng: trip.endLng,
        distance_miles: trip.distanceMiles,
        duration_seconds: trip.durationSeconds,
        max_speed_mph: trip.maxSpeed,
        avg_speed_mph: trip.averageSpeed,
        hard_brakes: trip.hardBrakes,
        hard_accelerations: trip.hardAccelerations,
        speeding_seconds: trip.speedingSeconds,
        idle_seconds: trip.idleSeconds,
        driving_score: scoreBreakdown.overall,
        score_breakdown: scoreBreakdown,
        path_geojson: trip.path ? {
          type: 'LineString',
          coordinates: trip.path.map(p => [p.lng, p.lat]),
        } : null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Eagle] Failed to save trip:', error)
      return null
    }

    // Update renter's driving score if this was during a booking
    if (booking?.renter_id) {
      await updateRenterScore(booking.renter_id, scoreBreakdown)
    }

    return tripRecord.id
  } catch (error) {
    console.error('[Eagle] Error saving trip:', error)
    return null
  }
}

/**
 * Calculate driving score for a single trip
 */
function calculateTripScore(trip: TripData): DrivingScoreBreakdown {
  const factors: string[] = []
  
  // Speeding score (100 = no speeding, deduct based on speeding time)
  let speedingScore = 100
  const speedingMinutes = trip.speedingSeconds / 60
  speedingScore -= speedingMinutes * 5 // -5 per minute of speeding
  if (trip.maxSpeed > 90) {
    speedingScore -= 15
    factors.push(`Max speed ${trip.maxSpeed} mph`)
  }
  if (trip.maxSpeed > 100) {
    speedingScore -= 25
    factors.push('Exceeded 100 mph')
  }
  speedingScore = Math.max(0, speedingScore)

  // Braking score
  let brakingScore = 100
  brakingScore -= trip.hardBrakes * 5 // -5 per hard brake
  if (trip.hardBrakes > 5) {
    factors.push(`${trip.hardBrakes} hard brakes`)
  }
  brakingScore = Math.max(0, brakingScore)

  // Acceleration score
  let accelerationScore = 100
  accelerationScore -= trip.hardAccelerations * 3 // -3 per hard acceleration
  if (trip.hardAccelerations > 5) {
    factors.push(`${trip.hardAccelerations} hard accelerations`)
  }
  accelerationScore = Math.max(0, accelerationScore)

  // Idle score (excessive idling is wasteful)
  let idleScore = 100
  const idleMinutes = trip.idleSeconds / 60
  if (idleMinutes > 10) {
    idleScore -= (idleMinutes - 10) * 2 // -2 per minute over 10
    factors.push(`${Math.round(idleMinutes)} min idle time`)
  }
  idleScore = Math.max(0, idleScore)

  // Overall score is weighted average
  const overall = Math.round(
    speedingScore * 0.35 +
    brakingScore * 0.30 +
    accelerationScore * 0.20 +
    idleScore * 0.15
  )

  return {
    overall,
    speedingScore: Math.round(speedingScore),
    brakingScore: Math.round(brakingScore),
    accelerationScore: Math.round(accelerationScore),
    idleScore: Math.round(idleScore),
    factors,
  }
}

/**
 * Update a renter's cumulative driving score
 */
async function updateRenterScore(
  renterId: string, 
  tripScore: DrivingScoreBreakdown
): Promise<void> {
  const supabase = await createClient()

  try {
    // Get current renter score or create new
    const { data: existing } = await supabase
      .from('renter_road_scores')
      .select('*')
      .eq('user_id', renterId)
      .single()

    if (existing) {
      // Calculate new running average
      const totalTrips = existing.total_trips + 1
      const newAvgScore = Math.round(
        (existing.avg_driving_score * existing.total_trips + tripScore.overall) / totalTrips
      )
      const newAvgSpeeding = Math.round(
        (existing.avg_speeding_score * existing.total_trips + tripScore.speedingScore) / totalTrips
      )
      const newAvgBraking = Math.round(
        (existing.avg_braking_score * existing.total_trips + tripScore.brakingScore) / totalTrips
      )

      await supabase
        .from('renter_road_scores')
        .update({
          avg_driving_score: newAvgScore,
          avg_speeding_score: newAvgSpeeding,
          avg_braking_score: newAvgBraking,
          total_trips: totalTrips,
          last_trip_score: tripScore.overall,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', renterId)

      // Record score history
      await supabase.from('renter_score_history').insert({
        user_id: renterId,
        score: tripScore.overall,
        score_type: 'trip',
        factors: tripScore.factors,
      })

      // Check for badge awards
      await checkAndAwardBadges(renterId, newAvgScore, totalTrips)

    } else {
      // Create new renter score record
      await supabase.from('renter_road_scores').insert({
        user_id: renterId,
        avg_driving_score: tripScore.overall,
        avg_speeding_score: tripScore.speedingScore,
        avg_braking_score: tripScore.brakingScore,
        total_trips: 1,
        last_trip_score: tripScore.overall,
        tier: 'bronze',
        total_miles: 0,
        total_xp: 10, // First trip bonus
      })
    }
  } catch (error) {
    console.error('[Eagle] Error updating renter score:', error)
  }
}

/**
 * Check and award badges based on driving performance
 */
async function checkAndAwardBadges(
  renterId: string,
  avgScore: number,
  totalTrips: number
): Promise<void> {
  const supabase = await createClient()
  const badgesToAward: Array<{ badge_type: string; name: string; description: string }> = []

  // Get existing badges
  const { data: existingBadges } = await supabase
    .from('renter_badges')
    .select('badge_type')
    .eq('user_id', renterId)

  const hasBadge = (type: string) => existingBadges?.some(b => b.badge_type === type)

  // Perfect Driver badge (90+ avg over 5+ trips)
  if (avgScore >= 90 && totalTrips >= 5 && !hasBadge('perfect_driver')) {
    badgesToAward.push({
      badge_type: 'perfect_driver',
      name: 'Perfect Driver',
      description: 'Maintained 90+ driving score over 5 trips',
    })
  }

  // Road Warrior badge (25+ trips)
  if (totalTrips >= 25 && !hasBadge('road_warrior')) {
    badgesToAward.push({
      badge_type: 'road_warrior',
      name: 'Road Warrior',
      description: 'Completed 25 trips',
    })
  }

  // Safe Driver badge (never below 70)
  if (avgScore >= 80 && totalTrips >= 10 && !hasBadge('safe_driver')) {
    badgesToAward.push({
      badge_type: 'safe_driver',
      name: 'Safe Driver',
      description: 'Consistent safe driving over 10 trips',
    })
  }

  // Award badges
  for (const badge of badgesToAward) {
    await supabase.from('renter_badges').insert({
      user_id: renterId,
      ...badge,
    })

    // Add XP reward
    await supabase.from('renter_road_scores')
      .update({ total_xp: supabase.rpc('increment_xp', { amount: 50 }) })
      .eq('user_id', renterId)

    // Send notification
    await supabase.from('notifications').insert({
      user_id: renterId,
      type: 'badge_earned',
      title: `Badge Earned: ${badge.name}!`,
      message: badge.description,
      data: { badge_type: badge.badge_type },
    })
  }
}

/**
 * Get driving statistics for a vehicle over a time period
 */
export async function getVehicleStats(
  vehicleId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalTrips: number
  totalMiles: number
  avgScore: number
  incidents: number
  topSpeed: number
}> {
  const supabase = await createClient()

  const { data: trips } = await supabase
    .from('trip_records')
    .select('distance_miles, driving_score, max_speed_mph, hard_brakes')
    .eq('vehicle_id', vehicleId)
    .gte('start_time', startDate.toISOString())
    .lte('end_time', endDate.toISOString())

  if (!trips || trips.length === 0) {
    return { totalTrips: 0, totalMiles: 0, avgScore: 0, incidents: 0, topSpeed: 0 }
  }

  return {
    totalTrips: trips.length,
    totalMiles: trips.reduce((sum, t) => sum + (t.distance_miles || 0), 0),
    avgScore: Math.round(trips.reduce((sum, t) => sum + (t.driving_score || 0), 0) / trips.length),
    incidents: trips.reduce((sum, t) => sum + (t.hard_brakes || 0), 0),
    topSpeed: Math.max(...trips.map(t => t.max_speed_mph || 0)),
  }
}

/**
 * Get renter's driving profile
 */
export async function getRenterProfile(renterId: string): Promise<{
  score: number
  tier: string
  totalTrips: number
  totalMiles: number
  badges: string[]
  recentScores: number[]
} | null> {
  const supabase = await createClient()

  const { data: scoreData } = await supabase
    .from('renter_road_scores')
    .select('*')
    .eq('user_id', renterId)
    .single()

  if (!scoreData) return null

  const { data: badges } = await supabase
    .from('renter_badges')
    .select('badge_type')
    .eq('user_id', renterId)

  const { data: history } = await supabase
    .from('renter_score_history')
    .select('score')
    .eq('user_id', renterId)
    .order('created_at', { ascending: false })
    .limit(10)

  return {
    score: scoreData.avg_driving_score,
    tier: scoreData.tier,
    totalTrips: scoreData.total_trips,
    totalMiles: scoreData.total_miles,
    badges: badges?.map(b => b.badge_type) || [],
    recentScores: history?.map(h => h.score) || [],
  }
}

export type { TelemetryPoint, TripData, DrivingScoreBreakdown }
