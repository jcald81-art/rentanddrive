import { NextRequest, NextResponse } from 'next/server'

// GET /api/gas/prices
// Fetches gas prices from CollectAPI or returns mock data
// Alternative: use Apify GasBuddy scraper for more accurate data
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get('lat') || '39.5296'
  const lng = searchParams.get('lng') || '-119.8138'
  const fuelType = searchParams.get('fuelType') || '1' // 1=regular, 2=midgrade, 3=premium, 4=diesel

  try {
    // Check if API key is configured
    if (process.env.COLLECTAPI_KEY) {
      const response = await fetch(
        `https://collectapi.com/api/gasPrice/gasPrice?lng=${lng}&lat=${lat}`,
        {
          headers: {
            authorization: `apikey ${process.env.COLLECTAPI_KEY}`,
            'content-type': 'application/json',
          },
          next: { revalidate: 300 }, // Cache for 5 minutes
        }
      )

      if (response.ok) {
        const data = await response.json()
        // Transform API response to our format
        // Note: Actual API response structure may vary
        return NextResponse.json({
          stations: data.result || [],
          averagePrice: data.averagePrice || 3.84,
          fuelType: parseInt(fuelType),
        })
      }
    }

    // Return mock data for development/demo
    const mockStations = generateMockStations(parseFloat(lat), parseFloat(lng), parseInt(fuelType))

    return NextResponse.json({
      stations: mockStations,
      averagePrice: getAveragePrice(parseInt(fuelType)),
      fuelType: parseInt(fuelType),
    })
  } catch (error) {
    console.error('Gas prices API error:', error)

    // Return mock data on error
    const mockStations = generateMockStations(parseFloat(lat), parseFloat(lng), parseInt(fuelType))

    return NextResponse.json({
      stations: mockStations,
      averagePrice: getAveragePrice(parseInt(fuelType)),
      fuelType: parseInt(fuelType),
    })
  }
}

function getAveragePrice(fuelType: number): number {
  switch (fuelType) {
    case 1:
      return 3.84 // Regular
    case 2:
      return 4.14 // Midgrade
    case 3:
      return 4.44 // Premium
    case 4:
      return 4.29 // Diesel
    default:
      return 3.84
  }
}

function generateMockStations(lat: number, lng: number, fuelType: number) {
  const basePrice = getAveragePrice(fuelType)

  const stationNames = [
    'Costco Gasoline',
    'Sams Club',
    'Arco',
    'Chevron',
    'Shell',
    '76',
    'Sinclair',
    'Terrible Herbst',
    'Maverik',
    'Flying J',
  ]

  const streets = [
    'S Virginia St',
    'N McCarran Blvd',
    'Kietzke Ln',
    'Robb Dr',
    'Sparks Blvd',
    'Pyramid Way',
    'Vista Blvd',
    'E 2nd St',
    'Mill St',
    'W 4th St',
  ]

  const timeReports = [
    '5 mins ago',
    '14 mins ago',
    '22 mins ago',
    '35 mins ago',
    '1 hour ago',
    '2 hours ago',
    '3 hours ago',
    '4 hours ago',
    '6 hours ago',
    '8 hours ago',
  ]

  // Generate stations with varying prices
  const stations = stationNames.map((name, index) => {
    // Costco and Sams Club are cheapest
    let priceVariation = 0
    if (index === 0) priceVariation = -0.35 // Costco - cheapest
    else if (index === 1) priceVariation = -0.28 // Sams Club
    else if (index === 2) priceVariation = -0.15 // Arco
    else if (index <= 4) priceVariation = (Math.random() - 0.3) * 0.2 // Mid-range
    else priceVariation = (Math.random() * 0.3) + 0.05 // Higher prices

    const price = Math.max(basePrice + priceVariation, basePrice - 0.40)

    return {
      name,
      address: `${1000 + index * 234} ${streets[index]}, Reno, NV`,
      price: parseFloat(price.toFixed(2)),
      distance: 0.8 + index * 0.7 + Math.random() * 0.5,
      lastReported: timeReports[index],
      lat: lat + (Math.random() - 0.5) * 0.05,
      lng: lng + (Math.random() - 0.5) * 0.05,
    }
  })

  // Sort by price (cheapest first)
  return stations.sort((a, b) => a.price - b.price)
}
