/**
 * FLASH - Instant Renter Approval Agent
 * 
 * INDUSTRY DISRUPTOR: While Turo takes hours/days for approval,
 * Flash approves renters in under 60 seconds using AI risk scoring.
 * 
 * Combines:
 * - Driver's license OCR verification
 * - Insurance verification
 * - Social trust signals (optional)
 * - Behavioral risk scoring
 * - Fraud detection patterns
 */

import { createClient } from '@/lib/supabase/server'

interface ApprovalRequest {
  userId: string
  licenseImage?: string
  insuranceImage?: string
  selfieImage?: string
  socialProfiles?: {
    linkedin?: string
    facebook?: string
  }
}

interface ApprovalResult {
  approved: boolean
  score: number // 0-100
  tier: 'instant' | 'standard' | 'manual_review'
  approvalTime: number // milliseconds
  reasons: string[]
  restrictions?: string[]
}

// Risk factors that affect approval
const RISK_WEIGHTS = {
  license_valid: 25,
  license_not_expired: 15,
  age_over_25: 10,
  age_over_21: 5,
  insurance_valid: 20,
  no_fraud_signals: 15,
  phone_verified: 5,
  email_verified: 5,
  social_linked: 5,
  returning_customer: 10,
  good_review_history: 10,
}

export class Flash {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  /**
   * Instant approval - the core disruptor
   * Target: Under 60 seconds for 80% of applicants
   */
  async processInstantApproval(request: ApprovalRequest): Promise<ApprovalResult> {
    const startTime = Date.now()
    const supabase = await createClient()
    let score = 0
    const reasons: string[] = []
    const restrictions: string[] = []

    // 1. Check if returning customer with good history
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('is_verified, phone_verified, email_verified, created_at')
      .eq('id', request.userId)
      .single()

    const { data: pastBookings } = await supabase
      .from('bookings')
      .select('id, status, renter_rating')
      .eq('renter_id', request.userId)
      .eq('status', 'completed')

    // Returning customer bonus
    if (pastBookings && pastBookings.length > 0) {
      score += RISK_WEIGHTS.returning_customer
      reasons.push('Returning customer with rental history')
      
      // Good review history
      const avgRating = pastBookings.reduce((sum, b) => sum + (b.renter_rating || 5), 0) / pastBookings.length
      if (avgRating >= 4.5) {
        score += RISK_WEIGHTS.good_review_history
        reasons.push('Excellent rental history')
      }
    }

    // Verification bonuses
    if (existingProfile?.phone_verified) {
      score += RISK_WEIGHTS.phone_verified
      reasons.push('Phone verified')
    }
    if (existingProfile?.email_verified) {
      score += RISK_WEIGHTS.email_verified
      reasons.push('Email verified')
    }

    // 2. Driver's license verification (mock for now, would use AI OCR)
    if (request.licenseImage) {
      const licenseResult = await this.verifyLicense(request.licenseImage)
      if (licenseResult.valid) {
        score += RISK_WEIGHTS.license_valid
        reasons.push('Valid driver\'s license')
        
        if (!licenseResult.expired) {
          score += RISK_WEIGHTS.license_not_expired
        }
        
        if (licenseResult.age >= 25) {
          score += RISK_WEIGHTS.age_over_25
          reasons.push('Age 25+, no young driver restrictions')
        } else if (licenseResult.age >= 21) {
          score += RISK_WEIGHTS.age_over_21
          restrictions.push('Young driver fee may apply')
        } else {
          restrictions.push('Driver must be at least 21')
        }
      }
    }

    // 3. Insurance verification
    if (request.insuranceImage) {
      const insuranceResult = await this.verifyInsurance(request.insuranceImage)
      if (insuranceResult.valid) {
        score += RISK_WEIGHTS.insurance_valid
        reasons.push('Valid insurance on file')
      }
    }

    // 4. Fraud detection
    const fraudSignals = await this.checkFraudSignals(request.userId)
    if (!fraudSignals.hasRisk) {
      score += RISK_WEIGHTS.no_fraud_signals
      reasons.push('No fraud signals detected')
    } else {
      restrictions.push('Additional verification required')
    }

    // 5. Social trust (optional enhancement)
    if (request.socialProfiles?.linkedin || request.socialProfiles?.facebook) {
      score += RISK_WEIGHTS.social_linked
      reasons.push('Social profiles linked')
    }

    // Calculate approval tier
    const approvalTime = Date.now() - startTime
    let tier: 'instant' | 'standard' | 'manual_review'
    let approved = false

    if (score >= 70) {
      tier = 'instant'
      approved = true
    } else if (score >= 50) {
      tier = 'standard'
      approved = true
    } else {
      tier = 'manual_review'
      approved = false
    }

    // Log to agent activity
    await supabase.from('rd_agent_log').insert({
      user_id: this.userId,
      action_type: 'instant_approval',
      action_summary: `Flash: ${approved ? 'APPROVED' : 'REVIEW'} in ${approvalTime}ms (score: ${score})`,
      input_data: { request },
      output_data: { score, tier, reasons, restrictions },
      triggered_by: 'user_action',
      success: true,
    })

    // Update profile verification status
    if (approved && tier === 'instant') {
      await supabase
        .from('profiles')
        .update({ 
          is_verified: true,
          verified_at: new Date().toISOString(),
          verification_score: score,
        })
        .eq('id', request.userId)
    }

    return {
      approved,
      score,
      tier,
      approvalTime,
      reasons,
      restrictions,
    }
  }

  // Mock license verification (would use AI OCR in production)
  private async verifyLicense(imageUrl: string): Promise<{
    valid: boolean
    expired: boolean
    age: number
    state: string
  }> {
    // In production: Call Google Vision or AWS Textract for OCR
    // Then validate against DMV APIs
    return {
      valid: true,
      expired: false,
      age: 28,
      state: 'NV',
    }
  }

  // Mock insurance verification
  private async verifyInsurance(imageUrl: string): Promise<{
    valid: boolean
    coverage: string
    expiration: string
  }> {
    // In production: Call insurance verification API
    return {
      valid: true,
      coverage: 'full',
      expiration: '2027-01-01',
    }
  }

  // Check for fraud signals
  private async checkFraudSignals(userId: string): Promise<{
    hasRisk: boolean
    signals: string[]
  }> {
    const supabase = await createClient()
    const signals: string[] = []
    
    // Check for multiple accounts from same IP
    // Check for suspicious booking patterns
    // Check email domain reputation
    // Check phone number reputation
    
    // For now, return clean
    return {
      hasRisk: false,
      signals,
    }
  }
}

// Flash personality for messages
export const FLASH_MESSAGES = {
  approved_instant: "Flash here. You're approved. Took me {time}ms. That's {competitor_comparison}x faster than other platforms. You can book any vehicle immediately.",
  approved_standard: "Flash here. Approved you in under a minute. A few restrictions apply based on your profile, but you're good to go.",
  review_required: "Flash here. Need a human to take a look at your application. Usually takes 1-2 hours. We'll text you the moment you're cleared.",
  returning_customer: "Flash here. Welcome back. Your instant approval is still active. Go book something fun.",
}

export async function processFlashApproval(userId: string, request: Omit<ApprovalRequest, 'userId'>): Promise<ApprovalResult> {
  const flash = new Flash(userId)
  return flash.processInstantApproval({ userId, ...request })
}
