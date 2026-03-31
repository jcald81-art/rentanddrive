import { NextRequest, NextResponse } from 'next/server'

// NHTSA VIN Decoder API - free, no API key required
const NHTSA_API = 'https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues'

interface VINDecodeResult {
  year: string
  make: string
  model: string
  trim: string
  engine: string
  drivetrain: string
  bodyClass: string
  fuelType: string
  doors: string
  recalls: { count: number; open: boolean }
  features: string[]
}

export async function POST(req: NextRequest) {
  try {
    const { vin } = await req.json()

    if (!vin || vin.length !== 17) {
      return NextResponse.json(
        { error: 'Invalid VIN. Must be exactly 17 characters.' },
        { status: 400 }
      )
    }

    // Call NHTSA API
    const response = await fetch(`${NHTSA_API}/${vin}?format=json`)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to decode VIN' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const result = data.Results?.[0]

    if (!result || result.ErrorCode !== '0') {
      return NextResponse.json(
        { error: 'VIN not found or invalid' },
        { status: 404 }
      )
    }

    // Extract features from VIN decode
    const features: string[] = []
    
    if (result.DriveType?.toLowerCase().includes('awd') || 
        result.DriveType?.toLowerCase().includes('4wd') ||
        result.DriveType?.toLowerCase().includes('all wheel')) {
      features.push('AWD/4WD')
    }
    
    // Most modern vehicles have these - check trim level hints
    const trimLower = (result.Trim || '').toLowerCase()
    const seriesLower = (result.Series || '').toLowerCase()
    
    if (trimLower.includes('premium') || trimLower.includes('limited') || 
        trimLower.includes('platinum') || seriesLower.includes('luxury')) {
      features.push('Heated Seats', 'Sunroof/Panorama', 'Bluetooth', 'Apple CarPlay')
    }
    
    if (parseInt(result.ModelYear) >= 2018) {
      features.push('Backup Camera', 'USB Charging', 'Bluetooth')
    }
    
    if (parseInt(result.ModelYear) >= 2020) {
      features.push('Apple CarPlay', 'Android Auto')
    }

    // Dedupe features
    const uniqueFeatures = [...new Set(features)]

    // Check for open recalls (simplified - in production would call NHTSA recalls API)
    const recallCount = 0
    const hasOpenRecalls = false

    const decoded: VINDecodeResult = {
      year: result.ModelYear || '',
      make: result.Make || '',
      model: result.Model || '',
      trim: result.Trim || result.Series || '',
      engine: `${result.DisplacementL || ''}L ${result.EngineCylinders || ''}-cyl ${result.FuelTypePrimary || ''}`.trim(),
      drivetrain: result.DriveType || '',
      bodyClass: result.BodyClass || '',
      fuelType: result.FuelTypePrimary || 'Gasoline',
      doors: result.Doors || '4',
      recalls: { count: recallCount, open: hasOpenRecalls },
      features: uniqueFeatures,
    }

    return NextResponse.json(decoded)
  } catch (error) {
    console.error('[vin-decode] Error:', error)
    return NextResponse.json(
      { error: 'Failed to decode VIN' },
      { status: 500 }
    )
  }
}
