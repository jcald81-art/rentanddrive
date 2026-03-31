"use server"

/**
 * Inspektlabs Integration
 * AI-powered vehicle inspection and damage detection
 */

const INSPEKT_API_KEY = process.env.INSPEKTLABS_API_KEY || ""
const INSPEKT_API_URL = "https://api.inspektlabs.com/v1"

interface InspektSession {
  id: string
  url: string
  expires_at: string
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

/**
 * Create an inspection session for a renter to complete
 */
export async function createInspectionSession(data: {
  bookingId: string
  vehicleId: string
  renterId: string
  type: "pre_trip" | "post_trip"
  vehicleMake: string
  vehicleModel: string
  vehicleYear: number
  vehicleVin?: string
}): Promise<InspektSession | { error: string }> {
  if (!INSPEKT_API_KEY) {
    // Return mock session for development
    const token = `mock_${data.type}_${Date.now()}`
    return {
      id: `mock_session_${Date.now()}`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/inspect/${token}`,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  try {
    const res = await fetch(`${INSPEKT_API_URL}/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${INSPEKT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inspection_type: data.type === "pre_trip" ? "vehicle_pickup" : "vehicle_return",
        vehicle: {
          make: data.vehicleMake,
          model: data.vehicleModel,
          year: data.vehicleYear,
          vin: data.vehicleVin,
        },
        metadata: {
          booking_id: data.bookingId,
          vehicle_id: data.vehicleId,
          renter_id: data.renterId,
          platform: "rad",
        },
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/inspect/webhook`,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/renter/trips`,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error("[Inspektlabs] Failed to create session:", error)
      return { error: "Failed to create inspection session" }
    }

    const session = await res.json()
    return {
      id: session.id,
      url: session.url,
      expires_at: session.expires_at,
    }
  } catch (err) {
    console.error("[Inspektlabs] Error creating session:", err)
    return { error: "Inspection service unavailable" }
  }
}

/**
 * Get inspection report
 */
export async function getInspectionReport(sessionId: string): Promise<InspektReport | { error: string }> {
  if (!INSPEKT_API_KEY || sessionId.startsWith("mock_")) {
    // Return mock clean report
    return {
      id: sessionId,
      status: "complete",
      vehicle_info: {
        vin: "1HGCM82633A123456",
        odometer: 45000,
      },
      damages: [],
      fraud_indicators: [],
      report_url: "#",
    }
  }

  try {
    const res = await fetch(`${INSPEKT_API_URL}/sessions/${sessionId}/report`, {
      headers: {
        Authorization: `Bearer ${INSPEKT_API_KEY}`,
      },
    })

    if (!res.ok) {
      return { error: "Failed to fetch report" }
    }

    return await res.json()
  } catch (err) {
    console.error("[Inspektlabs] Error fetching report:", err)
    return { error: "Inspection service unavailable" }
  }
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

/**
 * Send inspection link via SMS
 */
export async function sendInspectionSMS(data: {
  phone: string
  inspectionUrl: string
  renterName: string
  vehicleName: string
  type: "pre_trip" | "post_trip"
}): Promise<{ sent: boolean }> {
  // Use Twilio or similar in production
  const message =
    data.type === "pre_trip"
      ? `Hi ${data.renterName}! Complete your pre-trip inspection for your ${data.vehicleName} rental: ${data.inspectionUrl}`
      : `Hi ${data.renterName}! Complete your return inspection for your ${data.vehicleName} rental: ${data.inspectionUrl}`

  console.log("[SMS]", message)

  // TODO: Integrate with Twilio
  return { sent: true }
}
