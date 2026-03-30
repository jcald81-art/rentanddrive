/**
 * Cartegrity Inspection Integration
 * Pre and post-trip vehicle inspections with AI damage detection
 */

import { createClient } from '@/lib/supabase/server'

interface InspectionPhoto {
  url: string
  angle: string
  timestamp: string
}

interface DamageDetection {
  found: boolean
  severity?: 'minor' | 'moderate' | 'severe'
  description?: string
  location?: string
  confidence?: number
}

/**
 * Create a new inspection for a booking
 */
export async function createInspection(
  bookingId: string,
  type: 'pre' | 'post',
  renterId: string
): Promise<{ inspectionId: string }> {
  const supabase = await createClient()
  
  const { data: inspection, error } = await supabase
    .from('inspections')
    .insert({
      booking_id: bookingId,
      type,
      inspector_id: renterId,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()
  
  if (error) throw error
  
  return { inspectionId: inspection.id }
}

/**
 * Add photo to inspection and analyze for damage
 */
export async function addInspectionPhoto(
  inspectionId: string,
  photoUrl: string,
  angle: string
): Promise<DamageDetection> {
  const supabase = await createClient()
  
  // Analyze photo for damage using AI
  const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/inspections/analyze-photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoUrl, angle })
  })
  const analysis = await analysisResponse.json()
  
  // Save photo with analysis
  await supabase.from('inspection_photos').insert({
    inspection_id: inspectionId,
    photo_url: photoUrl,
    angle,
    damage_detected: analysis.damageFound,
    damage_severity: analysis.severity,
    damage_description: analysis.description,
    ai_confidence: analysis.confidence,
  })
  
  return {
    found: analysis.damageFound,
    severity: analysis.severity,
    description: analysis.description,
    location: angle,
    confidence: analysis.confidence,
  }
}

/**
 * Complete inspection and compare with pre-rental if post-trip
 */
export async function completeInspection(
  inspectionId: string,
  signature: string,
  notes?: string
): Promise<{ newDamageFound: boolean; damages?: any[] }> {
  const supabase = await createClient()
  
  // Get inspection details
  const { data: inspection } = await supabase
    .from('inspections')
    .select('*, booking:bookings(*, vehicle:vehicles(*), renter:profiles(*))')
    .eq('id', inspectionId)
    .single()
  
  if (!inspection) throw new Error('Inspection not found')
  
  // Update inspection as complete
  await supabase
    .from('inspections')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      signature_url: signature,
      notes,
    })
    .eq('id', inspectionId)
  
  // If post-trip, compare with pre-trip inspection
  if (inspection.type === 'post') {
    const compareResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/inspections/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: inspection.booking_id })
    })
    const comparison = await compareResponse.json()
    
    if (comparison.newDamageFound) {
      // Flag booking as disputed
      await supabase
        .from('bookings')
        .update({ 
          has_damage_claim: true,
          damage_status: 'pending_review'
        })
        .eq('id', inspection.booking_id)
      
      // Create dispute record
      await supabase.from('disputes').insert({
        booking_id: inspection.booking_id,
        type: 'damage',
        status: 'pending',
        description: `New damage detected: ${comparison.damages.map((d: any) => d.description).join(', ')}`,
        evidence_urls: comparison.damages.map((d: any) => d.photoUrl),
      })
      
      // Alert admin and host via SecureLink
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'damage_detected',
          bookingId: inspection.booking_id,
          vehicleName: `${inspection.booking.vehicle.year} ${inspection.booking.vehicle.make} ${inspection.booking.vehicle.model}`,
          hostPhone: inspection.booking.vehicle.host?.phone,
          damages: comparison.damages,
        })
      })
      
      // Have Shield draft dispute response
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/shield`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'draft_dispute_response',
          bookingId: inspection.booking_id,
          damages: comparison.damages,
        })
      })
      
      return { newDamageFound: true, damages: comparison.damages }
    }
  }
  
  return { newDamageFound: false }
}

/**
 * Send inspection reminder
 */
export async function sendInspectionReminder(
  bookingId: string,
  type: 'pre' | 'post'
): Promise<void> {
  const supabase = await createClient()
  
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, renter:profiles(*), vehicle:vehicles(*)')
    .eq('id', bookingId)
    .single()
  
  if (!booking) return
  
  const message = type === 'pre'
    ? `Please complete your Cartegrity pre-rental inspection before driving. Open: ${process.env.NEXT_PUBLIC_APP_URL}/inspect/${bookingId}`
    : `Please complete your Cartegrity return inspection. Open: ${process.env.NEXT_PUBLIC_APP_URL}/inspect/${bookingId}?type=post`
  
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'send_sms',
      recipientPhone: booking.renter?.phone,
      message,
    })
  })
}
