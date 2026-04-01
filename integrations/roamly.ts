/**
 * Roamly Insurance Integration — Quote-to-Bind API
 * Docs: https://docs.roamly.com
 *
 * Auth: API key in X-API-Key header (obtained from Roamly partner portal)
 * All monetary values are in USD cents unless otherwise noted.
 */

const ROAMLY_BASE_URL = process.env.ROAMLY_API_URL ?? 'https://api.roamly.com/v1'
const ROAMLY_API_KEY = process.env.ROAMLY_API_KEY ?? ''
const ROAMLY_PARTNER_ID = process.env.ROAMLY_PARTNER_ID ?? ''

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RoamlyVehicle {
  vin?: string
  year: number
  make: string
  model: string
  category?: 'sedan' | 'suv' | 'truck' | 'van' | 'luxury' | 'ev' | 'motorcycle'
  daily_value_cents: number
}

export interface RoamlyDriver {
  first_name: string
  last_name: string
  date_of_birth?: string   // ISO date YYYY-MM-DD
  license_number?: string
  license_state?: string
  email: string
}

export interface RoamlyQuoteRequest {
  vehicle: RoamlyVehicle
  driver: RoamlyDriver
  rental_start: string     // ISO datetime
  rental_end: string       // ISO datetime
  pickup_location?: string // free text address
  partner_id?: string
  external_booking_ref?: string
}

export interface RoamlyPlan {
  plan_id: string
  name: string             // 'basic' | 'standard' | 'premium'
  premium_cents: number
  deductible_cents: number
  liability_limit_cents: number
  collision: boolean
  comprehensive: boolean
  roadside_assistance: boolean
  personal_effects: boolean
  uninsured_motorist: boolean
  max_claim_cents: number
}

export interface RoamlyQuoteResponse {
  quote_id: string
  expires_at: string
  plans: RoamlyPlan[]
  recommended_plan_id: string
  currency: 'USD'
}

export interface RoamlyBindRequest {
  quote_id: string
  plan_id: string
  booking_reference: string
  driver: RoamlyDriver
}

export interface RoamlyPolicy {
  policy_id: string
  policy_number: string
  quote_id: string
  plan_id: string
  status: 'active' | 'pending' | 'cancelled'
  coverage_start: string
  coverage_end: string
  premium_cents: number
  deductible_cents: number
  certificate_url?: string
}

export interface RoamlyWebhookPayload {
  event: 'policy.activated' | 'policy.cancelled' | 'claim.filed' | 'claim.resolved'
  policy_id: string
  policy_number?: string
  claim_id?: string
  status?: string
  timestamp: string
  data: Record<string, unknown>
}

// ── Client ────────────────────────────────────────────────────────────────────

class RoamlyClient {
  private baseUrl: string
  private apiKey: string
  private partnerId: string

  constructor() {
    this.baseUrl = ROAMLY_BASE_URL
    this.apiKey = ROAMLY_API_KEY
    this.partnerId = ROAMLY_PARTNER_ID
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'X-Partner-Id': this.partnerId,
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`

    const res = await fetch(url, {
      method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(
        `Roamly API error ${res.status}: ${(err as { message?: string }).message ?? res.statusText}`,
      )
    }

    return res.json() as Promise<T>
  }

  /**
   * Get real-time quotes for all coverage tiers for a rental.
   * Returns quotes for basic / standard / premium plans.
   */
  async getQuote(req: RoamlyQuoteRequest): Promise<RoamlyQuoteResponse> {
    return this.request<RoamlyQuoteResponse>('POST', '/quotes', {
      ...req,
      partner_id: req.partner_id ?? this.partnerId,
    })
  }

  /**
   * Bind (activate) a specific plan from an existing quote.
   * Must be called within quote.expires_at window.
   */
  async bindPolicy(req: RoamlyBindRequest): Promise<RoamlyPolicy> {
    return this.request<RoamlyPolicy>('POST', '/policies/bind', req)
  }

  /**
   * Retrieve a policy by its ID.
   */
  async getPolicy(policyId: string): Promise<RoamlyPolicy> {
    return this.request<RoamlyPolicy>('GET', `/policies/${policyId}`)
  }

  /**
   * Cancel an active policy (e.g. booking cancelled before trip).
   */
  async cancelPolicy(policyId: string, reason?: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('PUT', `/policies/${policyId}/cancel`, { reason })
  }

  /**
   * Verify a webhook signature from Roamly.
   * Uses HMAC-SHA256 with ROAMLY_WEBHOOK_SECRET.
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secret = process.env.ROAMLY_WEBHOOK_SECRET ?? ''
    if (!secret) return false

    try {
      const crypto = require('crypto') as typeof import('crypto')
      const expected = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')
      return `sha256=${expected}` === signature
    } catch {
      return false
    }
  }
}

export const roamly = new RoamlyClient()

// ── Internal fallback quotes (when Roamly key not configured) ─────────────────

export function buildInternalQuotes(
  vehicleDailyRateCents: number,
  days: number,
): RoamlyPlan[] {
  const value = vehicleDailyRateCents * days

  // Base rate scales with rental value
  const valueMultiplier = value > 500_00 ? 1.3 : value > 200_00 ? 1.15 : 1.0

  return [
    {
      plan_id: 'rad_basic',
      name: 'basic',
      premium_cents: Math.round(800 * days * valueMultiplier),       // ~$8/day
      deductible_cents: 250_00,
      liability_limit_cents: 100_000_00,
      collision: false,
      comprehensive: false,
      roadside_assistance: false,
      personal_effects: false,
      uninsured_motorist: false,
      max_claim_cents: 100_000_00,
    },
    {
      plan_id: 'rad_standard',
      name: 'standard',
      premium_cents: Math.round(1500 * days * valueMultiplier),      // ~$15/day
      deductible_cents: 150_00,
      liability_limit_cents: 300_000_00,
      collision: true,
      comprehensive: false,
      roadside_assistance: true,
      personal_effects: false,
      uninsured_motorist: true,
      max_claim_cents: 300_000_00,
    },
    {
      plan_id: 'rad_premium',
      name: 'premium',
      premium_cents: Math.round(2500 * days * valueMultiplier),      // ~$25/day
      deductible_cents: 50_00,
      liability_limit_cents: 500_000_00,
      collision: true,
      comprehensive: true,
      roadside_assistance: true,
      personal_effects: true,
      uninsured_motorist: true,
      max_claim_cents: 500_000_00,
    },
  ]
}
