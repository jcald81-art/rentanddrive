"use server"

/**
 * Checkr MVR Integration
 * Handles Motor Vehicle Record checks and continuous monitoring
 */

const CHECKR_API_KEY = process.env.CHECKR_API_KEY || ""
const CHECKR_API_URL = "https://api.checkr.com/v1"

interface CheckrCandidate {
  id: string
  email: string
  first_name: string
  last_name: string
  dob: string
  driver_license_number: string
  driver_license_state: string
}

interface CheckrReport {
  id: string
  status: "pending" | "complete" | "suspended" | "dispute"
  package: string
  motor_vehicle_report?: {
    status: string
    result: string
    records: CheckrMVRRecord[]
  }
}

interface CheckrMVRRecord {
  type: "violation" | "accident" | "suspension" | "dui"
  description: string
  date: string
  state: string
  points?: number
  is_at_fault?: boolean
}

/**
 * Create a Checkr candidate for MVR check
 */
export async function createCheckrCandidate(data: {
  email: string
  firstName: string
  lastName: string
  dob: string // YYYY-MM-DD
  licenseNumber: string
  licenseState: string
  ssn?: string // Last 4 only for MVR
}): Promise<{ candidateId: string } | { error: string }> {
  if (!CHECKR_API_KEY) {
    console.log("[v0] Checkr API key not configured, using mock")
    return { candidateId: `mock_candidate_${Date.now()}` }
  }

  try {
    const res = await fetch(`${CHECKR_API_URL}/candidates`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(CHECKR_API_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        dob: data.dob,
        driver_license_number: data.licenseNumber,
        driver_license_state: data.licenseState,
        ssn: data.ssn,
        work_locations: [{ state: "NV", city: "Reno" }],
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error("[Checkr] Failed to create candidate:", error)
      return { error: "Failed to create background check candidate" }
    }

    const candidate = await res.json()
    return { candidateId: candidate.id }
  } catch (err) {
    console.error("[Checkr] Error creating candidate:", err)
    return { error: "Checkr service unavailable" }
  }
}

/**
 * Initiate an MVR report for a candidate
 */
export async function createMVRReport(candidateId: string): Promise<{ reportId: string } | { error: string }> {
  if (!CHECKR_API_KEY || candidateId.startsWith("mock_")) {
    console.log("[v0] Using mock MVR report")
    return { reportId: `mock_report_${Date.now()}` }
  }

  try {
    const res = await fetch(`${CHECKR_API_URL}/reports`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(CHECKR_API_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidate_id: candidateId,
        package: "driver_pro", // MVR + SSN trace
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error("[Checkr] Failed to create report:", error)
      return { error: "Failed to initiate background check" }
    }

    const report = await res.json()
    return { reportId: report.id }
  } catch (err) {
    console.error("[Checkr] Error creating report:", err)
    return { error: "Checkr service unavailable" }
  }
}

/**
 * Get MVR report status and results
 */
export async function getMVRReport(reportId: string): Promise<CheckrReport | { error: string }> {
  if (!CHECKR_API_KEY || reportId.startsWith("mock_")) {
    // Return mock clean report for development
    return {
      id: reportId,
      status: "complete",
      package: "driver_pro",
      motor_vehicle_report: {
        status: "complete",
        result: "clear",
        records: [],
      },
    }
  }

  try {
    const res = await fetch(`${CHECKR_API_URL}/reports/${reportId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(CHECKR_API_KEY + ":").toString("base64")}`,
      },
    })

    if (!res.ok) {
      return { error: "Failed to fetch report" }
    }

    return await res.json()
  } catch (err) {
    console.error("[Checkr] Error fetching report:", err)
    return { error: "Checkr service unavailable" }
  }
}

/**
 * Parse Checkr MVR records into scoring format
 */
export function parseMVRRecords(records: CheckrMVRRecord[]): {
  dui_count_7yr: number
  dui_count_lifetime: number
  at_fault_accidents_3yr: number
  at_fault_accidents_7yr: number
  major_violations_3yr: number
  minor_violations_3yr: number
  suspensions_lifetime: number
} {
  const now = new Date()
  const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate())
  const sevenYearsAgo = new Date(now.getFullYear() - 7, now.getMonth(), now.getDate())

  const result = {
    dui_count_7yr: 0,
    dui_count_lifetime: 0,
    at_fault_accidents_3yr: 0,
    at_fault_accidents_7yr: 0,
    major_violations_3yr: 0,
    minor_violations_3yr: 0,
    suspensions_lifetime: 0,
  }

  const majorViolations = [
    "reckless",
    "racing",
    "hit and run",
    "fleeing",
    "eluding",
    "vehicular manslaughter",
    "vehicular homicide",
  ]

  for (const record of records) {
    const recordDate = new Date(record.date)
    const isWithin3Years = recordDate >= threeYearsAgo
    const isWithin7Years = recordDate >= sevenYearsAgo

    if (record.type === "dui") {
      result.dui_count_lifetime++
      if (isWithin7Years) result.dui_count_7yr++
    }

    if (record.type === "accident" && record.is_at_fault) {
      if (isWithin7Years) result.at_fault_accidents_7yr++
      if (isWithin3Years) result.at_fault_accidents_3yr++
    }

    if (record.type === "suspension") {
      result.suspensions_lifetime++
    }

    if (record.type === "violation" && isWithin3Years) {
      const desc = record.description.toLowerCase()
      const isMajor = majorViolations.some((v) => desc.includes(v))
      if (isMajor) {
        result.major_violations_3yr++
      } else {
        result.minor_violations_3yr++
      }
    }
  }

  return result
}

/**
 * Enroll driver in continuous monitoring
 */
export async function enrollContinuousMonitoring(candidateId: string): Promise<{ enrolled: boolean }> {
  if (!CHECKR_API_KEY || candidateId.startsWith("mock_")) {
    return { enrolled: true }
  }

  try {
    const res = await fetch(`${CHECKR_API_URL}/continuous_checks`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(CHECKR_API_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidate_id: candidateId,
        type: "motor_vehicle_report",
      }),
    })

    return { enrolled: res.ok }
  } catch {
    return { enrolled: false }
  }
}
