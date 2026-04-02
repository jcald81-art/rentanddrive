/**
 * Checkr MVR (Motor Vehicle Report) Integration
 * Handles background checks and driving record verification
 */

import { createClient } from '@/lib/supabase/server'
import { recordBlockchainEvent } from '@/lib/blockchain'

const CHECKR_API_URL = process.env.CHECKR_API_URL || 'https://api.checkr.com/v1'
const CHECKR_API_KEY = process.env.CHECKR_API_KEY

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
  status: string
  package: string
  candidate_id: string
  motor_vehicle_report?: {
    status: string
    result: string
    violations: Array<{
      type: string
      description: string
      date: string
      points: number
    }>
    accidents: Array<{
      date: string
      description: string
      fault: string
    }>
    license: {
      status: string
      class: string
      expiration_date: string
      state: string
    }
  }
}

export async function createCheckrCandidate(
  userId: string,
  userData: {
    email: string
    firstName: string
    lastName: string
    dob: string
    licenseNumber: string
    licenseState: string
  }
): Promise<{ candidateId: string; error?: string }> {
  if (!CHECKR_API_KEY) {
    console.log('[v0] Checkr API key not configured, using mock mode')
    return { candidateId: `mock_candidate_${userId}` }
  }

  try {
    const response = await fetch(`${CHECKR_API_URL}/candidates`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(CHECKR_API_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        dob: userData.dob,
        driver_license_number: userData.licenseNumber,
        driver_license_state: userData.licenseState,
        custom_id: userId,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Checkr API error: ${error}`)
    }

    const candidate: CheckrCandidate = await response.json()
    return { candidateId: candidate.id }
  } catch (error) {
    console.error('[v0] Checkr candidate creation failed:', error)
    return { candidateId: '', error: String(error) }
  }
}

export async function requestMVRReport(
  userId: string,
  candidateId: string
): Promise<{ reportId: string; error?: string }> {
  const supabase = await createClient()

  if (!CHECKR_API_KEY || candidateId.startsWith('mock_')) {
    // Mock mode for development
    const mockReportId = `mock_report_${Date.now()}`
    
    await supabase.from('checkr_reports').insert({
      user_id: userId,
      checkr_candidate_id: candidateId,
      checkr_report_id: mockReportId,
      report_type: 'mvr',
      status: 'processing',
    })

    // Simulate async completion
    setTimeout(async () => {
      await completeMockMVR(mockReportId)
    }, 5000)

    return { reportId: mockReportId }
  }

  try {
    const response = await fetch(`${CHECKR_API_URL}/reports`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(CHECKR_API_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate_id: candidateId,
        package: 'driver_pro', // Includes MVR
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Checkr report request failed: ${error}`)
    }

    const report: CheckrReport = await response.json()

    await supabase.from('checkr_reports').insert({
      user_id: userId,
      checkr_candidate_id: candidateId,
      checkr_report_id: report.id,
      report_type: 'mvr',
      status: 'processing',
    })

    return { reportId: report.id }
  } catch (error) {
    console.error('[v0] Checkr MVR request failed:', error)
    return { reportId: '', error: String(error) }
  }
}

async function completeMockMVR(reportId: string) {
  const supabase = await createClient()
  
  // Random result for testing
  const isClear = Math.random() > 0.2
  
  await supabase
    .from('checkr_reports')
    .update({
      status: isClear ? 'clear' : 'consider',
      violations_count: isClear ? 0 : Math.floor(Math.random() * 3),
      dui_count: 0,
      accidents_count: isClear ? 0 : Math.floor(Math.random() * 2),
      license_status: 'valid',
      license_state: 'CA',
      license_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('checkr_report_id', reportId)
}

export async function handleCheckrWebhook(payload: {
  type: string
  data: {
    object: CheckrReport
  }
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const report = payload.data.object
    const mvr = report.motor_vehicle_report

    if (!mvr) {
      return { success: true } // Not an MVR report
    }

    // Map Checkr status to our status
    let status: string
    switch (report.status) {
      case 'complete':
        status = mvr.result === 'clear' ? 'clear' : 'consider'
        break
      case 'suspended':
        status = 'suspended'
        break
      case 'dispute':
        status = 'dispute'
        break
      default:
        status = 'processing'
    }

    // Count violations
    const violations = mvr.violations || []
    const duis = violations.filter(v => 
      v.type.toLowerCase().includes('dui') || 
      v.type.toLowerCase().includes('dwi')
    )

    // Update report in database
    const { data: reportRecord, error: updateError } = await supabase
      .from('checkr_reports')
      .update({
        status,
        violations_count: violations.length,
        dui_count: duis.length,
        accidents_count: (mvr.accidents || []).length,
        license_status: mvr.license?.status || 'unknown',
        license_state: mvr.license?.state,
        license_expiry: mvr.license?.expiration_date,
        result_summary: {
          violations: violations.map(v => ({
            type: v.type,
            date: v.date,
            points: v.points,
          })),
          accidents: mvr.accidents,
          license: mvr.license,
        },
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('checkr_report_id', report.id)
      .select('user_id')
      .single()

    if (updateError) throw updateError

    // Update profile MVR status
    if (reportRecord) {
      await supabase
        .from('profiles')
        .update({
          mvr_status: status,
          mvr_cleared_at: status === 'clear' ? new Date().toISOString() : null,
        })
        .eq('id', reportRecord.user_id)

      // Record to blockchain if clear
      if (status === 'clear') {
        await recordBlockchainEvent({
          eventType: 'inspection',
          eventData: {
            type: 'mvr_verification',
            userId: reportRecord.user_id,
            status: 'clear',
            verifiedAt: new Date().toISOString(),
          },
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[v0] Checkr webhook processing failed:', error)
    return { success: false, error: String(error) }
  }
}

export async function getMVRStatus(userId: string): Promise<{
  status: string
  report?: {
    violationsCount: number
    duiCount: number
    accidentsCount: number
    licenseStatus: string
    licenseExpiry: string | null
    expiresAt: string | null
  }
}> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('checkr_reports')
    .select('*')
    .eq('user_id', userId)
    .eq('report_type', 'mvr')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) {
    return { status: 'not_started' }
  }

  return {
    status: data.status,
    report: {
      violationsCount: data.violations_count,
      duiCount: data.dui_count,
      accidentsCount: data.accidents_count,
      licenseStatus: data.license_status,
      licenseExpiry: data.license_expiry,
      expiresAt: data.expires_at,
    },
  }
}
