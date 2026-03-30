import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      year,
      make,
      model,
      color,
      licensePlate,
      licenseState,
      vin,
      dailyRate,
      weeklyRate,
      description,
      category,
      transmission,
      seats,
      features,
    } = body

    // Validate required fields
    if (!year || !make || !model || !color || !licensePlate || !licenseState || !dailyRate || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create the vehicle listing
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .insert({
        host_id: user.id,
        year: parseInt(year),
        make,
        model,
        color,
        license_plate: licensePlate,
        license_state: licenseState,
        vin: vin || null,
        daily_rate: parseFloat(dailyRate),
        weekly_rate: weeklyRate ? parseFloat(weeklyRate) : null,
        description: description || null,
        category,
        transmission: transmission || 'auto',
        seats: parseInt(seats) || 5,
        features: features || [],
        status: 'draft', // Starts as draft until photos are added
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (vehicleError) {
      console.error('[Listing Create] Error:', vehicleError)
      return NextResponse.json(
        { success: false, error: 'Failed to create listing' },
        { status: 500 }
      )
    }

    console.log(`[Listing Create] Created vehicle listing: ${vehicle.id} for host ${user.id}`)

    // Create notification for host
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'listing_created',
      title: 'Listing Created',
      message: `Your ${year} ${make} ${model} listing has been created. Add photos to publish it.`,
      data: { vehicle_id: vehicle.id },
    })

    return NextResponse.json({
      success: true,
      listingId: vehicle.id,
      message: 'Listing created successfully',
    })
  } catch (error) {
    console.error('[Listing Create] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create listing' },
      { status: 500 }
    )
  }
}
