import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      vehicle_id,
      start_date,
      end_date,
      mileage_plan,
      lyft_pickup,
      lyft_return,
      promo_code,
    } = body

    // Fetch vehicle details
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*, host:users!vehicles_owner_id_fkey(id, full_name, email, stripe_account_id)')
      .eq('id', vehicle_id)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Calculate pricing
    const startDateObj = new Date(start_date)
    const endDateObj = new Date(end_date)
    const days = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24))
    
    const dailyRate = vehicle.daily_rate
    const subtotal = dailyRate * days
    const cleaningFee = 25
    const platformFee = Math.round(subtotal * 0.10)
    const lyftPickupFee = lyft_pickup ? 20 : 0
    const lyftReturnFee = lyft_return ? 20 : 0

    // Apply promo code discount
    let discount = 0
    let appliedPromoCode = null
    if (promo_code) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promo_code.toUpperCase())
        .eq('active', true)
        .single()

      if (promo) {
        if (promo.discount_type === 'percentage') {
          discount = Math.round(subtotal * (promo.discount_value / 100))
        } else {
          discount = promo.discount_value * 100 // Convert to cents
        }
        appliedPromoCode = promo.code
      }
    }

    const totalAmount = subtotal + cleaningFee + platformFee + lyftPickupFee + lyftReturnFee - discount

    // Generate booking number
    const bookingNumber = `RD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        booking_number: bookingNumber,
        vehicle_id: vehicle_id,
        renter_id: user.id,
        host_id: vehicle.host?.id,
      },
    })

    // Create booking record with pending status
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_number: bookingNumber,
        vehicle_id: vehicle_id,
        renter_id: user.id,
        host_id: vehicle.host?.id,
        start_date: start_date,
        end_date: end_date,
        daily_rate: dailyRate,
        days: days,
        subtotal: subtotal,
        cleaning_fee: cleaningFee,
        platform_fee: platformFee,
        lyft_pickup_fee: lyftPickupFee,
        lyft_return_fee: lyftReturnFee,
        lyft_pickup_requested: lyft_pickup,
        lyft_return_requested: lyft_return,
        discount: discount,
        promo_code: appliedPromoCode,
        total_amount: totalAmount,
        mileage_plan: mileage_plan,
        status: 'pending_payment',
        stripe_payment_intent_id: paymentIntent.id,
      })
      .select()
      .single()

    if (bookingError) {
      console.error('Booking creation error:', bookingError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    return NextResponse.json({
      booking: booking,
      payment_intent_client_secret: paymentIntent.client_secret,
      pricing: {
        daily_rate: dailyRate,
        days: days,
        subtotal: subtotal,
        cleaning_fee: cleaningFee,
        platform_fee: platformFee,
        lyft_pickup_fee: lyftPickupFee,
        lyft_return_fee: lyftReturnFee,
        discount: discount,
        promo_code: appliedPromoCode,
        total: totalAmount,
      },
    })
  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
