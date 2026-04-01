'use server'

interface DecodedVehicle {
  vin: string
  is_valid: boolean
  make: string | null
  model: string | null
  year: number | null
  trim: string | null
  body_class: string | null
  doors: number | null
  engine_cylinders: number | null
  engine_displacement_l: number | null
  fuel_type: string | null
  drive_type: string | null
  transmission: string | null
  manufacturer: string | null
  plant_country: string | null
  vehicle_type: string | null
  suggested_category: string
  is_awd: boolean
}

interface RecallInfo {
  Component: string
  Summary: string
  Consequence: string
  Remedy: string
  NHTSACampaignNumber: string
}

interface DecodeVinResult {
  success: boolean
  vehicle?: DecodedVehicle
  recalls?: {
    total_recalls: number
    recalls: RecallInfo[]
  }
  error?: string
}

export async function decodeVin(vin: string): Promise<DecodeVinResult> {
  try {
    // Validate VIN format
    if (!vin || vin.length !== 17) {
      return {
        success: false,
        error: 'VIN must be exactly 17 characters'
      }
    }

    // Clean VIN - uppercase, remove invalid characters
    const cleanVin = vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '')
    
    if (cleanVin.length !== 17) {
      return {
        success: false,
        error: 'Invalid VIN format'
      }
    }

    // Call NHTSA VIN Decode API (vpic.nhtsa.dot.gov)
    const decodeUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${cleanVin}?format=json`
    
    const decodeResponse = await fetch(decodeUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RAD-Vehicle-Platform/1.0'
      },
      cache: 'no-store'
    })

    if (!decodeResponse.ok) {
      console.error('[VIN Decode] NHTSA API error:', decodeResponse.status)
      return {
        success: false,
        error: 'Service temporarily unavailable. Please try again or enter details manually.'
      }
    }

    const decodeData = await decodeResponse.json()
    const results = decodeData.Results

    if (!results || results.length === 0) {
      return {
        success: false,
        error: 'Could not decode this VIN. Please verify it is correct.'
      }
    }

    // Parse decode results - NHTSA returns array of variable/value pairs
    const getValue = (variableId: number): string | null => {
      const item = results.find((r: { VariableId: number }) => r.VariableId === variableId)
      return item?.Value && item.Value.trim() !== '' ? item.Value.trim() : null
    }

    // Variable IDs from NHTSA API
    const make = getValue(26) // Make
    const model = getValue(28) // Model
    const yearStr = getValue(29) // ModelYear
    const trim = getValue(38) // Trim
    const bodyClass = getValue(5) // BodyClass
    const doorsStr = getValue(14) // Doors
    const engineCylindersStr = getValue(9) // EngineCylinders
    const displacementStr = getValue(11) // DisplacementL
    const fuelType = getValue(24) // FuelTypePrimary
    const driveType = getValue(15) // DriveType
    const transmission = getValue(37) // TransmissionStyle
    const manufacturer = getValue(27) // Manufacturer
    const plantCountry = getValue(75) // PlantCountry
    const vehicleType = getValue(39) // VehicleType
    const errorCode = getValue(143) // ErrorCode

    // Check for critical errors
    if (errorCode && !errorCode.includes('0')) {
      console.log('[VIN Decode] Warning code:', errorCode)
    }

    // Verify we got at least make, model, year
    if (!make && !model && !yearStr) {
      return {
        success: false,
        error: 'Could not decode this VIN. Please verify it is correct or enter details manually.'
      }
    }

    // Map body class to category
    let suggested_category = 'sedan'
    const bodyLower = (bodyClass || '').toLowerCase()
    
    if (bodyLower.includes('suv') || bodyLower.includes('sport utility')) {
      suggested_category = 'suv'
    } else if (bodyLower.includes('truck') || bodyLower.includes('pickup')) {
      suggested_category = 'truck'
    } else if (bodyLower.includes('van') || bodyLower.includes('minivan')) {
      suggested_category = 'van'
    } else if (bodyLower.includes('convertible') || bodyLower.includes('coupe') || bodyLower.includes('roadster')) {
      suggested_category = 'sports'
    } else if (bodyLower.includes('wagon')) {
      suggested_category = 'wagon'
    } else if (bodyLower.includes('motorcycle')) {
      suggested_category = 'cruiser'
    }

    // Check for AWD/4WD
    const driveLower = (driveType || '').toLowerCase()
    const is_awd = driveLower.includes('awd') || driveLower.includes('4wd') || 
                   driveLower.includes('all-wheel') || driveLower.includes('four-wheel')

    const vehicle: DecodedVehicle = {
      vin: cleanVin,
      is_valid: true,
      make,
      model,
      year: yearStr ? parseInt(yearStr) : null,
      trim,
      body_class: bodyClass,
      doors: doorsStr ? parseInt(doorsStr) : null,
      engine_cylinders: engineCylindersStr ? parseInt(engineCylindersStr) : null,
      engine_displacement_l: displacementStr ? parseFloat(displacementStr) : null,
      fuel_type: fuelType,
      drive_type: driveType,
      transmission,
      manufacturer,
      plant_country: plantCountry,
      vehicle_type: vehicleType,
      suggested_category,
      is_awd
    }

    // Now check for recalls
    let recalls = { total_recalls: 0, recalls: [] as RecallInfo[] }
    
    try {
      const recallUrl = `https://api.nhtsa.gov/recalls/recallsByVin?vin=${cleanVin}`
      const recallResponse = await fetch(recallUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RAD-Vehicle-Platform/1.0'
        },
        cache: 'no-store'
      })

      if (recallResponse.ok) {
        const recallData = await recallResponse.json()
        const recallResults = recallData.results || []
        
        recalls = {
          total_recalls: recallResults.length,
          recalls: recallResults.map((r: Record<string, string>) => ({
            Component: r.Component || 'Unknown',
            Summary: r.Summary || 'No summary available',
            Consequence: r.Consequence || 'Unknown consequence',
            Remedy: r.Remedy || 'Contact dealer',
            NHTSACampaignNumber: r.NHTSACampaignNumber || 'N/A'
          }))
        }
      }
    } catch (recallError) {
      // Recall check failed but VIN decode succeeded - continue
      console.error('[VIN Decode] Recall check error:', recallError)
    }

    return {
      success: true,
      vehicle,
      recalls
    }

  } catch (error) {
    console.error('[VIN Decode] Unexpected error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}
