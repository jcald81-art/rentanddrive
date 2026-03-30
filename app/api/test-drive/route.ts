import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SecureLink } from '@/lib/agents/securelink'

// Mock Lyft/Uber concierge booking
async function bookConciergeRide(
  pickupAddress: string,
  destinationAddress: string,
  scheduledTime: Date
) {
  // In production, integrate with Lyft Business or Uber for Business API
  const lyftApiKey = process.env.LYFT_BUSINESS_API_KEY
  
  if (lyftApiKey) {
    // Real Lyft API integration would go here
    try {
      const response = await fetch('https://api.lyft.com/v1/rides', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lyftApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          origin: { address: pickupAddress },
          destination: { address: destinationAddress },
          ride_type: 'lyft',
          scheduled_pickup_time: scheduledTime.toISOString()
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        return {
          ride_id: data.ride_id,
          confirmation_code: data.confirmation_code,
          estimated_pickup: data.estimated_pickup_time,
          driver: data.driver,
          vehicle: data.vehicle
        }
      }
    } catch (error) {
      console.error('Lyft API error:', error)
    }
  }

  // Mock response
  return {
    ride_id: `LYFT-${Date.now().toString(36).toUpperCase()}`,
    confirmation_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    estimated_pickup: scheduledTime.toISOString(),
    driver: {
      name: 'Your Lyft driver',
      rating: 4.9
    },
    vehicle: {
      make: 'Toyota',
      model: 'Camry',
      color: 'Silver',
      license_plate: 'LYFT123'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      listing_id, 
      preferred_datetime, 
      pickup_address, 
      message_to_host 
    } = body

    if (!listing_id || !preferred_datetime) {
      return NextResponse.json(
        { error: 'Missing listing_id or preferred_datetime' },
        { status: 400 }
      )
    }

    // Get listing with vehicle and host details
    const { data: listing, error: listingError } = await supabase
      .from('vehicle_listings')
      .select(`
        *,
        vehicle:vehicles(
          id, make, model, year, location_lat, location_lng, 
          location_address, daily_rate_cents,
          host:profiles(id, full_name, email, phone)
        )
      `)
      .eq('id', listing_id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Get requester profile
    const { data: requester } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('id', user.id)
      .single()

    const vehicleAddress = listing.vehicle?.location_address || 'Reno, NV'
    const scheduledTime = new Date(preferred_datetime)

    // Book concierge Lyft ride (free for local buyers within 30 miles)
    const conciergeRide = await bookConciergeRide(
      pickup_address || 'Reno, NV',
      vehicleAddress,
      scheduledTime
    )

    // Create discounted test drive booking (50% off for test drives)
    const testDriveRate = Math.round((listing.vehicle?.daily_rate_cents || 5000) * 0.5)
    
    // Calculate end time (2 hours for test drive)
    const endTime = new Date(scheduledTime.getTime() + 2 * 60 * 60 * 1000)

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        vehicle_id: listing.vehicle?.id,
        renter_id: user.id,
        start_date: scheduledTime.toISOString(),
        end_date: endTime.toISOString(),
        total_price_cents: testDriveRate,
        status: 'confirmed',
        booking_type: 'test_drive',
        notes: `Test drive - ${message_to_host || 'Interested buyer'}`,
        pickup_location: vehicleAddress
      })
      .select()
      .single()

    // Generate igloo PIN for test drive
    let iglooPin = null
    try {
      const iglooResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/igloo/generate-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking?.id,
          start_time: scheduledTime.toISOString(),
          end_time: endTime.toISOString()
        })
      })
      if (iglooResponse.ok) {
        const iglooData = await iglooResponse.json()
        iglooPin = iglooData.pin
      }
    } catch {
      // Igloo PIN generation is optional
    }

    // Create test drive request record
    const { data: testDrive, error: testDriveError } = await supabase
      .from('test_drive_requests')
      .insert({
        listing_id,
        requester_id: user.id,
        concierge_ride_id: conciergeRide.ride_id,
        booking_id: booking?.id,
        preferred_datetime: scheduledTime.toISOString(),
        pickup_address,
        message_to_host,
        status: 'scheduled',
        lyft_pickup_time: conciergeRide.estimated_pickup,
        lyft_confirmation_code: conciergeRide.confirmation_code
      })
      .select()
      .single()

    if (testDriveError) {
      console.error('Test drive creation error:', testDriveError)
      return NextResponse.json({ error: 'Failed to create test drive' }, { status: 500 })
    }

    // Send SecureLink notifications
    const secureLink = new SecureLink()
    const vehicle = listing.vehicle
    const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'the vehicle'
    const host = vehicle?.host

    // Notify host immediately
    if (host?.phone) {
      await secureLink.sendSMS({
        to: host.phone,
        message: `New test drive scheduled! ${requester?.full_name || 'A buyer'} wants to test drive your ${vehicleName} on ${scheduledTime.toLocaleDateString()} at ${scheduledTime.toLocaleTimeString()}. Message: "${message_to_host || 'Interested in purchasing'}"`
      })
    }

    if (host?.email) {
      await secureLink.sendEmail({
        to: host.email,
        subject: `Test Drive Request - ${vehicleName}`,
        template: 'test_drive_scheduled_host',
        data: {
          vehicleName,
          buyerName: requester?.full_name || 'Interested buyer',
          dateTime: scheduledTime.toISOString(),
          message: message_to_host,
          approveUrl: `${process.env.NEXT_PUBLIC_APP_URL}/hostslab/workshop`
        }
      })
    }

    // Send buyer confirmation with Lyft and igloo details
    if (requester?.phone) {
      await secureLink.sendSMS({
        to: requester.phone,
        message: `Test drive confirmed! ${vehicleName} on ${scheduledTime.toLocaleDateString()}. Lyft pickup: ${conciergeRide.confirmation_code}. ${iglooPin ? `Lockbox PIN: ${iglooPin}` : ''} Vehicle location: ${vehicleAddress}`
      })
    }

    if (requester?.email) {
      await secureLink.sendEmail({
        to: requester.email,
        subject: `Test Drive Confirmed - ${vehicleName}`,
        template: 'test_drive_confirmed_buyer',
        data: {
          vehicleName,
          dateTime: scheduledTime.toISOString(),
          lyftConfirmation: conciergeRide.confirmation_code,
          lyftPickupTime: conciergeRide.estimated_pickup,
          pickupAddress: pickup_address,
          vehicleAddress,
          iglooPin,
          listingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/car-lot/${listing_id}`
        }
      })
    }

    return NextResponse.json({
      success: true,
      test_drive: testDrive,
      booking,
      concierge_ride: {
        confirmation_code: conciergeRide.confirmation_code,
        pickup_time: conciergeRide.estimated_pickup,
        driver: conciergeRide.driver,
        vehicle: conciergeRide.vehicle
      },
      igloo_pin: iglooPin,
      vehicle_address: vehicleAddress
    })

  } catch (error) {
    console.error('Test drive error:', error)
    return NextResponse.json(
      { error: 'Failed to schedule test drive' },
      { status: 500 }
    )
  }
}

// GET endpoint to list user's test drive requests
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: testDrives, error } = await supabase
    .from('test_drive_requests')
    .select(`
      *,
      listing:vehicle_listings(
        *,
        vehicle:vehicles(id, make, model, year, images)
      )
    `)
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch test drives' }, { status: 500 })
  }

  return NextResponse.json({ test_drives: testDrives })
}
