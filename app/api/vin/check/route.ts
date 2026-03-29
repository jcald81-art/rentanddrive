import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// VIN validation
function isValidVin(vin: string): boolean {
  if (vin.length !== 17) return false
  // VIN cannot contain I, O, Q
  if (/[IOQ]/i.test(vin)) return false
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { vin } = await request.json()

    if (!vin) {
      return NextResponse.json({ error: 'VIN required' }, { status: 400 })
    }

    const normalizedVin = vin.toUpperCase().trim()

    if (!isValidVin(normalizedVin)) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid VIN format. VIN must be 17 characters and cannot contain I, O, or Q.' 
      }, { status: 400 })
    }

    // Check if VIN already exists in our system
    const { data: existingVehicle } = await supabase
      .from('vehicles')
      .select('id, make, model, year, status')
      .eq('vin', normalizedVin)
      .single()

    // Decode VIN via NHTSA
    const nhtsaResponse = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${normalizedVin}?format=json`
    )
    const nhtsaData = await nhtsaResponse.json()

    const results = nhtsaData.Results || []
    const getValue = (variable: string) => {
      const item = results.find((r: any) => r.Variable === variable)
      return item?.Value && item.Value !== 'Not Applicable' ? item.Value : null
    }

    const decoded = {
      vin: normalizedVin,
      make: getValue('Make'),
      model: getValue('Model'),
      year: parseInt(getValue('Model Year') || '0'),
      trim: getValue('Trim'),
      bodyClass: getValue('Body Class'),
      vehicleType: getValue('Vehicle Type'),
      driveType: getValue('Drive Type'),
      fuelType: getValue('Fuel Type - Primary'),
      engineCylinders: getValue('Engine Number of Cylinders'),
      engineDisplacement: getValue('Displacement (L)'),
      transmissionStyle: getValue('Transmission Style'),
      plantCountry: getValue('Plant Country'),
      manufacturer: getValue('Manufacturer Name'),
    }

    // Check for recalls
    const recallResponse = await fetch(
      `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${decoded.make}&model=${decoded.model}&modelYear=${decoded.year}`
    )
    const recallData = await recallResponse.json()
    const recalls = recallData.results || []

    return NextResponse.json({
      valid: true,
      decoded,
      existingInSystem: !!existingVehicle,
      existingVehicle: existingVehicle || null,
      recalls: {
        count: recalls.length,
        hasOpenRecalls: recalls.length > 0,
        items: recalls.slice(0, 5).map((r: any) => ({
          campaignNumber: r.NHTSACampaignNumber,
          component: r.Component,
          summary: r.Summary,
          consequence: r.Consequence,
          remedy: r.Remedy,
        })),
      },
    })
  } catch (error) {
    console.error('[VIN Check Error]:', error)
    return NextResponse.json(
      { error: 'Failed to check VIN' },
      { status: 500 }
    )
  }
}
