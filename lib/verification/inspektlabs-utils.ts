/**
 * Inspektlabs comparison utilities
 * Pure utility functions - no "use server" directive
 */

interface InspektDamage {
  id: string
  type: "scratch" | "dent" | "crack" | "chip" | "rust" | "other"
  severity: "minor" | "moderate" | "major"
  location: string
  estimated_repair_cost: number
  confidence: number
  image_url: string
  bounding_box?: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface InspektReport {
  id: string
  status: "processing" | "complete" | "failed"
  vehicle_info?: {
    vin: string
    odometer: number
  }
  damages: InspektDamage[]
  fraud_indicators: string[]
  report_url: string
}

/**
 * Compare pre and post trip inspections
 */
export function compareInspections(
  preTrip: InspektReport,
  postTrip: InspektReport
): {
  newDamages: InspektDamage[]
  preExistingDamages: InspektDamage[]
  totalNewDamageCost: number
  hasNewDamage: boolean
} {
  const preTripDamageIds = new Set(preTrip.damages.map((d) => `${d.location}_${d.type}`))

  const newDamages: InspektDamage[] = []
  const preExistingDamages: InspektDamage[] = []

  for (const damage of postTrip.damages) {
    const key = `${damage.location}_${damage.type}`
    if (preTripDamageIds.has(key)) {
      preExistingDamages.push(damage)
    } else {
      newDamages.push(damage)
    }
  }

  const totalNewDamageCost = newDamages.reduce((sum, d) => sum + d.estimated_repair_cost, 0)

  return {
    newDamages,
    preExistingDamages,
    totalNewDamageCost,
    hasNewDamage: newDamages.length > 0,
  }
}
