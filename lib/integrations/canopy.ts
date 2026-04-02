/**
 * Canopy Connect Insurance Verification Integration
 * Handles insurance policy verification and coverage limits validation
 */

import { createClient } from '@/lib/supabase/server'
import { recordBlockchainEvent } from '@/lib/blockchain'

const CANOPY_API_URL = process.env.CANOPY_API_URL || 'https://api.usecanopy.com/v1'
const CANOPY_API_KEY = process.env.CANOPY_API_KEY
const CANOPY_CLIENT_ID = process.env.CANOPY_CLIENT_ID

// Minimum coverage requirements for RAD renters (in cents)
const MIN_COVERAGE = {
  bodilyInjury: 10000000, // $100,000
  propertyDamage: 5000000, // $50,000
}

interface CanopySession {
  id: string
  link_url: string
  status: string
  expires_at: string
}

interface CanopyPolicy {
  id: string
  carrier_name: string
  policy_number: string
  policy_type: string
  effective_date: string
  expiration_date: string
  status: string
  coverages: {
    bodily_injury_per_person?: number
    bodily_injury_per_accident?: number
    property_damage?: number
    collision_deductible?: number
    comprehensive_deductible?: number
    uninsured_motorist?: number
  }
  vehicle_info?: {
    vin: string
    year: number
    make: string
    model: string
  }
  rideshare_endorsement?: boolean
}

export async function createCanopySession(
  userId: string,
  returnUrl: string
): Promise<{ sessionUrl: string; sessionId: string; error?: string }> {
  const supabase = await createClient()

  if (!CANOPY_API_KEY || !CANOPY_CLIENT_ID) {
    // Mock mode for development
    const mockSessionId = `mock_session_${Date.now()}`
    const mockUrl = `${returnUrl}?canopy_session=${mockSessionId}&mock=true`
    
    return { sessionUrl: mockUrl, sessionId: mockSessionId }
  }

  try {
    const response = await fetch(`${CANOPY_API_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CANOPY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: CANOPY_CLIENT_ID,
        user_reference: userId,
        return_url: returnUrl,
        pull_types: ['auto'],
        required_coverages: {
          bodily_injury: MIN_COVERAGE.bodilyInjury / 100,
          property_damage: MIN_COVERAGE.propertyDamage / 100,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Canopy session creation failed: ${error}`)
    }

    const session: CanopySession = await response.json()

    // Store session reference
    await supabase.from('canopy_policies').insert({
      user_id: userId,
      canopy_session_id: session.id,
      status: 'pending',
    })

    return { sessionUrl: session.link_url, sessionId: session.id }
  } catch (error) {
    console.error('[v0] Canopy session creation failed:', error)
    return { sessionUrl: '', sessionId: '', error: String(error) }
  }
}

export async function handleCanopyWebhook(payload: {
  event: string
  data: {
    session_id: string
    policies?: CanopyPolicy[]
  }
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { session_id, policies } = payload.data

    if (payload.event !== 'policies.retrieved' || !policies?.length) {
      return { success: true }
    }

    // Find the auto policy
    const autoPolicy = policies.find(p => p.policy_type === 'auto')
    
    if (!autoPolicy) {
      await supabase
        .from('canopy_policies')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('canopy_session_id', session_id)
      
      return { success: true }
    }

    // Check coverage limits
    const coverages = autoPolicy.coverages
    const bodilyInjury = (coverages.bodily_injury_per_person || 0) * 100
    const propertyDamage = (coverages.property_damage || 0) * 100
    
    const meetsRequirements = 
      bodilyInjury >= MIN_COVERAGE.bodilyInjury &&
      propertyDamage >= MIN_COVERAGE.propertyDamage

    // Check if expired
    const isExpired = new Date(autoPolicy.expiration_date) < new Date()

    let status: string
    if (isExpired) {
      status = 'expired'
    } else if (!meetsRequirements) {
      status = 'insufficient'
    } else {
      status = 'verified'
    }

    // Update policy record
    const { data: policyRecord, error: updateError } = await supabase
      .from('canopy_policies')
      .update({
        canopy_policy_id: autoPolicy.id,
        carrier_name: autoPolicy.carrier_name,
        policy_number: autoPolicy.policy_number,
        policy_type: 'auto',
        status,
        bodily_injury_limit: bodilyInjury,
        property_damage_limit: propertyDamage,
        collision_deductible: (coverages.collision_deductible || 0) * 100,
        comprehensive_deductible: (coverages.comprehensive_deductible || 0) * 100,
        rideshare_coverage: autoPolicy.rideshare_endorsement || false,
        effective_date: autoPolicy.effective_date,
        expiration_date: autoPolicy.expiration_date,
        coverage_limits: coverages,
        updated_at: new Date().toISOString(),
      })
      .eq('canopy_session_id', session_id)
      .select('user_id')
      .single()

    if (updateError) throw updateError

    // Update profile insurance status
    if (policyRecord && status === 'verified') {
      await supabase
        .from('profiles')
        .update({
          insurance_verified: true,
          insurance_verified_at: new Date().toISOString(),
        })
        .eq('id', policyRecord.user_id)

      // Record to blockchain
      await recordBlockchainEvent({
        eventType: 'inspection',
        eventData: {
          type: 'insurance_verification',
          userId: policyRecord.user_id,
          carrier: autoPolicy.carrier_name,
          status: 'verified',
          expiresAt: autoPolicy.expiration_date,
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error('[v0] Canopy webhook processing failed:', error)
    return { success: false, error: String(error) }
  }
}

export async function completeMockCanopySession(
  sessionId: string,
  userId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  // Simulate verified insurance
  const mockPolicy = {
    carrier_name: 'Mock Insurance Co',
    policy_number: 'POL-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    bodily_injury_limit: 25000000, // $250,000
    property_damage_limit: 10000000, // $100,000
    collision_deductible: 50000, // $500
    comprehensive_deductible: 25000, // $250
    effective_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expiration_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }

  await supabase
    .from('canopy_policies')
    .upsert({
      user_id: userId,
      canopy_session_id: sessionId,
      canopy_policy_id: `mock_policy_${Date.now()}`,
      carrier_name: mockPolicy.carrier_name,
      policy_number: mockPolicy.policy_number,
      policy_type: 'auto',
      status: 'verified',
      bodily_injury_limit: mockPolicy.bodily_injury_limit,
      property_damage_limit: mockPolicy.property_damage_limit,
      collision_deductible: mockPolicy.collision_deductible,
      comprehensive_deductible: mockPolicy.comprehensive_deductible,
      effective_date: mockPolicy.effective_date,
      expiration_date: mockPolicy.expiration_date,
      updated_at: new Date().toISOString(),
    })

  await supabase
    .from('profiles')
    .update({
      insurance_verified: true,
      insurance_verified_at: new Date().toISOString(),
    })
    .eq('id', userId)

  return { success: true }
}

export async function getInsuranceStatus(userId: string): Promise<{
  status: string
  policy?: {
    carrierName: string
    policyNumber: string
    bodilyInjuryLimit: number
    propertyDamageLimit: number
    expirationDate: string
    rideshare: boolean
  }
}> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('canopy_policies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) {
    return { status: 'not_started' }
  }

  return {
    status: data.status,
    policy: data.status === 'verified' ? {
      carrierName: data.carrier_name,
      policyNumber: data.policy_number,
      bodilyInjuryLimit: data.bodily_injury_limit,
      propertyDamageLimit: data.property_damage_limit,
      expirationDate: data.expiration_date,
      rideshare: data.rideshare_coverage,
    } : undefined,
  }
}

export async function checkRenterEligibility(userId: string): Promise<{
  eligible: boolean
  reasons: string[]
  mvrStatus: string
  insuranceStatus: string
}> {
  const [mvrResult, insuranceResult] = await Promise.all([
    getMVRStatus(userId),
    getInsuranceStatus(userId),
  ])

  const reasons: string[] = []

  // Check MVR status
  if (mvrResult.status !== 'clear') {
    if (mvrResult.status === 'not_started') {
      reasons.push('MVR check not completed')
    } else if (mvrResult.status === 'consider') {
      reasons.push('Driving record requires review')
    } else if (mvrResult.status === 'suspended') {
      reasons.push('License is suspended')
    } else {
      reasons.push('MVR check in progress')
    }
  }

  // Check insurance status
  if (insuranceResult.status !== 'verified') {
    if (insuranceResult.status === 'not_started') {
      reasons.push('Insurance verification not completed')
    } else if (insuranceResult.status === 'insufficient') {
      reasons.push('Insurance coverage below minimum requirements')
    } else if (insuranceResult.status === 'expired') {
      reasons.push('Insurance policy has expired')
    } else {
      reasons.push('Insurance verification in progress')
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    mvrStatus: mvrResult.status,
    insuranceStatus: insuranceResult.status,
  }
}

// Import from checkr module
async function getMVRStatus(userId: string) {
  const { getMVRStatus: getStatus } = await import('./checkr')
  return getStatus(userId)
}
