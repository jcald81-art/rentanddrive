import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

interface CheckoutRequest {
  vehicle_id: string
  start_date: string
  end_date: string
  rental_subtotal: number
  service_fee: number
  protection_plan: {
    name: string
    daily_rate: number
    total: number
    deductible: number
  }
  tax: number
  total: number
  days: number
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', redirect: '/auth/signin' },
        { status: 401 }
      )
    }

    const body: CheckoutRequest = await request.json()
    const {
      vehicle_id,
      start_date,
      end_date,
      rental_subtotal,
      service_fee,
      protection_plan,
      tax,
      total,
      days,
    } = body

    // Validate required fields
    if (!vehicle_id || !start_date || !end_date || !total) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Fetch vehicle details
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*, profiles!vehicles_host_id_fkey(id, full_name, stripe_account_id)')
      .eq('id', vehicle_id)
      .eq('is_active', true)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      )
    }

    // Check availability
    const { data: conflicts } = await supabase
      .from('vehicle_unavailability')
      .select('id')
      .eq('vehicle_id', vehicle_id)
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`)

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Vehicle is not available for selected dates' },
        { status: 409 }
      )
    }

    // Get renter profile
    const { data: renterProfile } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', user.id)
      .single()

    // Create pending booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        vehicle_id,
        renter_id: user.id,
        host_id: vehicle.host_id,
        start_date,
        end_date,
        total_days: days,
        daily_rate: vehicle.daily_rate,
        rental_subtotal,
        service_fee,
        protection_plan_name: protection_plan.name,
        protection_plan_daily_rate: protection_plan.daily_rate,
        protection_plan_total: protection_plan.total,
        protection_deductible: protection_plan.deductible,
        tax_amount: tax,
        total_amount: total,
        status: 'pending_payment',
        payment_status: 'pending',
      })
      .select()
      .single()

    if (bookingError || !booking) {
      console.error('[create-checkout] Booking creation failed:', bookingError)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    // Calculate host payout (90% of rental subtotal)
    const hostPayout = Math.round(rental_subtotal * 0.90)

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email || renterProfile?.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
              description: `${days}-day rental (${new Date(start_date).toLocaleDateString()} - ${new Date(end_date).toLocaleDateString()})`,
              images: vehicle.photos?.slice(0, 1) || [],
            },
            unit_amount: Math.round(rental_subtotal * 100),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'RAD Service Fee',
              description: '10% platform fee (vs 25-35% on other platforms)',
            },
            unit_amount: Math.round(service_fee * 100),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${protection_plan.name} Protection`,
              description: `$${protection_plan.deductible.toLocaleString()} deductible • $${protection_plan.daily_rate}/day`,
            },
            unit_amount: Math.round(protection_plan.total * 100),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Tax',
              description: 'Nevada Sales Tax (8.25%)',
            },
            unit_amount: Math.round(tax * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id: booking.id,
        vehicle_id,
        renter_id: user.id,
        host_id: vehicle.host_id,
      },
      payment_intent_data: {
        metadata: {
          booking_id: booking.id,
          vehicle_id,
        },
        // Transfer to host's connected account if they have one
        ...(vehicle.profiles?.stripe_account_id && {
          transfer_data: {
            destination: vehicle.profiles.stripe_account_id,
            amount: hostPayout * 100,
          },
        }),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/confirmation?booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/details?vehicle_id=${vehicle_id}&start=${start_date}&end=${end_date}&cancelled=true`,
    })

    // Update booking with checkout session ID
    await supabase
      .from('bookings')
      .update({ checkout_session_id: session.id })
      .eq('id', booking.id)

    return NextResponse.json({
      checkout_url: session.url,
      booking_id: booking.id,
      session_id: session.id,
    })

  } catch (error) {
    console.error('[create-checkout] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
