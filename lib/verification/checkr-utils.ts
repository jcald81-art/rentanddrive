/**
 * Checkr MVR parsing utilities
 * Pure utility functions - no "use server" directive
 */

interface CheckrMVRRecord {
  type: "violation" | "accident" | "suspension" | "dui"
  description: string
  date: string
  state: string
  points?: number
  is_at_fault?: boolean
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
