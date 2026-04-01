import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getModelsForMakeYear } from '@/integrations/nhtsa'

export const dynamic = 'force-dynamic'

/**
 * Hardcoded popular models per make for fallback
 */
const POPULAR_MODELS: Record<string, string[]> = {
  // Cars
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
  // Motorcycles
  'Harley-Davidson': ['Sportster', 'Street Glide', 'Road King', 'Fat Boy', 'Iron 883', 'Road Glide', 'Softail', 'Electra Glide', 'Heritage Classic', 'Pan America'],
  'Yamaha': ['YZF-R1', 'YZF-R6', 'MT-07', 'MT-09', 'V-Star', 'Bolt', 'Tenere 700', 'Tracer 900', 'FZ-09', 'XSR900'],
  'Kawasaki': ['Ninja ZX-6R', 'Ninja ZX-10R', 'Ninja 400', 'Z900', 'Z650', 'Vulcan', 'Versys', 'KLR 650', 'Ninja H2', 'W800'],
  'Suzuki': ['GSX-R600', 'GSX-R750', 'GSX-R1000', 'Hayabusa', 'V-Strom', 'SV650', 'Boulevard', 'DR-Z400', 'Katana', 'GSX-S1000'],
  'Ducati': ['Panigale V4', 'Monster', 'Scrambler', 'Multistrada', 'Diavel', 'Streetfighter', 'Hypermotard', 'SuperSport', 'DesertX', 'XDiavel'],
  'Triumph': ['Bonneville', 'Street Triple', 'Tiger', 'Trident', 'Speed Triple', 'Rocket 3', 'Scrambler', 'Thruxton', 'Daytona', 'Street Twin'],
  'Indian': ['Scout', 'Chief', 'Chieftain', 'Challenger', 'Pursuit', 'Springfield', 'Roadmaster', 'FTR', 'Super Chief', 'Scout Bobber'],
  'KTM': ['Duke 390', 'Duke 790', 'Duke 890', 'RC 390', '1290 Super Duke', 'Adventure 890', 'Adventure 1290', '390 Adventure', 'EXC', 'SMC R'],
  'Aprilia': ['RSV4', 'Tuono', 'RS 660', 'Tuareg 660', 'Dorsoduro', 'Shiver', 'RS 125', 'SX 125', 'RX 125'],
  'Can-Am': ['Spyder F3', 'Spyder RT', 'Ryker', 'Ryker Sport', 'Ryker Rally'],
  'Polaris': ['Slingshot', 'Slingshot R', 'Slingshot SL'],
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
