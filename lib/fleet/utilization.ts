/**
 * Fleet Utilization Tracker
 *
 * Calculates real-time fleet utilization rates used by the dynamic pricing engine.
 * Pulls active bookings from Supabase to determine what percentage of the fleet
 * is currently booked for a given date range.
 */

import { createClient } from '@/lib/supabase/server'

export interface UtilizationStats {
  overall: number         // 0-1 fleet utilization for the period
  byVehicle: Record<string, number> // vehicle_id -> utilization
  bookedDays: number
  availableDays: number
  totalVehicles: number
  activeVehicles: number
}

/**
 * Calculate fleet utilization for a given date range
 */
export async function getFleetUtilization(params: {
  startDate: Date
  endDate: Date
  vehicleId?: string // if provided, just returns this vehicle's utilization
}): Promise<UtilizationStats> {
  const supabase = await createClient()

  const totalDays = Math.ceil(
    (params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Get all active vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id')
    .eq('status', 'available')
    .eq('is_active', true)

  if (!vehicles?.length) {
    return {
      overall: 0,
      byVehicle: {},
      bookedDays: 0,
      availableDays: 0,
      totalVehicles: 0,
      activeVehicles: 0,
    }
  }

  // Get bookings that overlap with the date range
  const { data: bookings } = await supabase
    .from('bookings')
    .select('vehicle_id, start_date, end_date')
    .in('status', ['confirmed', 'active', 'pending'])
    .gte('end_date', params.startDate.toISOString())
    .lte('start_date', params.endDate.toISOString())

  const totalVehicles = vehicles.length
  const totalAvailableDays = totalVehicles * totalDays

  // Calculate booked days per vehicle
  const bookedDaysByVehicle: Record<string, number> = {}

  for (const booking of bookings ?? []) {
    const start = new Date(Math.max(
      new Date(booking.start_date).getTime(),
      params.startDate.getTime()
    ))
    const end = new Date(Math.min(
      new Date(booking.end_date).getTime(),
      params.endDate.getTime()
    ))
    const days = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))

    bookedDaysByVehicle[booking.vehicle_id] =
      (bookedDaysByVehicle[booking.vehicle_id] ?? 0) + days
  }

  const totalBookedDays = Object.values(bookedDaysByVehicle).reduce((sum, d) => sum + d, 0)

  // Build per-vehicle utilization map
  const byVehicle: Record<string, number> = {}
  for (const vehicle of vehicles) {
    byVehicle[vehicle.id] = Math.min(
      1.0,
      (bookedDaysByVehicle[vehicle.id] ?? 0) / totalDays
    )
  }

  return {
    overall: Math.min(1.0, totalBookedDays / totalAvailableDays),
    byVehicle,
    bookedDays: totalBookedDays,
    availableDays: totalAvailableDays,
    totalVehicles,
    activeVehicles: totalVehicles,
  }
}

/**
 * Get a single vehicle's utilization over the last N days
 */
export async function getVehicleUtilization30d(vehicleId: string): Promise<number> {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)

  const stats = await getFleetUtilization({ startDate: start, endDate: end })
  return stats.byVehicle[vehicleId] ?? 0
}
