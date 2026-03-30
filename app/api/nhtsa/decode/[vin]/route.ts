import { NextRequest, NextResponse } from 'next/server'

const NHTSA_BASE_URL = 'https://api.nhtsa.gov'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  try {
    const { vin } = await params
    
    if (!vin || vin.length !== 17) {
      return NextResponse.json({ error: 'Invalid VIN - must be 17 characters' }, { status: 400 })
    }

    // Call NHTSA VIN Decode API
    const decodeResponse = await fetch(
      `${NHTSA_BASE_URL}/vehicles/DecodeVinValues/${vin}?format=json`,
      { headers: { 'Accept': 'application/json' } }
    )

    if (!decodeResponse.ok) {
      throw new Error(`NHTSA Decode API error: ${decodeResponse.status}`)
    }

    const decodeData = await decodeResponse.json()
    const result = decodeData.Results?.[0]

    if (!result) {
      return NextResponse.json({ 
        error: 'Could not decode VIN',
        vin 
      }, { status: 400 })
    }

    // Check for errors in decoding
    const errorCode = result.ErrorCode
    if (errorCode && errorCode !== '0') {
      // Some partial decoding may still be useful
      console.log(`[NHTSA Decode] Warning: Error code ${errorCode} for VIN ${vin}`)
    }

    // Extract relevant fields for vehicle listing
    const decoded = {
      vin: vin.toUpperCase(),
      is_valid: !errorCode || errorCode === '0' || errorCode.includes('0'),
      make: result.Make || null,
      model: result.Model || null,
      year: result.ModelYear ? parseInt(result.ModelYear) : null,
      trim: result.Trim || null,
      series: result.Series || null,
      
      // Body and style
      body_class: result.BodyClass || null,
      doors: result.Doors ? parseInt(result.Doors) : null,
      
      // Engine
      engine_type: result.EngineConfiguration || null,
      engine_cylinders: result.EngineCylinders ? parseInt(result.EngineCylinders) : null,
      engine_displacement_l: result.DisplacementL ? parseFloat(result.DisplacementL) : null,
      fuel_type: result.FuelTypePrimary || null,
      
      // Drivetrain
      drive_type: result.DriveType || null,
      transmission: result.TransmissionStyle || null,
      
      // Dimensions
      gvwr: result.GVWR || null,
      
      // Manufacturing
      manufacturer: result.Manufacturer || null,
      plant_city: result.PlantCity || null,
      plant_state: result.PlantState || null,
      plant_country: result.PlantCountry || null,
      
      // Vehicle type
      vehicle_type: result.VehicleType || null,
      
      // Safety features
      abs: result.ABS || null,
      airbag_front: result.AirBagLocFront || null,
      airbag_side: result.AirBagLocSide || null,
      
      // Electric vehicle info
      ev_type: result.ElectrificationLevel || null,
      battery_kwh: result.BatteryKWh ? parseFloat(result.BatteryKWh) : null,
      
      // Raw data for debugging
      raw_error_code: errorCode,
      raw_error_text: result.ErrorText || null,
    }

    // Map body class to our categories
    let suggested_category = 'sedan'
    const bodyClass = (decoded.body_class || '').toLowerCase()
    
    if (bodyClass.includes('suv') || bodyClass.includes('sport utility')) {
      suggested_category = 'suv'
    } else if (bodyClass.includes('truck') || bodyClass.includes('pickup')) {
      suggested_category = 'truck'
    } else if (bodyClass.includes('van') || bodyClass.includes('minivan')) {
      suggested_category = 'van'
    } else if (bodyClass.includes('convertible') || bodyClass.includes('coupe') || bodyClass.includes('roadster')) {
      suggested_category = 'sports'
    } else if (bodyClass.includes('wagon')) {
      suggested_category = 'wagon'
    } else if (bodyClass.includes('motorcycle')) {
      suggested_category = 'motorcycle'
    }

    // Determine if AWD
    const driveType = (decoded.drive_type || '').toLowerCase()
    const is_awd = driveType.includes('awd') || driveType.includes('4wd') || driveType.includes('all-wheel') || driveType.includes('four-wheel')

    return NextResponse.json({
      ...decoded,
      suggested_category,
      is_awd,
      decoded_at: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[NHTSA Decode API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to decode VIN' },
      { status: 500 }
    )
  }
}
