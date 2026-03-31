import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const pickupLat = searchParams.get('pickup_lat')
  const pickupLng = searchParams.get('pickup_lng')
  const dropoffLat = searchParams.get('dropoff_lat')
  const dropoffLng = searchParams.get('dropoff_lng')

  if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
    return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 })
  }

  // Check if Lyft credentials are configured
  if (!process.env.LYFT_CLIENT_ID || !process.env.LYFT_CLIENT_SECRET) {
    // Return mock estimate for development
    return NextResponse.json({
      provider: 'lyft',
      estimated_cost_min: 8,
      estimated_cost_max: 15,
      estimated_duration_seconds: 720,
      mock: true,
    })
  }

  try {
    // Get Lyft access token
    const tokenRes = await fetch('https://api.lyft.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.LYFT_CLIENT_ID}:${process.env.LYFT_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: 'grant_type=client_credentials&scope=public',
    })

    if (!tokenRes.ok) {
      console.error('[Lyft] Token error:', await tokenRes.text())
      // Return mock on auth failure
      return NextResponse.json({
        provider: 'lyft',
        estimated_cost_min: 8,
        estimated_cost_max: 15,
        estimated_duration_seconds: 720,
        mock: true,
      })
    }

    const { access_token } = await tokenRes.json()

    // Get price estimate
    const estimateRes = await fetch(
      `https://api.lyft.com/v1/cost?ride_type=lyft&start_lat=${pickupLat}&start_lng=${pickupLng}&end_lat=${dropoffLat}&end_lng=${dropoffLng}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )

    if (!estimateRes.ok) {
      console.error('[Lyft] Estimate error:', await estimateRes.text())
      return NextResponse.json({
        provider: 'lyft',
        estimated_cost_min: 8,
        estimated_cost_max: 15,
        estimated_duration_seconds: 720,
        mock: true,
      })
    }

    const estimate = await estimateRes.json()
    const lyftStandard = estimate.cost_estimates?.find(
      (e: { ride_type: string }) => e.ride_type === 'lyft'
    )

    return NextResponse.json({
      provider: 'lyft',
      estimated_cost_min: lyftStandard?.estimated_cost_cents_min
        ? lyftStandard.estimated_cost_cents_min / 100
        : 8,
      estimated_cost_max: lyftStandard?.estimated_cost_cents_max
        ? lyftStandard.estimated_cost_cents_max / 100
        : 15,
      estimated_duration_seconds: lyftStandard?.estimated_duration_seconds ?? 600,
    })
  } catch (error) {
    console.error('[Lyft] Estimate error:', error)
    // Return mock on any error
    return NextResponse.json({
      provider: 'lyft',
      estimated_cost_min: 8,
      estimated_cost_max: 15,
      estimated_duration_seconds: 720,
      mock: true,
    })
  }
}
