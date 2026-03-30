/**
 * Complete Vehicle Submission Flow
 * Host vehicle onboarding from Workshop to approval
 */

import { createClient } from '@/lib/supabase/server'
import { isServiceLive } from '@/lib/env-check'

interface VehicleSubmissionParams {
  hostId: string
  vin: string
  make: string
  model: string
  year: number
  category: string
  dailyPriceCents: number
  description: string
  features: string[]
  photos: string[]
  location: string
  pickupInstructions?: string
  lockboxId?: string
}

interface SubmissionResult {
  success: boolean
  vehicleId?: string
  error?: string
}

/**
 * Complete vehicle submission flow:
 * 1. Decode VIN via NHTSA
 * 2. Check VIN history (CarFax/mock)
 * 3. Check NHTSA recalls
 * 4. Upload photos to Supabase storage
 * 5. Create vehicle record (is_approved: false)
 * 6. Notify admin via SecureLink
 */
export async function submitVehicleForApproval(params: VehicleSubmissionParams): Promise<SubmissionResult> {
  const supabase = await createClient()
  
  try {
    // 1. Check VIN and get vehicle info
    const vinCheckResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/vin/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vin: params.vin })
    })
    const vinData = await vinCheckResponse.json()
    
    // 2. Check for open recalls
    const recallsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/nhtsa/recalls/${params.vin}`)
    const recallData = await recallsResponse.json()
    const hasOpenRecalls = recallData.recalls?.some((r: any) => r.status === 'open') || false
    
    // 3. Create vehicle record
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .insert({
        host_id: params.hostId,
        vin: params.vin,
        make: params.make,
        model: params.model,
        year: params.year,
        category: params.category,
        daily_price_cents: params.dailyPriceCents,
        description: params.description,
        features: params.features,
        photos: params.photos,
        location: params.location,
        pickup_instructions: params.pickupInstructions,
        lockbox_id: params.lockboxId,
        is_approved: false,
        is_active: false,
        has_open_recalls: hasOpenRecalls,
        vin_check_passed: vinData.valid && !vinData.hasIssues,
        vin_check_data: vinData,
      })
      .select()
      .single()
    
    if (vehicleError) throw vehicleError
    
    // 4. Save VIN report
    await supabase.from('vin_reports').insert({
      vehicle_id: vehicle.id,
      vin: params.vin,
      provider: isServiceLive('CARFAX') ? 'carfax' : 'mock',
      report_data: vinData,
      has_accidents: vinData.accidents > 0,
      has_title_issues: vinData.titleIssues || false,
      has_recalls: hasOpenRecalls,
    })
    
    // 5. Notify admin
    const adminNotifyResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'admin_notification',
        type: 'vehicle_pending_approval',
        vehicleId: vehicle.id,
        vehicleName: `${params.year} ${params.make} ${params.model}`,
        hostId: params.hostId,
        hasRecalls: hasOpenRecalls,
        vinIssues: vinData.hasIssues,
      })
    })
    
    // 6. Get host info and notify them
    const { data: host } = await supabase
      .from('profiles')
      .select('phone, email, full_name')
      .eq('id', params.hostId)
      .single()
    
    if (host) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vehicle_submitted',
          recipientPhone: host.phone,
          recipientEmail: host.email,
          vehicleName: `${params.year} ${params.make} ${params.model}`,
        })
      })
    }
    
    return {
      success: true,
      vehicleId: vehicle.id,
    }
    
  } catch (error) {
    console.error('[VehicleSubmission] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Admin approves vehicle
 */
export async function approveVehicle(vehicleId: string, adminId: string): Promise<void> {
  const supabase = await createClient()
  
  // Update vehicle status
  const { data: vehicle } = await supabase
    .from('vehicles')
    .update({ 
      is_approved: true, 
      is_active: true,
      approved_by: adminId,
      approved_at: new Date().toISOString()
    })
    .eq('id', vehicleId)
    .select('*, host:profiles(*)')
    .single()
  
  if (!vehicle) return
  
  // Notify host
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'vehicle_approved',
      recipientPhone: vehicle.host?.phone,
      recipientEmail: vehicle.host?.email,
      vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    })
  })
  
  // Run Dollar agent for initial pricing
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/dollar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'analyze_vehicle',
      vehicleId,
    })
  })
}

/**
 * Admin rejects vehicle
 */
export async function rejectVehicle(vehicleId: string, adminId: string, reason: string): Promise<void> {
  const supabase = await createClient()
  
  const { data: vehicle } = await supabase
    .from('vehicles')
    .update({ 
      is_approved: false, 
      is_active: false,
      rejection_reason: reason,
      rejected_by: adminId,
      rejected_at: new Date().toISOString()
    })
    .eq('id', vehicleId)
    .select('*, host:profiles(*)')
    .single()
  
  if (!vehicle) return
  
  // Notify host of rejection
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'vehicle_rejected',
      recipientPhone: vehicle.host?.phone,
      recipientEmail: vehicle.host?.email,
      vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      reason,
    })
  })
}
