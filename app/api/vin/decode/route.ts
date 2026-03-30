import { NextRequest, NextResponse } from 'next/server'

// VIN validation
function isValidVin(vin: string): boolean {
  if (vin.length !== 17) return false
  if (/[IOQ]/i.test(vin)) return false
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vin = searchParams.get('vin')

    if (!vin) {
      return NextResponse.json({ error: 'VIN required' }, { status: 400 })
    }

    const normalizedVin = vin.toUpperCase().trim()

    if (!isValidVin(normalizedVin)) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid VIN format' 
      }, { status: 400 })
    }

    // Call NHTSA free VIN decoder
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${normalizedVin}?format=json`
    )

    if (!response.ok) {
      throw new Error('NHTSA API error')
    }

    const data = await response.json()
    const results = data.Results?.[0] || {}

    // Extract relevant fields for auto-fill
    const decoded = {
      vin: normalizedVin,
      make: results.Make || null,
      model: results.Model || null,
      year: parseInt(results.ModelYear) || null,
      trim: results.Trim || null,
      body_style: results.BodyClass || null,
      vehicle_type: results.VehicleType || null,
      drive_type: results.DriveType || null,
      fuel_type: results.FuelTypePrimary || null,
      engine: {
        cylinders: results.EngineCylinders || null,
        displacement: results.DisplacementL || null,
        hp: results.EngineHP || null,
        configuration: results.EngineConfiguration || null,
      },
      transmission: results.TransmissionStyle || null,
      doors: results.Doors || null,
      seats: results.Seats || null,
      plant_country: results.PlantCountry || null,
      manufacturer: results.Manufacturer || null,
      gvwr: results.GVWR || null,
      // Safety features
      abs: results.ABS === 'Standard',
      esc: results.ESC === 'Standard',
      traction_control: results.TractionControl === 'Standard',
      airbags: {
        front: results.AirBagLocFront !== 'Not Applicable',
        side: results.AirBagLocSide !== 'Not Applicable',
        curtain: results.AirBagLocCurtain !== 'Not Applicable',
      },
    }

    return NextResponse.json({
      valid: true,
      decoded,
    })
  } catch (error) {
    console.error('[VIN Decode Error]:', error)
    return NextResponse.json(
      { error: 'Failed to decode VIN' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { vin } = await request.json()
  const url = new URL(request.url)
  url.searchParams.set('vin', vin)
  return GET(new NextRequest(url))
}
