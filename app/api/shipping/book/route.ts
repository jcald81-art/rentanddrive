import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripeServer } from '@/lib/stripe'
import { SecureLink } from '@/lib/agents/securelink'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { shipment_id, payment_method_id } = body

    if (!shipment_id) {
      return NextResponse.json({ error: 'Missing shipment_id' }, { status: 400 })
    }

    // Get shipment with full details
    const { data: shipment, error: shipmentError } = await supabase
      .from('vehicle_shipments')
      .select(`
        *,
        listing:vehicle_listings(
          *,
          vehicle:vehicles(
            id, make, model, year, license_plate,
            device:vehicle_devices(imei)
          )
        ),
        buyer:profiles!vehicle_shipments_buyer_id_fkey(id, full_name, email, phone),
        seller:profiles!vehicle_shipments_seller_id_fkey(id, full_name, email, phone)
      `)
      .eq('id', shipment_id)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    if (shipment.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (shipment.status !== 'quoted') {
      return NextResponse.json({ error: 'Shipment already booked' }, { status: 400 })
    }

    // Process Stripe payment
    let paymentIntent = null
    if (stripe && payment_method_id) {
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: shipment.quote_cents,
          currency: 'usd',
          payment_method: payment_method_id,
          confirm: true,
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never'
          },
          metadata: {
            shipment_id,
            type: 'vehicle_shipping',
            carrier: shipment.carrier_name
          }
        })

        if (paymentIntent.status !== 'succeeded') {
          return NextResponse.json(
            { error: 'Payment failed', status: paymentIntent.status },
            { status: 400 }
          )
        }
      } catch (stripeError: unknown) {
        const err = stripeError as { message?: string }
        return NextResponse.json(
          { error: 'Payment error', details: err.message },
          { status: 400 }
        )
      }
    }

    // Generate tracking number
    const trackingNumber = `RD-SHIP-${Date.now().toString(36).toUpperCase()}`

    // Update shipment to booked
    const { data: updatedShipment, error: updateError } = await supabase
      .from('vehicle_shipments')
      .update({
        status: 'booked',
        tracking_number: trackingNumber,
        stripe_payment_intent_id: paymentIntent?.id,
        eagle_monitoring_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', shipment_id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update shipment:', updateError)
      return NextResponse.json({ error: 'Failed to book shipment' }, { status: 500 })
    }

    // Activate Eagle transport monitoring mode
    // Pulse will check telemetry every 15 minutes during transport
    if (shipment.listing?.vehicle?.device?.imei) {
      await supabase
        .from('vehicle_devices')
        .update({
          transport_mode: true,
          transport_check_interval_minutes: 15
        })
        .eq('imei', shipment.listing.vehicle.device.imei)
    }

    // Send SecureLink notifications to buyer and seller
    const secureLink = new SecureLink()
    const vehicle = shipment.listing?.vehicle
    const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'your vehicle'

    // Notify buyer
    if (shipment.buyer?.phone) {
      await secureLink.sendSMS({
        to: shipment.buyer.phone,
        message: `Your ${vehicleName} shipment is confirmed! Carrier: ${shipment.carrier_name}. Tracking: ${trackingNumber}. Estimated delivery: ${shipment.estimated_delivery}. Track at rentanddrive.net/renter/my-trips/shipment/${shipment_id}`
      })
    }

    if (shipment.buyer?.email) {
      await secureLink.sendEmail({
        to: shipment.buyer.email,
        subject: `Shipment Confirmed - ${vehicleName}`,
        template: 'shipment_confirmed',
        data: {
          vehicleName,
          carrierName: shipment.carrier_name,
          trackingNumber,
          estimatedDelivery: shipment.estimated_delivery,
          trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/renter/my-trips/shipment/${shipment_id}`,
          origin: shipment.origin_address,
          destination: shipment.destination_address
        }
      })
    }

    // Notify seller
    if (shipment.seller?.phone) {
      await secureLink.sendSMS({
        to: shipment.seller.phone,
        message: `Your ${vehicleName} shipment to buyer is booked! ${shipment.carrier_name} will contact you to schedule pickup. Tracking: ${trackingNumber}`
      })
    }

    // Schedule daily 9am location updates to buyer during transit
    await supabase.from('scheduled_notifications').insert({
      user_id: shipment.buyer_id,
      notification_type: 'shipment_location_update',
      schedule_cron: '0 9 * * *', // 9am daily
      metadata: {
        shipment_id,
        tracking_number: trackingNumber,
        vehicle_name: vehicleName
      },
      active_until: new Date(shipment.estimated_delivery).toISOString()
    })

    // Log platform event
    await supabase.from('platform_events').insert({
      event_type: 'shipment_booked',
      event_data: {
        shipment_id,
        carrier: shipment.carrier_name,
        amount_cents: shipment.quote_cents,
        platform_margin_cents: shipment.platform_margin_cents,
        buyer_id: shipment.buyer_id,
        seller_id: shipment.seller_id
      }
    })

    return NextResponse.json({
      success: true,
      shipment: updatedShipment,
      tracking_number: trackingNumber,
      tracking_url: `/renter/my-trips/shipment/${shipment_id}`,
      estimated_delivery: shipment.estimated_delivery
    })

  } catch (error) {
    console.error('Shipping booking error:', error)
    return NextResponse.json(
      { error: 'Failed to book shipment' },
      { status: 500 }
    )
  }
}

// GET endpoint to check shipment status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const shipmentId = searchParams.get('id')

  if (!shipmentId) {
    return NextResponse.json({ error: 'Missing shipment id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: shipment, error } = await supabase
    .from('vehicle_shipments')
    .select(`
      *,
      listing:vehicle_listings(
        *,
        vehicle:vehicles(id, make, model, year, images)
      )
    `)
    .eq('id', shipmentId)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single()

  if (error || !shipment) {
    return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
  }

  return NextResponse.json({ shipment })
}
