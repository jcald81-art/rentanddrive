/**
 * Inspektlabs Integration — AI Vehicle Damage Inspection
 *
 * AI-powered pre and post-trip vehicle inspections delivered via
 * a mobile-friendly link (no app required). Detects 21 damage types
 * at 95-99% accuracy. Used on every RAD trip.
 *
 * Docs: https://inspektlabs.com/docs
 */

const INSPEKT_API = 'https://api.inspektlabs.com/v2'

function inspektHeaders() {
  return {
    'x-api-key': process.env.INSPEKTLABS_API_KEY!,
    'Content-Type': 'application/json',
  }
}

export type InspectionType = 'pre_trip' | 'post_trip' | 'damage_claim' | 'sale'

export interface InspektSession {
  sessionId: string
  inspectionLink: string
  expiresAt: string
  type: InspectionType
  vehicleId: string
  bookingId?: string
}

export interface InspektDamage {
  id: string
  type: string
  location: string
  severity: 'minor' | 'moderate' | 'severe'
  confidence: number // 0-1
  estimated_repair_cost: number // USD
  photoUrl: string
  boundingBox?: { x: number; y: number; width: number; height: number }
}

export interface InspektReport {
  reportId: string
  sessionId: string
  status: 'pending' | 'processing' | 'complete' | 'failed'
  vehicleId: string
  vin?: string
  odometer?: number
  damages: InspektDamage[]
  damage_count: number
  total_estimated_repair: number
  fraud_score?: number // 0-1, high = suspicious
  fraud_flags?: string[]
  photos: string[]
  completed_at?: string
}

/**
 * Create an inspection session and get a mobile-friendly link to send to the renter
 */
export async function createInspectionSession(params: {
  vehicleId: string
  bookingId: string
  type: InspectionType
  vin?: string
  make?: string
  model?: string
  year?: number
  color?: string
  expiresInHours?: number
}): Promise<InspektSession> {
  const res = await fetch(`${INSPEKT_API}/sessions`, {
    method: 'POST',
    headers: inspektHeaders(),
    body: JSON.stringify({
      vehicle_id: params.vehicleId,
      reference_id: params.bookingId,
      inspection_type: params.type,
      vehicle_details: {
        vin: params.vin,
        make: params.make,
        model: params.model,
        year: params.year,
        color: params.color,
      },
      settings: {
        vin_scan: true,
        odometer_scan: true,
        fraud_detection: true,
        expires_in_hours: params.expiresInHours ?? 24,
      },
    }),
  })

  if (!res.ok) throw new Error(`Inspektlabs session failed: ${await res.text()}`)
  const data = await res.json()

  return {
    sessionId: data.session_id,
    inspectionLink: data.inspection_link,
    expiresAt: data.expires_at,
    type: params.type,
    vehicleId: params.vehicleId,
    bookingId: params.bookingId,
  }
}

/**
 * Get the inspection report once complete
 */
export async function getReport(sessionId: string): Promise<InspektReport> {
  const res = await fetch(`${INSPEKT_API}/reports/${sessionId}`, {
    headers: inspektHeaders(),
  })
  if (!res.ok) throw new Error(`Inspektlabs report not found: ${sessionId}`)
  return res.json()
}

/**
 * Compare pre-trip and post-trip reports to detect new damage
 */
export function compareReports(
  preTrip: InspektReport,
  postTrip: InspektReport
): {
  newDamages: InspektDamage[]
  preExistingDamages: InspektDamage[]
  totalNewDamageCost: number
  hasNewDamage: boolean
} {
  const preIds = new Set(preTrip.damages.map((d) => `${d.location}_${d.type}`))

  const newDamages: InspektDamage[] = []
  const preExistingDamages: InspektDamage[] = []

  for (const damage of postTrip.damages) {
    if (preIds.has(`${damage.location}_${damage.type}`)) {
      preExistingDamages.push(damage)
    } else {
      newDamages.push(damage)
    }
  }

  return {
    newDamages,
    preExistingDamages,
    totalNewDamageCost: newDamages.reduce((sum, d) => sum + d.estimated_repair_cost, 0),
    hasNewDamage: newDamages.length > 0,
  }
}

/**
 * Verify an Inspektlabs webhook signature
 */
export function verifyWebhook(payload: string, signature: string): boolean {
  const crypto = require('crypto')
  const expected = crypto
    .createHmac('sha256', process.env.INSPEKTLABS_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex')
  return signature === expected
}
