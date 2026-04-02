/**
 * RAD Command Center - Tier 1 Integrations Index
 * 
 * Safety & Compliance:
 * - Checkr: MVR (Motor Vehicle Reports) for renter driving record verification
 * - Canopy: Insurance verification with coverage limit validation
 * - Stripe Radar: Payment fraud detection and risk scoring
 * 
 * EV & Vehicle Connectivity:
 * - Smartcar: Universal vehicle API for 40+ makes (telemetry, lock/unlock)
 * - Tesla Fleet: Tesla-specific features (Sentry Mode, preconditioning)
 * 
 * All integrations record critical events to blockchain via NFT twins
 */

// Safety Integrations
export * from './checkr'
export * from './canopy'
export * from './stripe-radar'

// EV Integrations  
export * from './smartcar'
export * from './tesla-fleet'

// Unified Service
export * from './safety-service'

// Integration Status Types
export interface IntegrationStatus {
  name: string
  connected: boolean
  lastSync?: string
  error?: string
}

export interface Tier1IntegrationSummary {
  safety: {
    checkr: IntegrationStatus
    canopy: IntegrationStatus
    stripeRadar: IntegrationStatus
  }
  ev: {
    smartcar: IntegrationStatus
    teslaFleet: IntegrationStatus
  }
}

/**
 * Get summary of all Tier 1 integration statuses
 */
export async function getTier1IntegrationSummary(): Promise<Tier1IntegrationSummary> {
  return {
    safety: {
      checkr: {
        name: 'Checkr MVR',
        connected: !!process.env.CHECKR_API_KEY,
      },
      canopy: {
        name: 'Canopy Insurance',
        connected: !!process.env.CANOPY_API_KEY,
      },
      stripeRadar: {
        name: 'Stripe Radar',
        connected: !!process.env.STRIPE_SECRET_KEY,
      },
    },
    ev: {
      smartcar: {
        name: 'Smartcar',
        connected: !!process.env.SMARTCAR_CLIENT_ID,
      },
      teslaFleet: {
        name: 'Tesla Fleet',
        connected: !!process.env.TESLA_CLIENT_ID,
      },
    },
  }
}
