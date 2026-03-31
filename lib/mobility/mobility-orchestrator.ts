import { createClient } from '@supabase/supabase-js'
import { createDelivery, getDeliveryQuote } from './uber-direct'
import { bookConciergeRide, getRideEstimate } from './lyft-concierge'
import { geocodeAddress } from './geocoder'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type MobilityType = 
  | 'lyft_to_vehicle'
  | 'vehicle_delivery'
  | 'lyft_return_ride'
  | 'vehicle_reposition'

// ─── MAIN ORCHESTRATOR ───────────────────────────────────────

// Called after booking confirmed
export async function handleBookingConfirmed(bookingId: string) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, vehicles(*), profiles!renter_id(*)')
    .eq('id', bookingId)
    .single()

  if (!booking) throw new Error('Booking not found')

  const mobilityOptions: MobilityType[] = booking.mobility_options || []

  // Book Lyft to vehicle — schedule for 30 min before pickup
  if (mobilityOptions.includes('lyft_to_vehicle')) {
    const scheduledTime = new Date(booking.start_datetime)
    scheduledTime.setMinutes(scheduledTime.getMinutes() - 30)

    await dispatchLyftToVehicle({
      booking,
      scheduledAt: scheduledTime.toISOString(),
    })
  }
}

// Called when RAD Fleet Command confirms trip started
export async function handleTripStarted(bookingId: string) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, vehicles(*), profiles!renter_id(*)')
    .eq('id', bookingId)
    .single()

  if (!booking) return

  const mobilityOptions: MobilityType[] = booking.mobility_options || []

  if (mobilityOptions.includes('vehicle_delivery')) {
    await dispatchUberDelivery({ booking })
  }
}

// Called when RAD Fleet Command confirms trip ended
export async function handleTripEnded(bookingId: string) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, vehicles(*), profiles!renter_id(*)')
    .eq('id', bookingId)
    .single()

  if (!booking) return

  const mobilityOptions: MobilityType[] = booking.mobility_options || []

  if (mobilityOptions.includes('lyft_return_ride')) {
    await dispatchLyftReturnRide({ booking })
  }
}

// ─── DISPATCHERS ─────────────────────────────────────────────

async function dispatchLyftToVehicle({
  booking,
  scheduledAt,
}: {
  booking: Record<string, unknown>
  scheduledAt?: string
}) {
  const renter = booking.profiles as Record<string, unknown>
  const vehicle = booking.vehicles as Record<string, unknown>

  const pickupGeo = await geocodeAddress(
    (booking.renter_pickup_address as string) || (renter.location as string) || 'Reno, NV'
  )
  const dropoffGeo = await geocodeAddress(vehicle.location as string)

  const nameParts = `${renter.first_name} ${renter.last_name || ''}`.trim().split(' ')

  const ride = await bookConciergeRide({
    passenger_first_name: nameParts[0],
    passenger_last_name: nameParts[1] || '',
    passenger_phone: renter.phone as string,
    pickup_lat: pickupGeo.lat,
    pickup_lng: pickupGeo.lng,
    pickup_address: pickupGeo.formatted_address,
    dropoff_lat: dropoffGeo.lat,
    dropoff_lng: dropoffGeo.lng,
    dropoff_address: dropoffGeo.formatted_address,
    scheduled_at: scheduledAt,
    booking_id: booking.id as string,
  })

  await saveMobilityRequest({
    booking_id: booking.id as string,
    type: 'lyft_to_vehicle',
    provider: 'lyft_concierge',
    external_id: ride.ride_id,
    status: ride.status,
    fee: (ride.price_quote?.estimated_cost_cents_max || 0) / 100,
  })

  // Notify renter via Beacon
  await notifyRenter(booking.id as string, {
    type: 'lyft_booked',
    message: `Your complimentary Lyft to your RAD vehicle has been booked. ` +
      `${scheduledAt 
        ? `It will arrive at ${new Date(scheduledAt).toLocaleTimeString()}.`
        : 'Your driver is on the way.'}`
  })
}

async function dispatchUberDelivery({ booking }: { booking: Record<string, unknown> }) {
  const renter = booking.profiles as Record<string, unknown>
  const vehicle = booking.vehicles as Record<string, unknown>

  // Get price quote first
  const quote = await getDeliveryQuote(
    vehicle.location as string,
    booking.delivery_address as string
  )

  const delivery = await createDelivery({
    quote_id: quote.id,
    pickup_address: vehicle.location as string,
    pickup_name: 'RAD Fleet',
    pickup_phone: process.env.FLEET_OWNER_PHONE!,
    pickup_notes: `${vehicle.year} ${vehicle.make} ${vehicle.model} — ` +
      `${vehicle.color}. ` +
      `Keys are in the igloohome Keybox. ` +
      `Keybox code: ${booking.pickup_pin}. ` +
      `Vehicle has RAD Fleet GPS tracker installed.`,
    dropoff_address: booking.delivery_address as string,
    dropoff_name: `${renter.first_name} ${renter.last_name || ''}`,
    dropoff_phone: renter.phone as string,
    dropoff_notes: 'Deliver keys directly to the renter. ' +
      'They will need the keys to access the vehicle.',
    booking_id: booking.id as string,
    vehicle_name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
  })

  await saveMobilityRequest({
    booking_id: booking.id as string,
    type: 'vehicle_delivery',
    provider: 'uber_direct',
    external_id: delivery.id,
    status: delivery.status,
    tracking_url: delivery.tracking_url,
    fee: delivery.fee?.total_fee,
  })

  // Notify renter with tracking link
  await notifyRenter(booking.id as string, {
    type: 'delivery_dispatched',
    message: `Your ${vehicle.year} ${vehicle.make} ${vehicle.model} is on its way. ` +
      `Track your delivery: ${delivery.tracking_url}. ` +
      `Estimated arrival: ${new Date(delivery.dropoff.eta).toLocaleTimeString()}.`
  })
}

async function dispatchLyftReturnRide({ booking }: { booking: Record<string, unknown> }) {
  const renter = booking.profiles as Record<string, unknown>
  const vehicle = booking.vehicles as Record<string, unknown>

  const pickupGeo = await geocodeAddress(vehicle.location as string)
  const dropoffGeo = await geocodeAddress(
    (booking.renter_home_address as string) || 
    (booking.renter_pickup_address as string) || 
    (renter.location as string) || 
    'Reno, NV'
  )

  const nameParts = `${renter.first_name} ${renter.last_name || ''}`.trim().split(' ')

  const ride = await bookConciergeRide({
    passenger_first_name: nameParts[0],
    passenger_last_name: nameParts[1] || '',
    passenger_phone: renter.phone as string,
    pickup_lat: pickupGeo.lat,
    pickup_lng: pickupGeo.lng,
    pickup_address: pickupGeo.formatted_address,
    dropoff_lat: dropoffGeo.lat,
    dropoff_lng: dropoffGeo.lng,
    dropoff_address: dropoffGeo.formatted_address,
    booking_id: booking.id as string,
  })

  await saveMobilityRequest({
    booking_id: booking.id as string,
    type: 'lyft_return_ride',
    provider: 'lyft_concierge',
    external_id: ride.ride_id,
    status: ride.status,
    fee: (ride.price_quote?.estimated_cost_cents_max || 0) / 100,
  })

  await notifyRenter(booking.id as string, {
    type: 'return_ride_booked',
    message: `Trip complete. Your complimentary Lyft home has been booked. ` +
      `Your driver is on the way to the vehicle location.`
  })
}

// ─── HELPERS ─────────────────────────────────────────────────

async function saveMobilityRequest(data: {
  booking_id: string
  type: MobilityType
  provider: string
  external_id: string
  status: string
  fee?: number
  tracking_url?: string
}) {
  await supabase.from('mobility_requests').insert({
    ...data,
    created_at: new Date().toISOString(),
  })
}

async function notifyRenter(
  bookingId: string,
  notification: { type: string; message: string }
) {
  // Send notification via Beacon agent
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'communications',
        message: notification.message,
        context: { booking_id: bookingId, notification_type: notification.type },
      }),
    })
  } catch (error) {
    console.error('Failed to send notification:', error)
  }
}

// Get RAD mobility cost estimate for booking
export async function getMobilityCostEstimate(
  vehicleLocation: string,
  renterLocation: string,
  deliveryAddress?: string
): Promise<{
  lyft_to_vehicle: number | null
  vehicle_delivery: number | null
  lyft_return: number | null
}> {
  const results = {
    lyft_to_vehicle: null as number | null,
    vehicle_delivery: null as number | null,
    lyft_return: null as number | null,
  }

  try {
    const [vehicleGeo, renterGeo] = await Promise.all([
      geocodeAddress(vehicleLocation),
      geocodeAddress(renterLocation),
    ])

    // Get Lyft estimate
    const lyftEstimates = await getRideEstimate(
      renterGeo.lat, 
      renterGeo.lng, 
      vehicleGeo.lat, 
      vehicleGeo.lng
    )

    const lyft = lyftEstimates[0]
    if (lyft) {
      results.lyft_to_vehicle = lyft.estimated_cost_cents_max / 100
      results.lyft_return = lyft.estimated_cost_cents_max / 100
    }

    // Get Uber Direct quote for vehicle delivery
    if (deliveryAddress) {
      try {
        const quote = await getDeliveryQuote(vehicleLocation, deliveryAddress)
        results.vehicle_delivery = quote.fee / 100
      } catch (e) {
        console.error('Uber quote error:', e)
      }
    }
  } catch (e) {
    console.error('Mobility estimate error:', e)
  }

  return results
}
