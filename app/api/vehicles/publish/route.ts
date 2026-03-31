import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      vin,
      year,
      make,
      model,
      trim,
      mileage,
      daily_rate,
      weekly_rate,
      monthly_rate,
      features,
      adventure_tags,
      photos,
      location_city,
      location_state,
      location_address,
      description,
    } = body

    // Validate required fields
    if (!year || !make || !model || !daily_rate) {
      return NextResponse.json(
        { error: 'Missing required fields: year, make, model, daily_rate' },
        { status: 400 }
      )
    }

    if (!photos || photos.length < 6) {
      return NextResponse.json(
        { error: 'Minimum 6 photos required' },
        { status: 400 }
      )
    }

    // Check if host has Stripe Connect
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_id, stripe_onboarding_complete')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_onboarding_complete) {
      return NextResponse.json(
        { error: 'Please complete payout setup before publishing' },
        { status: 400 }
      )
    }

    // Determine category from body class or make educated guess
    let category = 'car'
    const modelLower = model.toLowerCase()
    const makeLower = make.toLowerCase()
    
    if (['suv', 'crossover', 'utility'].some(t => modelLower.includes(t)) ||
        ['4runner', 'wrangler', 'bronco', 'tahoe', 'suburban', 'expedition', 'pilot', 'highlander', 'rav4', 'cr-v', 'outback', 'forester'].some(m => modelLower.includes(m))) {
      category = 'suv'
    } else if (['truck', 'pickup', 'f-150', 'f150', 'silverado', 'ram', 'tacoma', 'tundra', 'colorado', 'ranger', 'frontier', 'titan', 'ridgeline'].some(t => modelLower.includes(t))) {
      category = 'truck'
    } else if (['harley', 'ducati', 'bmw motorrad', 'kawasaki', 'yamaha', 'honda motorcycle', 'suzuki', 'triumph'].some(m => makeLower.includes(m))) {
      category = 'motorcycle'
    } else if (['winnebago', 'airstream', 'thor', 'forest river', 'coachmen', 'jayco', 'keystone'].some(m => makeLower.includes(m))) {
      category = 'rv'
    } else if (['polaris', 'can-am', 'arctic cat', 'kawasaki mule', 'honda pioneer', 'yamaha viking'].some(m => makeLower.includes(m))) {
      category = 'atv'
    }

    // Check for AWD/4WD in features
    const isAwd = features?.some((f: string) => 
      f.toLowerCase().includes('awd') || f.toLowerCase().includes('4wd')
    ) || false

    // Insert vehicle
    const { data: vehicle, error: insertError } = await supabase
      .from('vehicles')
      .insert({
        host_id: user.id,
        vin: vin || null,
        year: parseInt(year),
        make,
        model,
        trim: trim || null,
        mileage: mileage ? parseInt(mileage) : null,
        category,
        daily_rate: parseFloat(daily_rate),
        weekly_rate: weekly_rate ? parseFloat(weekly_rate) : Math.round(parseFloat(daily_rate) * 6),
        monthly_rate: monthly_rate ? parseFloat(monthly_rate) : Math.round(parseFloat(daily_rate) * 20),
        features: features || [],
        adventure_tags: adventure_tags || [],
        photos,
        thumbnail: photos[0],
        location_city: location_city || 'Reno',
        location_state: location_state || 'NV',
        location_address: location_address || null,
        description: description || `${year} ${make} ${model} available for rent.`,
        is_awd: isAwd,
        has_ski_rack: features?.includes('Ski Rack') || false,
        has_tow_hitch: features?.includes('Tow Hitch') || false,
        status: 'active',
        is_active: true,
        is_approved: true, // Auto-approve for now, could add review queue
        instant_book: true,
        host_stripe_account_id: profile.stripe_connect_id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[publish] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to publish vehicle' },
        { status: 500 }
      )
    }

    // Calculate estimated earnings
    const estimatedDaysPerMonth = 15 // Conservative estimate
    const radEarnings = Math.round(parseFloat(daily_rate) * estimatedDaysPerMonth * 0.90)
    const turoEarnings = Math.round(parseFloat(daily_rate) * estimatedDaysPerMonth * 0.70)

    return NextResponse.json({
      success: true,
      vehicle: {
        id: vehicle.id,
        year,
        make,
        model,
      },
      estimatedFirstBooking: '2-5 days based on market demand',
      monthlyEarnings: {
        rad: radEarnings,
        turo: turoEarnings,
        difference: radEarnings - turoEarnings,
      },
    })
  } catch (error) {
    console.error('[publish] Error:', error)
    return NextResponse.json(
      { error: 'Failed to publish vehicle' },
      { status: 500 }
    )
  }
}
