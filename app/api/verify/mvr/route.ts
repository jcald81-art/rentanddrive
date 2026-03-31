import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

// MVR Scoring Configuration
const MVR_SCORING = {
  // Point deductions
  violations: {
    speeding_minor: -5,      // 1-14 mph over
    speeding_major: -15,     // 15+ mph over
    reckless_driving: -25,
    dui_dwi: -50,            // Auto-deny threshold
    at_fault_accident: -20,
    failure_to_yield: -10,
    running_red_light: -10,
    improper_lane_change: -5,
    following_too_close: -8,
    license_suspension: -40,
    license_revocation: -50, // Auto-deny threshold
    hit_and_run: -50,        // Auto-deny threshold
    vehicular_manslaughter: -100, // Auto-deny
    other: -5,
  },
  // Time decay - violations older than this get reduced impact
  decayYears: 3,
  decayMultiplier: 0.5,
  // Tier thresholds
  tiers: {
    green: { min: 80, max: 100 },
    yellow: { min: 50, max: 79 },
    red: { min: 20, max: 49 },
    auto_denied: { min: -Infinity, max: 19 },
  },
  // Auto-deny violations (regardless of score)
  autoDenyViolations: ['dui_dwi', 'hit_and_run', 'license_revocation', 'vehicular_manslaughter'],
}

interface MVRViolation {
  type: string
  date: string
  description: string
  points?: number
}

interface MVRReport {
  licenseStatus: 'valid' | 'expired' | 'suspended' | 'revoked'
  violations: MVRViolation[]
  accidents: {
    date: string
    atFault: boolean
    description: string
  }[]
}

function calculateMVRScore(report: MVRReport): { score: number; tier: string; denyReason: string | null } {
  let score = 100
  let denyReason: string | null = null
  const now = new Date()

  // Check license status first
  if (report.licenseStatus === 'revoked') {
    return { score: 0, tier: 'auto_denied', denyReason: 'License is revoked' }
  }
  if (report.licenseStatus === 'suspended') {
    return { score: 0, tier: 'auto_denied', denyReason: 'License is currently suspended' }
  }
  if (report.licenseStatus === 'expired') {
    score -= 30
  }

  // Process violations
  for (const violation of report.violations) {
    const violationType = violation.type.toLowerCase().replace(/\s+/g, '_')
    
    // Check for auto-deny violations
    if (MVR_SCORING.autoDenyViolations.some(v => violationType.includes(v))) {
      return { 
        score: 0, 
        tier: 'auto_denied', 
        denyReason: `Disqualifying violation: ${violation.description}` 
      }
    }

    // Calculate point deduction
    let deduction = MVR_SCORING.violations[violationType as keyof typeof MVR_SCORING.violations] || MVR_SCORING.violations.other
    
    // Apply time decay for older violations
    const violationDate = new Date(violation.date)
    const yearsAgo = (now.getTime() - violationDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
    if (yearsAgo > MVR_SCORING.decayYears) {
      deduction = Math.round(deduction * MVR_SCORING.decayMultiplier)
    }
    
    score += deduction // deduction is negative
  }

  // Process at-fault accidents
  for (const accident of report.accidents) {
    if (accident.atFault) {
      const accidentDate = new Date(accident.date)
      const yearsAgo = (now.getTime() - accidentDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
      let deduction = MVR_SCORING.violations.at_fault_accident
      
      if (yearsAgo > MVR_SCORING.decayYears) {
        deduction = Math.round(deduction * MVR_SCORING.decayMultiplier)
      }
      
      score += deduction
    }
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score))

  // Determine tier
  let tier: string
  if (score >= MVR_SCORING.tiers.green.min) {
    tier = 'green'
  } else if (score >= MVR_SCORING.tiers.yellow.min) {
    tier = 'yellow'
  } else if (score >= MVR_SCORING.tiers.red.min) {
    tier = 'red'
  } else {
    tier = 'auto_denied'
    denyReason = 'Driving record score below minimum threshold'
  }

  return { score, tier, denyReason }
}

// Simulated MVR check - in production this would call Checkr API
async function performMVRCheck(userId: string, licenseNumber?: string, licenseState?: string): Promise<MVRReport> {
  // TODO: Replace with actual Checkr API integration
  // For now, return a mock clean record for demo purposes
  // In production:
  // 1. Call Checkr API to create MVR report
  // 2. Wait for webhook or poll for completion
  // 3. Parse and return results
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Return mock data - clean record for demo
  return {
    licenseStatus: 'valid',
    violations: [],
    accidents: [],
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, fcraAcknowledged, consentGiven } = body

    if (!userId || !fcraAcknowledged || !consentGiven) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, fcraAcknowledged, and consentGiven are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify the user exists and get their info
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get client IP for consent logging
    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'

    // Check if user already has a recent MVR check
    const { data: existingVerification } = await supabase
      .from('driver_verifications')
      .select('*')
      .eq('user_id', userId)
      .single()

    // If recent MVR exists and is still valid, return cached result
    if (existingVerification?.mvr_pulled_at) {
      const lastCheck = new Date(existingVerification.mvr_pulled_at)
      const daysSinceCheck = (Date.now() - lastCheck.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceCheck < 365 && existingVerification.mvr_status !== 'pending') {
        return NextResponse.json({
          mvrStatus: existingVerification.mvr_status,
          mvrTier: existingVerification.mvr_tier,
          mvrScore: existingVerification.mvr_score,
          cached: true,
        })
      }
    }

    // Get license info from verification record
    const licenseNumber = existingVerification?.license_number
    const licenseState = existingVerification?.license_state

    // Perform MVR check
    const mvrReport = await performMVRCheck(userId, licenseNumber, licenseState)
    
    // Calculate score and tier
    const { score, tier, denyReason } = calculateMVRScore(mvrReport)
    
    // Determine status
    let mvrStatus: 'passed' | 'flagged' | 'denied'
    if (tier === 'auto_denied') {
      mvrStatus = 'denied'
    } else if (tier === 'red' || tier === 'yellow') {
      mvrStatus = 'flagged'
    } else {
      mvrStatus = 'passed'
    }

    // Calculate annual recheck date
    const annualRecheckDue = new Date()
    annualRecheckDue.setFullYear(annualRecheckDue.getFullYear() + 1)

    // Update or insert verification record
    const verificationData = {
      user_id: userId,
      mvr_status: mvrStatus,
      mvr_pulled_at: new Date().toISOString(),
      mvr_score: score,
      mvr_tier: tier,
      mvr_deny_reason: denyReason,
      mvr_consent_given: consentGiven,
      mvr_consent_timestamp: new Date().toISOString(),
      mvr_consent_ip: clientIp,
      fcra_disclosure_acknowledged: fcraAcknowledged,
      annual_recheck_due: annualRecheckDue.toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    }

    if (existingVerification) {
      const { error: updateError } = await supabase
        .from('driver_verifications')
        .update(verificationData)
        .eq('user_id', userId)

      if (updateError) {
        console.error('Error updating verification:', updateError)
        return NextResponse.json(
          { error: 'Failed to update verification record' },
          { status: 500 }
        )
      }
    } else {
      const { error: insertError } = await supabase
        .from('driver_verifications')
        .insert({
          ...verificationData,
          created_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Error inserting verification:', insertError)
        return NextResponse.json(
          { error: 'Failed to create verification record' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      mvrStatus,
      mvrTier: tier,
      mvrScore: score,
      denyReason,
      annualRecheckDue: annualRecheckDue.toISOString().split('T')[0],
    })

  } catch (error) {
    console.error('MVR verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check MVR status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: verification } = await supabase
      .from('driver_verifications')
      .select('mvr_status, mvr_tier, mvr_score, mvr_pulled_at, annual_recheck_due')
      .eq('user_id', user.id)
      .single()

    if (!verification) {
      return NextResponse.json({
        mvrStatus: 'pending',
        mvrTier: null,
        mvrScore: null,
        needsCheck: true,
      })
    }

    // Check if annual recheck is due
    const recheckDue = verification.annual_recheck_due 
      ? new Date(verification.annual_recheck_due) < new Date()
      : false

    return NextResponse.json({
      mvrStatus: verification.mvr_status,
      mvrTier: verification.mvr_tier,
      mvrScore: verification.mvr_score,
      lastChecked: verification.mvr_pulled_at,
      annualRecheckDue: verification.annual_recheck_due,
      needsRecheck: recheckDue,
    })

  } catch (error) {
    console.error('Error fetching MVR status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
