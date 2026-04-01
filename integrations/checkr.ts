/**
 * Checkr Integration — Driver Background Check and MVR Screening
 *
 * Used during renter onboarding to verify driving history before
 * the first booking. Results feed the RAD Rentability Score.
 *
 * Docs: https://docs.checkr.com
 */

const CHECKR_API = 'https://api.checkr.com/v1'

function checkrHeaders() {
  return {
    Authorization: `Basic ${Buffer.from(`${process.env.CHECKR_API_KEY}:`).toString('base64')}`,
    'Content-Type': 'application/json',
  }
}

export interface CheckrCandidate {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  dob?: string
  driver_license_number?: string
  driver_license_state?: string
  created_at: string
}

export interface CheckrReport {
  id: string
  status: 'pending' | 'consider' | 'clear' | 'dispute' | 'suspended'
  result?: 'clear' | 'consider'
  package: string
  candidate_id: string
  motor_vehicle_report?: {
    id: string
    status: string
    records: CheckrMVRRecord[]
    license_number?: string
    license_state?: string
    license_status?: string
    license_type?: string
    license_expiry?: string
    years_licensed?: number
  }
  created_at: string
  completed_at?: string
}

export interface CheckrMVRRecord {
  type: 'violation' | 'accident' | 'suspension' | 'dui'
  date: string
  description: string
  state?: string
  points?: number
  is_at_fault?: boolean
  disposition?: string
}

/**
 * Create a Checkr candidate (required before running a report)
 */
export async function createCandidate(params: {
  email: string
  firstName: string
  lastName: string
  phone?: string
  dob?: string
  licenseNumber?: string
  licenseState?: string
}): Promise<CheckrCandidate> {
  const res = await fetch(`${CHECKR_API}/candidates`, {
    method: 'POST',
    headers: checkrHeaders(),
    body: JSON.stringify({
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
      phone: params.phone,
      dob: params.dob,
      driver_license_number: params.licenseNumber,
      driver_license_state: params.licenseState,
    }),
  })
  if (!res.ok) throw new Error(`Checkr candidate creation failed: ${await res.text()}`)
  return res.json()
}

/**
 * Order an MVR (Motor Vehicle Report) for a candidate
 */
export async function orderMVRReport(candidateId: string): Promise<CheckrReport> {
  const res = await fetch(`${CHECKR_API}/reports`, {
    method: 'POST',
    headers: checkrHeaders(),
    body: JSON.stringify({
      package: 'driver_pro', // Includes MVR + 7yr driving record
      candidate_id: candidateId,
    }),
  })
  if (!res.ok) throw new Error(`Checkr report creation failed: ${await res.text()}`)
  return res.json()
}

/**
 * Get a report by ID (poll for completion)
 */
export async function getReport(reportId: string): Promise<CheckrReport> {
  const res = await fetch(`${CHECKR_API}/reports/${reportId}`, {
    headers: checkrHeaders(),
  })
  if (!res.ok) throw new Error(`Checkr report not found: ${reportId}`)
  return res.json()
}

/**
 * Get a candidate by ID
 */
export async function getCandidate(candidateId: string): Promise<CheckrCandidate> {
  const res = await fetch(`${CHECKR_API}/candidates/${candidateId}`, {
    headers: checkrHeaders(),
  })
  if (!res.ok) throw new Error(`Checkr candidate not found: ${candidateId}`)
  return res.json()
}

/**
 * Verify a Checkr webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const crypto = require('crypto')
  const expectedSig = crypto
    .createHmac('sha256', process.env.CHECKR_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex')
  return signature === `sha256=${expectedSig}`
}

/**
 * Send a pre-adverse action notice (legally required by FCRA before denying)
 */
export async function sendPreAdverseAction(params: {
  candidateId: string
  reportId: string
  chargeDescription: string
}): Promise<void> {
  await fetch(`${CHECKR_API}/adverse_actions`, {
    method: 'POST',
    headers: checkrHeaders(),
    body: JSON.stringify({
      charge: params.chargeDescription,
      candidate_id: params.candidateId,
      report_id: params.reportId,
    }),
  })
}
