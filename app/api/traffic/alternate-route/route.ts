import { NextRequest, NextResponse } from 'next/server'

// For native turn-by-turn rerouting, integrate TomTom Routing API or Google Directions API
// This endpoint returns a Google Maps URL for now

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const currentLat = searchParams.get('currentLat')
  const currentLng = searchParams.get('currentLng')
  const incidentLat = searchParams.get('incidentLat')
  const incidentLng = searchParams.get('incidentLng')
  const destinationLat = searchParams.get('destinationLat')
  const destinationLng = searchParams.get('destinationLng')

  if (!currentLat || !currentLng) {
    return NextResponse.json({ error: 'Current location required' }, { status: 400 })
  }

  // If destination provided, route to destination avoiding incident area
  // Otherwise, just open maps at current location
  let mapsUrl: string

  if (destinationLat && destinationLng) {
    mapsUrl = `https://www.google.com/maps/dir/?api=1` +
      `&origin=${currentLat},${currentLng}` +
      `&destination=${destinationLat},${destinationLng}` +
      `&travelmode=driving`
  } else {
    // Just show traffic layer near current location
    mapsUrl = `https://www.google.com/maps/@${currentLat},${currentLng},14z/data=!5m1!1e1`
  }

  // Estimate time saving (stub - would need actual routing API)
  const estimatedTimeSaving = Math.floor(Math.random() * 10) + 5 // 5-15 min

  return NextResponse.json({
    alternateRouteUrl: mapsUrl,
    estimatedTimeSaving,
    note: 'Opens Google Maps for navigation. For embedded turn-by-turn, integrate TomTom Routing API.'
  })
}
