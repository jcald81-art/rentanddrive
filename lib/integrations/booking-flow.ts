/**
 * Complete Booking Flow Integration
 * Connects all services for end-to-end booking experience
 */

import { createClient } from '@/lib/supabase/server'
import { isServiceLive } from '@/lib/env-check'

interface BookingCreationParams {
  vehicleId: string
  renterId: string
  startDate: string
  endDate: string
  totalAmountCents: number
  insuranceTier?: 'basic' | 'standard' | 'premium'
  stripePaymentIntentId: string
}

interface BookingResult {
  success: boolean
  bookingId?: string
  iglooPin?: string
  error?: string
}

/**
 * Complete booking creation flow:
 * 1. Create booking record
 * 2. Trigger SecureLink confirmation (SMS + Email)
 * 3. Generate igloo PIN
 * 4. Schedule Cartegrity pre-inspection reminder
 * 5. Save insurance selection
 * 6. Register Eagle geofence
 */
export async function createCompleteBooking(params: BookingCreationParams): Promise<BookingResult> {
  const supabase = await createClient()
  
  try {
    // 1. Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        vehicle_id: params.vehicleId,
        renter_id: params.renterId,
        start_date: params.startDate,
        end_date: params.endDate,
        total_amount_cents: params.totalAmountCents,
        status: 'confirmed',
        stripe_payment_intent_id: params.stripePaymentIntentId,
      })
      .select()
      .single()
    
    if (bookingError) throw bookingError
    
    // Get vehicle and renter details for notifications
    const [vehicleRes, renterRes] = await Promise.all([
      supabase.from('vehicles').select('*, host:profiles(*)').eq('id', params.vehicleId).single(),
      supabase.from('profiles').select('*').eq('id', params.renterId).single()
    ])
    
    const vehicle = vehicleRes.data
    const renter = renterRes.data
    
    // 2. Trigger SecureLink confirmation
    if (isServiceLive('TWILIO') || isServiceLive('SENDGRID')) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'booking_confirmation',
          bookingId: booking.id,
          recipientPhone: renter?.phone,
          recipientEmail: renter?.email,
          vehicleName: `${vehicle?.year} ${vehicle?.make} ${vehicle?.model}`,
          startDate: params.startDate,
          endDate: params.endDate,
        })
      })
    }
    
    // 3. Generate igloo PIN
    let iglooPin: string | undefined
    if (vehicle?.lockbox_id) {
      const iglooResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/igloo/generate-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          lockboxId: vehicle.lockbox_id,
          startDate: params.startDate,
          endDate: params.endDate,
          renterName: renter?.full_name,
        })
      })
      const iglooData = await iglooResponse.json()
      iglooPin = iglooData.pin
      
      // Update booking with PIN
      await supabase
        .from('bookings')
        .update({ lockbox_pin: iglooPin })
        .eq('id', booking.id)
    }
    
    // 4. Schedule Cartegrity pre-inspection reminder (1 hour before pickup)
    const reminderTime = new Date(params.startDate)
    reminderTime.setHours(reminderTime.getHours() - 1)
    
    await supabase.from('notifications').insert({
      user_id: params.renterId,
      type: 'inspection_reminder',
      title: 'Pre-Rental Inspection Required',
      message: `Please complete your Cartegrity pre-rental inspection before driving. Open: ${process.env.NEXT_PUBLIC_APP_URL}/inspect/${booking.id}`,
      scheduled_for: reminderTime.toISOString(),
      metadata: { booking_id: booking.id, inspection_type: 'pre' }
    })
    
    // 5. Save insurance selection
    if (params.insuranceTier) {
      await supabase.from('insurance_policies').insert({
        booking_id: booking.id,
        vehicle_id: params.vehicleId,
        coverage_type: params.insuranceTier,
        status: 'active',
        start_date: params.startDate,
        end_date: params.endDate,
      })
    }
    
    // 6. Register Eagle geofence (will activate when booking starts)
    if (vehicle?.bouncie_imei && isServiceLive('BOUNCIE')) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/eagle/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_geofence',
          bookingId: booking.id,
          vehicleId: params.vehicleId,
          imei: vehicle.bouncie_imei,
          centerLat: vehicle.pickup_lat || 39.5296,
          centerLng: vehicle.pickup_lng || -119.8138,
          radiusMiles: 15,
        })
      })
    }
    
    return {
      success: true,
      bookingId: booking.id,
      iglooPin,
    }
    
  } catch (error) {
    console.error('[BookingFlow] Error creating booking:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Handle booking status transitions
 */
export async function transitionBookingStatus(
  bookingId: string, 
  newStatus: 'active' | 'completed' | 'cancelled'
): Promise<void> {
  const supabase = await createClient()
  
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, vehicle:vehicles(*), renter:profiles(*)')
    .eq('id', bookingId)
    .single()
  
  if (!booking) return
  
  // Update status
  await supabase
    .from('bookings')
    .update({ status: newStatus })
    .eq('id', bookingId)
  
  if (newStatus === 'active') {
    // Booking starting - Eagle activates geofence, Pulse begins monitoring
    console.log(`[BookingFlow] Booking ${bookingId} now active - Eagle monitoring started`)
    
  } else if (newStatus === 'completed') {
    // Booking ended
    // 1. Send post-inspection request
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'inspection_request',
        type: 'post',
        bookingId,
        recipientPhone: booking.renter?.phone,
        recipientEmail: booking.renter?.email,
      })
    })
    
    // 2. Remove Eagle geofence
    if (booking.vehicle?.bouncie_imei) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/eagle/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_geofence',
          bookingId,
        })
      })
    }
    
    // 3. Run Pulse post-trip health check
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/pulse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'post_trip_check',
        vehicleId: booking.vehicle_id,
        bookingId,
      })
    })
    
    // 4. Revoke igloo access
    if (booking.lockbox_pin) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/igloo/revoke-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      })
    }
  }
}
