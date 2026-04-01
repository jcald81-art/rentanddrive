'use server'

import { createClient } from '@/lib/supabase/server'
import { dispatchRide, getRideEstimate } from '@/integrations/lyft-concierge'
import { getDeliveryQuote, createDelivery } from '@/integrations/uber-direct'
import type { DeliveryLocationType } from './DeliveryOptionSelector'

// Location coordinate lookup for preset RAD delivery zones
const LOCATION_COORDS: Record<DeliveryLocationType, { lat: number; lng: number; address: string } | null> = {
  airport_rno: { lat: 39.4991, lng: -119.7681, address: 'Reno-Tahoe International Airport, Reno, NV 89502' },
  downtown_reno: { lat: 39.5296, lng: -119.8138, address: '1 S. Center St, Reno, NV 89501' },
  lake_tahoe: { lat: 39.0968, lng: -120.0324, address: 'Lake Tahoe, CA/NV' },
  sparks: { lat: 39.5349, lng: -119.7527, address: 'Victorian Square, Sparks, NV 89431' },
  hotel: null,
  home: null,
  custom: null,
}

export interface ScheduleDeliveryInput {
  bookingId: string
  vehicleId: string
  direction: 'to_renter' | 'from_renter'
  locationType: DeliveryLocationType
  customAddress?: string
  scheduledAt: string
}

export async function getDeliveryEstimate(input: {
  locationType: DeliveryLocationType
  customAddress?: string
  vehicleAddress: string
  vehicleLat: number
  vehicleLng: number
}) {
  const destinationCoords = LOCATION_COORDS[input.locationType]

  if (!destinationCoords && !input.customAddress) {
    return { error: 'Address required for this location type' }
  }

  try {
    const estimate = await getRideEstimate({
      origin: {
        lat: input.vehicleLat,
        lng: input.vehicleLng,
        address: input.vehicleAddress,
      },
      destination: destinationCoords ?? {
        lat: 39.5296,
        lng: -119.8138,
        address: input.customAddress!,
      },
    })

    return {
      estimatedFee: estimate.estimatedCost,
      currency: estimate.currency,
      etaMinutes: estimate.etaMinutes,
      provider: 'lyft' as const,
    }
  } catch {
    return {
      estimatedFee: 2000,
      currency: 'USD',
      etaMinutes: 30,
      provider: 'lyft' as const,
    }
  }
}

export async function scheduleDelivery(input: ScheduleDeliveryInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Get booking + vehicle + renter profile
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      id,
      renter_id,
      vehicle:vehicles (
        id,
        make,
        model,
        year,
        location_address,
        location_lat,
        location_lng
      ),
      renter:profiles!bookings_renter_id_fkey (
        full_name,
        phone,
        email
      )
    `)
    .eq('id', input.bookingId)
    .single()

  if (bookingError || !booking) return { error: 'Booking not found' }

  const vehicle = booking.vehicle as {
    id: string; make: string; model: string; year: number;
    location_address: string; location_lat: number; location_lng: number
  } | null
  const renter = booking.renter as { full_name: string; phone: string; email: string } | null

  if (!vehicle) return { error: 'Vehicle not found' }
  if (!renter?.phone) return { error: 'Renter phone number required' }

  // Resolve destination
  const presetCoords = LOCATION_COORDS[input.locationType]
  const dropoffAddress = presetCoords?.address ?? input.customAddress ?? 'Reno, NV'
  const dropoffLat = presetCoords?.lat ?? 39.5296
  const dropoffLng = presetCoords?.lng ?? -119.8138

  // Determine origin/destination based on direction
  const pickupAddress = input.direction === 'to_renter' ? vehicle.location_address : dropoffAddress
  const pickupLat = input.direction === 'to_renter' ? vehicle.location_lat : dropoffLat
  const pickupLng = input.direction === 'to_renter' ? vehicle.location_lng : dropoffLng

  const finalDropoffAddress = input.direction === 'to_renter' ? dropoffAddress : vehicle.location_address
  const finalDropoffLat = input.direction === 'to_renter' ? dropoffLat : vehicle.location_lat
  const finalDropoffLng = input.direction === 'to_renter' ? dropoffLng : vehicle.location_lng

  // Create delivery record first
  const { data: delivery, error: deliveryError } = await supabase
    .from('deliveries')
    .insert({
      booking_id: input.bookingId,
      vehicle_id: input.vehicleId,
      renter_id: user.id,
      direction: input.direction,
      provider: 'lyft',
      status: 'requested',
      pickup_address: pickupAddress,
      pickup_lat: pickupLat,
      pickup_lng: pickupLng,
      dropoff_address: finalDropoffAddress,
      dropoff_lat: finalDropoffLat,
      dropoff_lng: finalDropoffLng,
      location_type: input.locationType,
      scheduled_at: new Date(input.scheduledAt).toISOString(),
    })
    .select()
    .single()

  if (deliveryError || !delivery) {
    console.error('[Delivery] Failed to create delivery record:', deliveryError)
    return { error: 'Failed to create delivery record' }
  }

  // Try to dispatch via Lyft Concierge
  try {
    const nameParts = (renter.full_name ?? 'RAD Renter').split(' ')
    const ride = await dispatchRide({
      bookingId: input.bookingId,
      passenger: {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || 'Renter',
        phoneNumber: renter.phone,
      },
      origin: { lat: pickupLat, lng: pickupLng, address: pickupAddress },
      destination: { lat: finalDropoffLat, lng: finalDropoffLng, address: finalDropoffAddress },
      scheduledAt: new Date(input.scheduledAt),
    })

    // Update delivery record with ride info
    await supabase
      .from('deliveries')
      .update({
        external_ride_id: ride.rideId,
        status: 'confirmed',
        provider: 'lyft',
        eta_minutes: ride.etaSeconds ? Math.round(ride.etaSeconds / 60) : null,
      })
      .eq('id', delivery.id)

    // Log status change
    await supabase.from('delivery_status_log').insert({
      delivery_id: delivery.id,
      status: 'confirmed',
      previous_status: 'requested',
      notes: `Dispatched via Lyft Concierge — Ride ID: ${ride.rideId}`,
    })

    return {
      success: true,
      deliveryId: delivery.id,
      provider: 'lyft',
      etaMinutes: ride.etaSeconds ? Math.round(ride.etaSeconds / 60) : 30,
    }
  } catch (lyftError) {
    console.error('[Delivery] Lyft failed, trying Uber Direct:', lyftError)

    // Fallback to Uber Direct
    try {
      const uberDelivery = await createDelivery({
        quoteId: '',
        bookingId: input.bookingId,
        manifest: `${vehicle.year} ${vehicle.make} ${vehicle.model} keys`,
        pickup: {
          name: 'RAD Fleet',
          address: pickupAddress,
          city: 'Reno',
          state: 'NV',
          zip: '89501',
          country: 'US',
          lat: pickupLat,
          lng: pickupLng,
        },
        dropoff: {
          name: renter.full_name,
          address: finalDropoffAddress,
          city: 'Reno',
          state: 'NV',
          zip: '89501',
          country: 'US',
          lat: finalDropoffLat,
          lng: finalDropoffLng,
          phone: renter.phone,
        },
      })

      await supabase
        .from('deliveries')
        .update({
          external_ride_id: uberDelivery.id,
          status: 'confirmed',
          provider: 'uber_direct',
          tracking_url: uberDelivery.trackingUrl,
          fee_cents: uberDelivery.fee,
        })
        .eq('id', delivery.id)

      return {
        success: true,
        deliveryId: delivery.id,
        provider: 'uber_direct',
        trackingUrl: uberDelivery.trackingUrl,
        etaMinutes: 35,
      }
    } catch (uberError) {
      console.error('[Delivery] Both providers failed:', uberError)

      await supabase
        .from('deliveries')
        .update({ status: 'failed' })
        .eq('id', delivery.id)

      return { error: 'Both delivery providers failed. Please contact support.' }
    }
  }
}
