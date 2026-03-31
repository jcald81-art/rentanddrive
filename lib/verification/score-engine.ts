/**
 * RAD Rentability Score Calculator
 * Server-only - never import on client side
 * 
 * Calculates a 0-100 score based on:
 * - License validity
 * - Face match confidence
 * - MVR (motor vehicle report) data
 * - Driving experience
 * - RAD rental history
 */

export interface MVRData {
  licenseStatus: 'valid' | 'suspended' | 'revoked' | 'expired' | 'restricted'
  licenseExpiry: Date
  yearsLicensed: number
  duiCount7yr: number
  duiCountLifetime: number
  atFaultAccidents3yr: number
  atFaultAccidents7yr: number
  majorViolations3yr: number
  minorViolations3yr: number
  suspensionsLifetime: number
}

export interface FaceMatchData {
  confidence: number // 0-100
}

export interface RADHistoryData {
  completedTrips: number
  avgRoadScore: number // 0-100
}

export interface ScoreResult {
  score: number
  tier: 'trusted' | 'verified' | 'review' | 'blocked'
  recommendation: 'approve' | 'review' | 'decline'
  hardBlock: boolean
  hardBlockReason: string | null
  breakdown: {
    license: number
    faceMatch: number
    mvr: number
    experience: number
    radHistory: number
  }
  flags: string[]
  under25Surcharge: number
  depositAddition: number
}

/**
 * Calculate the RAD Rentability Score
 * 
 * Score tiers:
 * - 85-100: Trusted Driver (gold badge)
 * - 75-84: Verified Driver (green badge)
 * - 60-74: Review Required (amber badge)
 * - 0-59: Blocked (red badge)
 */
export function calculateRentabilityScore(
  age: number,
  licenseExpiry: Date,
  faceMatch: FaceMatchData,
  mvr: MVRData,
  radHistory: RADHistoryData
): ScoreResult {
  let score = 100
  const flags: string[] = []
  let hardBlock = false
  let hardBlockReason: string | null = null
  const breakdown = { 
    license: 0, 
    faceMatch: 0, 
    mvr: 0, 
    experience: 0, 
    radHistory: 0 
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HARD BLOCKS (auto-block regardless of score)
  // ══════════════════════════════════════════════════════════════════════════
  
  if (age < 21) {
    hardBlock = true
    hardBlockReason = 'Minimum age is 21 to rent on RAD'
    return { 
      score: 0, 
      tier: 'blocked', 
      recommendation: 'decline', 
      hardBlock, 
      hardBlockReason, 
      breakdown, 
      flags, 
      under25Surcharge: 0, 
      depositAddition: 0 
    }
  }
  
  if (mvr.licenseStatus === 'suspended' || mvr.licenseStatus === 'revoked') {
    hardBlock = true
    hardBlockReason = 'Driver license is currently suspended or revoked'
    return { 
      score: 0, 
      tier: 'blocked',
      recommendation: 'decline', 
      hardBlock,
      hardBlockReason, 
      breakdown, 
      flags,
      under25Surcharge: 0, 
      depositAddition: 0 
    }
  }
  
  if (mvr.duiCount7yr > 0) {
    hardBlock = true
    hardBlockReason = 'DUI/DWI within the past 7 years'
    return { 
      score: 0, 
      tier: 'blocked',
      recommendation: 'decline', 
      hardBlock,
      hardBlockReason, 
      breakdown, 
      flags,
      under25Surcharge: 0, 
      depositAddition: 0 
    }
  }
  
  if (mvr.licenseStatus === 'expired') {
    hardBlock = true
    hardBlockReason = 'Driver license is expired'
    return { 
      score: 0, 
      tier: 'blocked',
      recommendation: 'decline', 
      hardBlock,
      hardBlockReason, 
      breakdown, 
      flags,
      under25Surcharge: 0, 
      depositAddition: 0 
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LICENSE VALIDITY (-15 if expires soon)
  // ══════════════════════════════════════════════════════════════════════════
  
  const daysToExpiry = Math.floor(
    (licenseExpiry.getTime() - Date.now()) / 86400000
  )
  if (daysToExpiry < 30) {
    score -= 15
    breakdown.license -= 15
    flags.push(`License expires in ${daysToExpiry} days`)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FACE MATCH (-10 to -25 for low confidence)
  // ══════════════════════════════════════════════════════════════════════════
  
  if (faceMatch.confidence < 70) {
    score -= 25
    breakdown.faceMatch -= 25
    flags.push('Face match below 70% confidence')
  } else if (faceMatch.confidence < 85) {
    score -= 10
    breakdown.faceMatch -= 10
    flags.push('Face match flagged for manual review')
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MVR — DUI older than 7 years (-40)
  // ══════════════════════════════════════════════════════════════════════════
  
  const oldDUI = mvr.duiCountLifetime - mvr.duiCount7yr
  if (oldDUI > 0) {
    score -= 40
    breakdown.mvr -= 40
    flags.push(`${oldDUI} DUI/DWI on record (>7 years ago)`)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MVR — At-fault accidents (-20 each in 3yr, -10 each 3-7yr)
  // ══════════════════════════════════════════════════════════════════════════
  
  if (mvr.atFaultAccidents3yr > 0) {
    const deduction = mvr.atFaultAccidents3yr * 20
    score -= deduction
    breakdown.mvr -= deduction
    flags.push(`${mvr.atFaultAccidents3yr} at-fault accident(s) in past 3 years`)
  }
  
  if (mvr.atFaultAccidents7yr > mvr.atFaultAccidents3yr) {
    const older = mvr.atFaultAccidents7yr - mvr.atFaultAccidents3yr
    const deduction = older * 10
    score -= deduction
    breakdown.mvr -= deduction
    flags.push(`${older} at-fault accident(s) between 3-7 years ago`)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MVR — Major violations (-12 each)
  // ══════════════════════════════════════════════════════════════════════════
  
  if (mvr.majorViolations3yr > 0) {
    const deduction = mvr.majorViolations3yr * 12
    score -= deduction
    breakdown.mvr -= deduction
    flags.push(`${mvr.majorViolations3yr} major speeding violation(s) in past 3 years`)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MVR — Minor violations (-5 each)
  // ══════════════════════════════════════════════════════════════════════════
  
  if (mvr.minorViolations3yr > 0) {
    const deduction = mvr.minorViolations3yr * 5
    score -= deduction
    breakdown.mvr -= deduction
    flags.push(`${mvr.minorViolations3yr} minor violation(s) in past 3 years`)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MVR — Prior suspensions (-15 each)
  // ══════════════════════════════════════════════════════════════════════════
  
  if (mvr.suspensionsLifetime > 0) {
    const deduction = mvr.suspensionsLifetime * 15
    score -= deduction
    breakdown.mvr -= deduction
    flags.push(`${mvr.suspensionsLifetime} prior license suspension(s)`)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXPERIENCE BONUSES (+10 to +15 for clean long-term drivers)
  // ══════════════════════════════════════════════════════════════════════════
  
  if (mvr.yearsLicensed >= 10 && flags.length === 0) {
    score = Math.min(100, score + 15)
    breakdown.experience += 15
  } else if (mvr.yearsLicensed >= 5 && flags.length === 0) {
    score = Math.min(100, score + 10)
    breakdown.experience += 10
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RAD HISTORY BONUS (+2 per trip, max +10)
  // ══════════════════════════════════════════════════════════════════════════
  
  if (radHistory.completedTrips > 0 && radHistory.avgRoadScore >= 85) {
    const bonus = Math.min(radHistory.completedTrips * 2, 10)
    score = Math.min(100, score + bonus)
    breakdown.radHistory += bonus
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CLAMP SCORE
  // ══════════════════════════════════════════════════════════════════════════
  
  score = Math.max(0, Math.min(100, score))

  // ══════════════════════════════════════════════════════════════════════════
  // DETERMINE TIER + RECOMMENDATION
  // ══════════════════════════════════════════════════════════════════════════
  
  let tier: ScoreResult['tier']
  let recommendation: ScoreResult['recommendation']

  if (score >= 85) {
    tier = 'trusted'
    recommendation = 'approve'
  } else if (score >= 75) {
    tier = 'verified'
    recommendation = 'approve'
  } else if (score >= 60) {
    tier = 'review'
    recommendation = 'review'
  } else {
    tier = 'blocked'
    recommendation = 'decline'
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UNDER-25 SURCHARGE
  // ══════════════════════════════════════════════════════════════════════════
  
  const under25Surcharge = age < 25 ? 300 : 0
  const depositAddition = under25Surcharge

  return { 
    score, 
    tier, 
    recommendation, 
    hardBlock: false,
    hardBlockReason: null, 
    breakdown, 
    flags,
    under25Surcharge, 
    depositAddition
  }
}

/**
 * Get badge label for tier
 */
export function getTierBadgeLabel(tier: ScoreResult['tier']): string {
  switch (tier) {
    case 'trusted': return 'Trusted Driver'
    case 'verified': return 'Verified Driver'
    case 'review': return 'Review Required'
    case 'blocked': return 'Not Eligible'
  }
}

/**
 * Get badge color classes for tier
 */
export function getTierBadgeColors(tier: ScoreResult['tier']): string {
  switch (tier) {
    case 'trusted': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'verified': return 'bg-green-100 text-green-800 border-green-200'
    case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'blocked': return 'bg-red-100 text-red-800 border-red-200'
  }
}
