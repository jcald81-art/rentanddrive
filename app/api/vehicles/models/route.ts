import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getModelsForMakeYear } from '@/integrations/nhtsa'

export const dynamic = 'force-dynamic'

/**
 * Hardcoded popular models per make for fallback
 */
const POPULAR_MODELS: Record<string, string[]> = {
  'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Prius', '4Runner', 'Tundra', 'Sienna', 'Avalon'],
  'Honda': ['Accord', 'Civic', 'CR-V', 'Pilot', 'Odyssey', 'HR-V', 'Ridgeline', 'Passport', 'Fit', 'Insight'],
  'Ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Bronco', 'Edge', 'Ranger', 'Expedition', 'Maverick', 'Focus'],
  'Chevrolet': ['Silverado', 'Equinox', 'Tahoe', 'Malibu', 'Traverse', 'Camaro', 'Colorado', 'Suburban', 'Blazer', 'Trax'],
  'Tesla': ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
  'BMW': ['3 Series', '5 Series', 'X3', 'X5', 'X1', '7 Series', 'X7', '4 Series', 'M3', 'M5'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE', 'S-Class', 'A-Class', 'GLA', 'GLB', 'CLA', 'G-Class'],
  'Audi': ['A4', 'Q5', 'A6', 'Q7', 'A3', 'Q3', 'e-tron', 'A5', 'Q8', 'A8'],
  'Lexus': ['RX', 'ES', 'NX', 'IS', 'GX', 'UX', 'LS', 'LC', 'LX', 'RC'],
  'Nissan': ['Altima', 'Rogue', 'Sentra', 'Maxima', 'Pathfinder', 'Murano', 'Frontier', 'Titan', 'Kicks', 'Armada'],
  'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Kona', 'Palisade', 'Ioniq', 'Venue', 'Accent', 'Nexo'],
  'Kia': ['Forte', 'Sportage', 'Sorento', 'Telluride', 'Soul', 'Seltos', 'K5', 'Carnival', 'Stinger', 'EV6'],
  'Subaru': ['Outback', 'Forester', 'Crosstrek', 'Impreza', 'Legacy', 'Ascent', 'WRX', 'BRZ', 'Solterra'],
  'Mazda': ['CX-5', 'Mazda3', 'CX-30', 'CX-9', 'Mazda6', 'MX-5 Miata', 'CX-50', 'CX-90'],
  'Volkswagen': ['Jetta', 'Tiguan', 'Atlas', 'Passat', 'Golf', 'ID.4', 'Taos', 'Arteon'],
  'Jeep': ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Gladiator', 'Renegade', 'Wagoneer', 'Grand Wagoneer'],
  'Ram': ['1500', '2500', '3500', 'ProMaster', 'ProMaster City'],
  'GMC': ['Sierra', 'Yukon', 'Acadia', 'Terrain', 'Canyon', 'Hummer EV'],
  'Dodge': ['Charger', 'Challenger', 'Durango', 'Hornet'],
  'Porsche': ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan', '718 Cayman', '718 Boxster'],
}

/**
 * GET /api/vehicles/models?make=Toyota&year=2024
 * Returns models for a specific make and year
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const makeName = searchParams.get('make')
    const year = searchParams.get('year')
    
    if (!makeName) {
      return NextResponse.json(
        { error: 'Make parameter is required' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Try to get make ID from database
    const { data: makeData } = await supabase
      .from('vehicle_makes')
      .select('id, nhtsa_id')
      .ilike('name', makeName)
      .single()
    
    // If we have the make and year, try NHTSA
    if (makeData?.nhtsa_id && year) {
      try {
        const nhtsaModels = await getModelsForMakeYear(makeData.nhtsa_id, parseInt(year))
        if (nhtsaModels.length > 0) {
          const models = [...new Set(nhtsaModels.map(m => m.Model_Name))].sort()
          return NextResponse.json({
            models: models.map((name, index) => ({ id: index + 1, name })),
            source: 'nhtsa',
          })
        }
      } catch (e) {
        // Fall through to fallback
      }
    }
    
    // Fallback to popular models
    const normalizedMake = Object.keys(POPULAR_MODELS).find(
      m => m.toLowerCase() === makeName.toLowerCase()
    )
    
    if (normalizedMake && POPULAR_MODELS[normalizedMake]) {
      return NextResponse.json({
        models: POPULAR_MODELS[normalizedMake].map((name, index) => ({
          id: index + 1,
          name,
        })),
        source: 'fallback',
      })
    }
    
    // No models found
    return NextResponse.json({
      models: [],
      source: 'empty',
    })
  } catch (err) {
    console.error('Error fetching vehicle models:', err)
    return NextResponse.json(
      { error: 'Failed to fetch vehicle models' },
      { status: 500 }
    )
  }
}
