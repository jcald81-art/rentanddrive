/**
 * Unified Safety & Verification Service
 * Aggregates all safety integrations for renter and vehicle verification
 */

import { createClient } from '@/lib/supabase/server'
import { getMVRStatus } from './checkr'
import { getInsuranceStatus, checkRenterEligibility } from './canopy'
import { getVehicleTelemetry, lockVehicle, unlockVehicle } from './smartcar'
import { getVehicleData, setSentryMode, preconditionVehicle } from './tesla-fleet'
import { checkUserFraudRisk } from './stripe-radar'

export interface RenterSafetyProfile {
  userId: string
  mvr: {
    status: string
    violationsCount?: number
    duiCount?: number
    licenseExpiry?: string
    expiresAt?: string
  }
  insurance: {
    status: string
    carrierName?: string
    bodilyInjuryLimit?: number
    propertyDamageLimit?: number
    expirationDate?: string
  }
  fraud: {
    riskLevel: string
    recentBlocks: number
    canBook: boolean
    reason?: string
  }
  eligible: boolean
  eligibilityReasons: string[]
}

export interface VehicleSafetyStatus {
  vehicleId: string
  smartcar: {
    connected: boolean
    lastSync?: string
    telemetry?: {
      odometer?: number
      batteryPercent?: number
      batteryRange?: number
      isCharging?: boolean
      isLocked?: boolean
      latitude?: number
      longitude?: number
    }
  }
  tesla: {
    connected: boolean
    sentryMode?: boolean
    preconditioning?: boolean
    chargeState?: {
      batteryLevel: number
      batteryRange: number
      chargingState: string
      minutesToFullCharge: number
    }
  }
  isEv: boolean
  blockchainVerified: boolean
}

/**
 * Get comprehensive renter safety profile
 */
export async function getRenterSafetyProfile(userId: string): Promise<RenterSafetyProfile> {
  const [mvrResult, insuranceResult, fraudResult] = await Promise.all([
    getMVRStatus(userId),
    getInsuranceStatus(userId),
    checkUserFraudRisk(userId),
  ])

  const eligibilityCheck = await checkRenterEligibility(userId)

  return {
    userId,
    mvr: {
      status: mvrResult.status,
      violationsCount: mvrResult.report?.violationsCount,
      duiCount: mvrResult.report?.duiCount,
      licenseExpiry: mvrResult.report?.licenseExpiry || undefined,
      expiresAt: mvrResult.report?.expiresAt || undefined,
    },
    insurance: {
      status: insuranceResult.status,
      carrierName: insuranceResult.policy?.carrierName,
      bodilyInjuryLimit: insuranceResult.policy?.bodilyInjuryLimit,
      propertyDamageLimit: insuranceResult.policy?.propertyDamageLimit,
      expirationDate: insuranceResult.policy?.expirationDate,
    },
    fraud: fraudResult,
    eligible: eligibilityCheck.eligible && fraudResult.canBook,
    eligibilityReasons: [
      ...eligibilityCheck.reasons,
      ...(fraudResult.reason ? [fraudResult.reason] : []),
    ],
  }
}

/**
 * Get comprehensive vehicle safety status
 */
export async function getVehicleSafetyStatus(vehicleId: string): Promise<VehicleSafetyStatus> {
  const supabase = await createClient()

  // Get vehicle connection status
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('smartcar_connected, tesla_fleet_connected, is_ev')
    .eq('id', vehicleId)
    .single()

  const result: VehicleSafetyStatus = {
    vehicleId,
    smartcar: { connected: vehicle?.smartcar_connected || false },
    tesla: { connected: vehicle?.tesla_fleet_connected || false },
    isEv: vehicle?.is_ev || false,
    blockchainVerified: false,
  }

  // Get Smartcar telemetry if connected
  if (vehicle?.smartcar_connected) {
    const telemetry = await getVehicleTelemetry(vehicleId)
    if (telemetry) {
      result.smartcar.telemetry = {
        odometer: telemetry.odometer,
        batteryPercent: telemetry.batteryPercent,
        batteryRange: telemetry.batteryRange,
        isCharging: telemetry.isCharging,
        isLocked: telemetry.isLocked,
        latitude: telemetry.latitude,
        longitude: telemetry.longitude,
      }
    }

    // Get last sync time
    const { data: connection } = await supabase
      .from('smartcar_connections')
      .select('last_sync_at')
      .eq('vehicle_id', vehicleId)
      .single()
    
    result.smartcar.lastSync = connection?.last_sync_at
  }

  // Get Tesla data if connected
  if (vehicle?.tesla_fleet_connected) {
    const teslaData = await getVehicleData(vehicleId)
    if (teslaData) {
      result.tesla.chargeState = teslaData.chargeState
      result.tesla.sentryMode = teslaData.vehicleState?.sentryMode
      result.tesla.preconditioning = teslaData.climateState?.isPreconditioning
    }
  }

  // Check blockchain verification
  const { data: nft } = await supabase
    .from('vehicle_nfts')
    .select('is_verified')
    .eq('vehicle_id', vehicleId)
    .single()
  
  result.blockchainVerified = nft?.is_verified || false

  return result
}

/**
 * Execute rental start safety checks
 */
export async function executeRentalStartChecks(
  bookingId: string,
  renterId: string,
  vehicleId: string
): Promise<{
  passed: boolean
  checks: Array<{ name: string; passed: boolean; reason?: string }>
}> {
  const checks: Array<{ name: string; passed: boolean; reason?: string }> = []

  // 1. Verify renter eligibility
  const renterProfile = await getRenterSafetyProfile(renterId)
  
  checks.push({
    name: 'Renter MVR Verified',
    passed: renterProfile.mvr.status === 'clear',
    reason: renterProfile.mvr.status !== 'clear' 
      ? `MVR status: ${renterProfile.mvr.status}`
      : undefined,
  })

  checks.push({
    name: 'Insurance Verified',
    passed: renterProfile.insurance.status === 'verified',
    reason: renterProfile.insurance.status !== 'verified'
      ? `Insurance status: ${renterProfile.insurance.status}`
      : undefined,
  })

  checks.push({
    name: 'Fraud Risk Check',
    passed: renterProfile.fraud.canBook,
    reason: renterProfile.fraud.reason,
  })

  // 2. Get vehicle status
  const vehicleStatus = await getVehicleSafetyStatus(vehicleId)

  // 3. If connected, unlock vehicle
  if (vehicleStatus.smartcar.connected) {
    const unlockResult = await unlockVehicle(vehicleId)
    checks.push({
      name: 'Vehicle Unlocked',
      passed: unlockResult.success,
      reason: unlockResult.error,
    })
  }

  // 4. If Tesla, disable sentry mode for rental
  if (vehicleStatus.tesla.connected && vehicleStatus.tesla.sentryMode) {
    const sentryResult = await setSentryMode(vehicleId, false)
    checks.push({
      name: 'Sentry Mode Disabled',
      passed: sentryResult.success,
      reason: sentryResult.error,
    })
  }

  const allPassed = checks.every(c => c.passed)

  return { passed: allPassed, checks }
}

/**
 * Execute rental end safety checks
 */
export async function executeRentalEndChecks(
  bookingId: string,
  vehicleId: string
): Promise<{
  passed: boolean
  checks: Array<{ name: string; passed: boolean; reason?: string }>
}> {
  const checks: Array<{ name: string; passed: boolean; reason?: string }> = []

  const vehicleStatus = await getVehicleSafetyStatus(vehicleId)

  // 1. Lock vehicle
  if (vehicleStatus.smartcar.connected) {
    const lockResult = await lockVehicle(vehicleId)
    checks.push({
      name: 'Vehicle Locked',
      passed: lockResult.success,
      reason: lockResult.error,
    })
  }

  // 2. Re-enable sentry mode for Tesla
  if (vehicleStatus.tesla.connected) {
    const sentryResult = await setSentryMode(vehicleId, true)
    checks.push({
      name: 'Sentry Mode Enabled',
      passed: sentryResult.success,
      reason: sentryResult.error,
    })
  }

  // 3. Record final telemetry
  if (vehicleStatus.smartcar.connected) {
    const telemetry = await getVehicleTelemetry(vehicleId)
    checks.push({
      name: 'Final Telemetry Recorded',
      passed: telemetry !== null,
      reason: telemetry ? undefined : 'Failed to capture final telemetry',
    })
  }

  const allPassed = checks.every(c => c.passed)

  return { passed: allPassed, checks }
}

/**
 * Prepare vehicle for handover (preconditioning, etc.)
 */
export async function prepareVehicleForHandover(
  vehicleId: string,
  pickupTime: Date
): Promise<{ success: boolean; actions: string[] }> {
  const actions: string[] = []
  const vehicleStatus = await getVehicleSafetyStatus(vehicleId)

  // If Tesla and EV, precondition 30 minutes before pickup
  const now = new Date()
  const timeTillPickup = pickupTime.getTime() - now.getTime()
  const thirtyMinutes = 30 * 60 * 1000

  if (vehicleStatus.tesla.connected && vehicleStatus.isEv && timeTillPickup <= thirtyMinutes) {
    const result = await preconditionVehicle(vehicleId, true)
    if (result.success) {
      actions.push('Preconditioning started')
    }
  }

  // Verify battery level for EVs
  if (vehicleStatus.isEv && vehicleStatus.smartcar.telemetry?.batteryPercent) {
    const batteryPercent = vehicleStatus.smartcar.telemetry.batteryPercent
    if (batteryPercent < 50) {
      actions.push(`Warning: Battery at ${batteryPercent.toFixed(0)}% - consider charging before handover`)
    } else {
      actions.push(`Battery at ${batteryPercent.toFixed(0)}% - ready for handover`)
    }
  }

  return { success: true, actions }
}
