/**
 * RAD Dynamic Pricing Engine
 *
 * AI-powered pricing that factors in:
 * - Base vehicle daily rate
 * - Real-time market demand (Reno/Tahoe seasonality)
 * - Fleet utilization rate
 * - Local events and holidays
 * - Day-of-week patterns
 * - Competitor pricing signals
 * - Vehicle age, mileage, and rating
 * - Advance booking window
 *
 * Uses xAI Grok as the primary model for reasoning and multiplier suggestions.
 */

import { z } from 'zod'

export interface PricingInput {
  vehicleId: string
  baseRate: number // cents
  vehicleYear: number
  vehicleMake: string
  vehicleModel: string
  vehicleRating: number // 0-5
  vehicleOdometer: number
  checkIn: Date
  checkOut: Date
  advanceDays: number // how many days until check-in
  currentUtilization: number // 0-1 (fleet-wide)
  vehicleUtilization30d: number // 0-1 (this vehicle last 30 days)
}

export interface PricingOutput {
  dailyRate: number // cents
  totalAmount: number // cents
  breakdown: {
    baseDailyRate: number
    seasonalMultiplier: number
    demandMultiplier: number
    utilizationMultiplier: number
    advanceBookingDiscount: number
    eventSurcharge: number
    vehicleQualityAdjustment: number
  }
  pricePerDay: number // cents
  rentalDays: number
  appliedRules: string[]
}

// Reno/Tahoe seasonal demand patterns (1.0 = baseline)
const SEASONAL_MULTIPLIERS: Record<number, number> = {
  1: 0.85,  // January — slow season
  2: 1.05,  // February — Valentine's Day + ski season peak
  3: 0.90,  // March — shoulder
  4: 0.88,  // April — shoulder
  5: 1.00,  // May — warming up
  6: 1.20,  // June — summer begins, Tahoe tourism
  7: 1.35,  // July — peak summer, air shows, festivals
  8: 1.30,  // August — peak summer
  9: 1.10,  // September — Labor Day weekend, fall beginning
  10: 0.95, // October — shoulder
  11: 1.05, // November — Thanksgiving travel
  12: 1.25, // December — holiday skiing
}

// Day-of-week multipliers (0=Sunday, 6=Saturday)
const DOW_MULTIPLIERS: Record<number, number> = {
  0: 1.05, // Sunday
  1: 0.90, // Monday
  2: 0.90, // Tuesday
  3: 0.92, // Wednesday
  4: 0.95, // Thursday
  5: 1.15, // Friday — weekend pickup
  6: 1.10, // Saturday
}

// Known high-demand Reno events (approximate)
const RENO_EVENTS = [
  { name: 'Reno Air Races', months: [9], multiplier: 1.45 },
  { name: 'Hot August Nights', months: [8], multiplier: 1.40 },
  { name: 'Burning Man Setup/Return', months: [8, 9], multiplier: 1.30 },
  { name: 'Street Vibrations', months: [9], multiplier: 1.25 },
  { name: 'Reno Balloon Races', months: [9], multiplier: 1.20 },
  { name: 'Ski Season Peak', months: [12, 1, 2], multiplier: 1.25 },
  { name: 'Tahoe Summer', months: [6, 7, 8], multiplier: 1.20 },
]

/**
 * Check if a date falls within a high-demand event period
 */
function getEventSurcharge(date: Date): { multiplier: number; events: string[] } {
  const month = date.getMonth() + 1
  const applicableEvents = RENO_EVENTS.filter((e) => e.months.includes(month))

  if (applicableEvents.length === 0) return { multiplier: 1.0, events: [] }

  // Use the highest multiplier if multiple events overlap
  const maxMultiplier = Math.max(...applicableEvents.map((e) => e.multiplier))
  return {
    multiplier: maxMultiplier,
    events: applicableEvents.map((e) => e.name),
  }
}

/**
 * Calculate demand multiplier based on fleet utilization
 */
function getDemandMultiplier(utilization: number): number {
  if (utilization >= 0.95) return 1.50 // Near full — surge pricing
  if (utilization >= 0.85) return 1.30 // High demand
  if (utilization >= 0.70) return 1.15 // Moderate demand
  if (utilization >= 0.50) return 1.00 // Normal
  if (utilization >= 0.30) return 0.92 // Low demand — slight discount
  return 0.85 // Very low demand — promote bookings
}

/**
 * Calculate advance booking discount/surcharge
 */
function getAdvanceBookingAdjustment(advanceDays: number): number {
  if (advanceDays <= 1) return 1.20   // Last minute — premium
  if (advanceDays <= 3) return 1.10   // Short notice
  if (advanceDays <= 7) return 1.05   // One week out
  if (advanceDays <= 14) return 1.00  // Two weeks — baseline
  if (advanceDays <= 30) return 0.97  // Month out — slight discount
  if (advanceDays <= 60) return 0.95  // 2 months — early bird
  return 0.90 // 2+ months — maximize advance bookings
}

/**
 * Vehicle quality adjustment (newer, lower miles, higher rated = premium)
 */
function getVehicleQualityAdjustment(params: {
  year: number
  odometer: number
  rating: number
}): number {
  const currentYear = new Date().getFullYear()
  const age = currentYear - params.year

  let adjustment = 1.0

  // Age factor
  if (age <= 1) adjustment += 0.10
  else if (age <= 3) adjustment += 0.05
  else if (age >= 7) adjustment -= 0.05
  else if (age >= 10) adjustment -= 0.10

  // Mileage factor
  if (params.odometer < 20000) adjustment += 0.05
  else if (params.odometer > 100000) adjustment -= 0.08
  else if (params.odometer > 75000) adjustment -= 0.04

  // Rating factor
  if (params.rating >= 4.8) adjustment += 0.08
  else if (params.rating >= 4.5) adjustment += 0.04
  else if (params.rating < 4.0) adjustment -= 0.05

  return Math.max(0.70, Math.min(1.25, adjustment))
}

/**
 * Core pricing calculator — runs synchronously (no AI call needed for base math)
 */
export function calculateDynamicPrice(input: PricingInput): PricingOutput {
  const rentalDays =
    Math.max(
      1,
      Math.ceil(
        (input.checkOut.getTime() - input.checkIn.getTime()) / (1000 * 60 * 60 * 24)
      )
    )

  const seasonalMultiplier = SEASONAL_MULTIPLIERS[input.checkIn.getMonth() + 1] ?? 1.0
  const dowMultiplier = DOW_MULTIPLIERS[input.checkIn.getDay()] ?? 1.0
  const demandMultiplier = getDemandMultiplier(input.currentUtilization)
  const vehicleUtilMultiplier = getDemandMultiplier(input.vehicleUtilization30d)
  const eventData = getEventSurcharge(input.checkIn)
  const advanceAdjustment = getAdvanceBookingAdjustment(input.advanceDays)
  const qualityAdjustment = getVehicleQualityAdjustment({
    year: input.vehicleYear,
    odometer: input.vehicleOdometer,
    rating: input.vehicleRating,
  })

  // Combined utilization is fleet-wide weighted with this vehicle's recent history
  const combinedDemand = demandMultiplier * 0.6 + vehicleUtilMultiplier * 0.4

  const appliedRules: string[] = []

  // Apply multipliers
  let priceMultiplier = 1.0
  priceMultiplier *= seasonalMultiplier
  appliedRules.push(`Seasonal adjustment: ${((seasonalMultiplier - 1) * 100).toFixed(0)}%`)

  priceMultiplier *= dowMultiplier
  if (dowMultiplier !== 1.0) appliedRules.push(`Day-of-week: ${((dowMultiplier - 1) * 100).toFixed(0)}%`)

  priceMultiplier *= combinedDemand
  appliedRules.push(`Demand: ${((combinedDemand - 1) * 100).toFixed(0)}%`)

  priceMultiplier *= eventData.multiplier
  if (eventData.events.length > 0) {
    appliedRules.push(`Event surcharge (${eventData.events.join(', ')}): +${((eventData.multiplier - 1) * 100).toFixed(0)}%`)
  }

  priceMultiplier *= advanceAdjustment
  appliedRules.push(`Advance booking (${input.advanceDays}d): ${((advanceAdjustment - 1) * 100).toFixed(0)}%`)

  priceMultiplier *= qualityAdjustment
  if (qualityAdjustment !== 1.0) {
    appliedRules.push(`Vehicle quality: ${((qualityAdjustment - 1) * 100).toFixed(0)}%`)
  }

  // Multi-day discount (encourage longer bookings)
  let multiDayDiscount = 1.0
  if (rentalDays >= 7) multiDayDiscount = 0.90
  else if (rentalDays >= 3) multiDayDiscount = 0.95

  if (multiDayDiscount < 1.0) {
    appliedRules.push(`Multi-day discount (${rentalDays} days): -${((1 - multiDayDiscount) * 100).toFixed(0)}%`)
  }

  const finalDailyRate = Math.round(input.baseRate * priceMultiplier * multiDayDiscount)

  // Enforce min/max guardrails (never less than 60% of base, never more than 2.5x)
  const minRate = Math.round(input.baseRate * 0.60)
  const maxRate = Math.round(input.baseRate * 2.50)
  const clampedRate = Math.max(minRate, Math.min(maxRate, finalDailyRate))

  return {
    dailyRate: clampedRate,
    totalAmount: clampedRate * rentalDays,
    pricePerDay: clampedRate,
    rentalDays,
    breakdown: {
      baseDailyRate: input.baseRate,
      seasonalMultiplier,
      demandMultiplier: combinedDemand,
      utilizationMultiplier: vehicleUtilMultiplier,
      advanceBookingDiscount: advanceAdjustment,
      eventSurcharge: eventData.multiplier,
      vehicleQualityAdjustment: qualityAdjustment,
    },
    appliedRules,
  }
}

/**
 * Pricing validation schema (for API inputs)
 */
export const PricingRequestSchema = z.object({
  vehicleId: z.string().uuid(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
})

export type PricingRequest = z.infer<typeof PricingRequestSchema>
