/**
 * Turo Import Assistant
 * Parses Turo listing URLs and extracts vehicle data for RAD platform import
 */

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface TuroListingData {
  turoUrl: string
  turoListingId: string | null
  make: string | null
  model: string | null
  year: number | null
  vin: string | null
  description: string | null
  dailyRate: number | null
  photos: string[]
  features: string[]
  location: {
    city?: string
    state?: string
    zipCode?: string
    lat?: number
    lng?: number
  }
  hostName: string | null
  rating: number | null
  tripCount: number | null
  instantBook: boolean
  deliveryAvailable: boolean
}

export interface TuroImportResult {
  success: boolean
  importId: string | null
  data: TuroListingData | null
  aiEnhancements: {
    suggestedRate: number | null
    enhancedDescription: string | null
    detectedEV: boolean
    detectedMake: string | null
    detectedModel: string | null
  } | null
  error: string | null
}

// Extract Turo listing ID from URL
export function extractTuroListingId(url: string): string | null {
  try {
    // Turo URLs look like: https://turo.com/us/en/car-rental/united-states/los-angeles-ca/tesla/model-3/1234567
    // Or: https://turo.com/rentals/1234567
    const patterns = [
      /turo\.com\/.*\/(\d+)$/,
      /turo\.com\/rentals\/(\d+)/,
      /turo\.com\/.*car-rental\/.*\/(\d+)/,
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  } catch {
    return null
  }
}

// Validate Turo URL format
export function isValidTuroUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.hostname === 'turo.com' || parsed.hostname === 'www.turo.com'
  } catch {
    return false
  }
}

// Parse Turo listing page HTML (simulated - in production would use web scraping service)
export async function parseTuroListing(url: string): Promise<TuroListingData> {
  const listingId = extractTuroListingId(url)
  
  // In production, this would use a web scraping service like Browserless, Puppeteer Cloud, or similar
  // For now, we'll return a structure that the AI can enhance based on the URL patterns
  
  // Extract make/model from URL patterns
  const urlParts = url.toLowerCase().split('/')
  let detectedMake: string | null = null
  let detectedModel: string | null = null
  let detectedYear: number | null = null
  
  // Common makes to detect in URL
  const makes = ['tesla', 'bmw', 'mercedes', 'audi', 'porsche', 'lexus', 'toyota', 'honda', 'ford', 'chevrolet', 'jeep', 'range-rover', 'land-rover', 'lamborghini', 'ferrari', 'maserati', 'bentley', 'rolls-royce', 'cadillac', 'lincoln', 'infiniti', 'acura', 'hyundai', 'kia', 'mazda', 'subaru', 'volkswagen', 'volvo', 'nissan', 'dodge', 'ram', 'gmc', 'buick', 'chrysler', 'mini', 'fiat', 'alfa-romeo', 'genesis', 'rivian', 'lucid', 'polestar']
  
  for (const make of makes) {
    if (urlParts.some(part => part.includes(make))) {
      detectedMake = make.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      break
    }
  }
  
  // Common models to detect
  const models = ['model-3', 'model-y', 'model-s', 'model-x', 'cybertruck', 'mustang', 'camaro', 'corvette', 'wrangler', 'grand-cherokee', '4runner', 'rav4', 'civic', 'accord', 'camry', 'highlander', 'pilot', 'cr-v', 'explorer', 'f-150', 'bronco', 'tacoma', 'tundra', 'silverado', 'tahoe', 'suburban', 'escalade', 'navigator', 'g-wagon', 'g-class', 'range-rover-sport', 'defender', '911', 'cayenne', 'macan', 'r8', 'a4', 'a6', 'q5', 'q7', 'x3', 'x5', 'x7', 'm3', 'm4', 'm5', 'c-class', 'e-class', 's-class', 'gle', 'gls', 'amg-gt']
  
  for (const model of models) {
    if (urlParts.some(part => part.includes(model))) {
      detectedModel = model.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      break
    }
  }
  
  // Detect year from URL (4 digits between 2010-2030)
  const yearMatch = url.match(/\b(20[1-3]\d)\b/)
  if (yearMatch) {
    detectedYear = parseInt(yearMatch[1])
  }
  
  // Detect location from URL
  const locationMatch = url.match(/car-rental\/[^/]+\/([^/]+)-([a-z]{2})\//i)
  let city: string | undefined
  let state: string | undefined
  
  if (locationMatch) {
    city = locationMatch[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    state = locationMatch[2].toUpperCase()
  }
  
  // Detect if it's an EV
  const evMakes = ['tesla', 'rivian', 'lucid', 'polestar']
  const evModels = ['model-3', 'model-y', 'model-s', 'model-x', 'cybertruck', 'mach-e', 'ioniq', 'ev6', 'id.4', 'leaf', 'bolt']
  const isEV = evMakes.some(m => url.toLowerCase().includes(m)) || 
               evModels.some(m => url.toLowerCase().includes(m))

  return {
    turoUrl: url,
    turoListingId: listingId,
    make: detectedMake,
    model: detectedModel,
    year: detectedYear,
    vin: null, // Would need to be scraped
    description: null, // Would need to be scraped
    dailyRate: null, // Would need to be scraped
    photos: [], // Would need to be scraped
    features: [], // Would need to be scraped
    location: {
      city,
      state,
    },
    hostName: null,
    rating: null,
    tripCount: null,
    instantBook: false,
    deliveryAvailable: isEV, // EVs often have delivery
  }
}

// Use AI to enhance parsed data and fill in gaps
export async function enhanceWithAI(
  parsedData: TuroListingData,
  userDescription?: string
): Promise<TuroImportResult['aiEnhancements']> {
  try {
    // In production, this would call the Groq/OpenAI API
    // For now, we'll use heuristics
    
    const isEV = ['Tesla', 'Rivian', 'Lucid', 'Polestar'].includes(parsedData.make || '')
    const isLuxury = ['BMW', 'Mercedes', 'Audi', 'Porsche', 'Lexus', 'Range Rover', 'Land Rover', 'Lamborghini', 'Ferrari', 'Maserati', 'Bentley', 'Rolls Royce', 'Cadillac', 'Lincoln', 'Genesis'].includes(parsedData.make || '')
    const isSUV = ['Wrangler', 'Grand Cherokee', '4runner', 'Rav4', 'Highlander', 'Pilot', 'Cr V', 'Explorer', 'Bronco', 'Tacoma', 'Tahoe', 'Suburban', 'Escalade', 'Navigator', 'Range Rover Sport', 'Defender', 'Cayenne', 'Macan', 'X3', 'X5', 'X7', 'Q5', 'Q7', 'Gle', 'Gls'].some(m => parsedData.model?.includes(m))
    
    // Suggest competitive daily rate
    let suggestedRate = 50 // Base rate
    if (isEV) suggestedRate += 30
    if (isLuxury) suggestedRate += 50
    if (isSUV) suggestedRate += 20
    if (parsedData.year && parsedData.year >= 2022) suggestedRate += 15
    if (parsedData.year && parsedData.year >= 2024) suggestedRate += 10
    
    // Generate enhanced description
    let enhancedDescription = ''
    if (parsedData.make && parsedData.model) {
      enhancedDescription = `Experience the ${parsedData.year || 'latest'} ${parsedData.make} ${parsedData.model}`
      if (isEV) {
        enhancedDescription += ' - a premium electric vehicle with cutting-edge technology. Enjoy zero emissions, instant acceleration, and the latest in automotive innovation.'
      } else if (isLuxury) {
        enhancedDescription += ' - a refined luxury vehicle with premium amenities. Indulge in sophisticated comfort and exceptional performance.'
      } else if (isSUV) {
        enhancedDescription += ' - a versatile SUV perfect for any adventure. Spacious interior, powerful performance, and go-anywhere capability.'
      } else {
        enhancedDescription += ' - a reliable and well-maintained vehicle ready for your next journey.'
      }
      
      if (parsedData.location.city) {
        enhancedDescription += ` Conveniently located in ${parsedData.location.city}${parsedData.location.state ? `, ${parsedData.location.state}` : ''}.`
      }
    }
    
    return {
      suggestedRate: suggestedRate * 100, // Convert to cents
      enhancedDescription,
      detectedEV: isEV,
      detectedMake: parsedData.make,
      detectedModel: parsedData.model,
    }
  } catch (error) {
    console.error('AI enhancement error:', error)
    return null
  }
}

// Create import record and start parsing
export async function startTuroImport(
  hostId: string,
  turoUrl: string
): Promise<TuroImportResult> {
  try {
    // Validate URL
    if (!isValidTuroUrl(turoUrl)) {
      return {
        success: false,
        importId: null,
        data: null,
        aiEnhancements: null,
        error: 'Invalid Turo URL. Please provide a valid turo.com listing URL.',
      }
    }
    
    // Create import record
    const { data: importRecord, error: insertError } = await supabaseAdmin
      .from('turo_imports')
      .insert({
        host_id: hostId,
        turo_url: turoUrl,
        turo_listing_id: extractTuroListingId(turoUrl),
        import_status: 'parsing',
      })
      .select()
      .single()
    
    if (insertError || !importRecord) {
      throw new Error(`Failed to create import record: ${insertError?.message}`)
    }
    
    // Parse listing
    const parsedData = await parseTuroListing(turoUrl)
    
    // Enhance with AI
    const aiEnhancements = await enhanceWithAI(parsedData)
    
    // Update import record with parsed data
    const { error: updateError } = await supabaseAdmin
      .from('turo_imports')
      .update({
        import_status: 'preview',
        parsed_make: parsedData.make,
        parsed_model: parsedData.model,
        parsed_year: parsedData.year,
        parsed_vin: parsedData.vin,
        parsed_description: parsedData.description,
        parsed_daily_rate: parsedData.dailyRate,
        parsed_photos: parsedData.photos,
        parsed_features: parsedData.features,
        parsed_location: parsedData.location,
        ai_suggested_rate: aiEnhancements?.suggestedRate,
        ai_enhanced_description: aiEnhancements?.enhancedDescription,
        ai_detected_ev: aiEnhancements?.detectedEV,
        ai_detected_make: aiEnhancements?.detectedMake,
        ai_detected_model: aiEnhancements?.detectedModel,
        ai_metadata: aiEnhancements,
        updated_at: new Date().toISOString(),
      })
      .eq('id', importRecord.id)
    
    if (updateError) {
      throw new Error(`Failed to update import record: ${updateError.message}`)
    }
    
    return {
      success: true,
      importId: importRecord.id,
      data: parsedData,
      aiEnhancements,
      error: null,
    }
  } catch (error) {
    console.error('Turo import error:', error)
    return {
      success: false,
      importId: null,
      data: null,
      aiEnhancements: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// Complete import by creating vehicle record
export async function completeTuroImport(
  importId: string,
  hostId: string,
  vehicleData: {
    make: string
    model: string
    year: number
    vin?: string
    description: string
    dailyRate: number // in cents
    photos: string[]
    features: string[]
    location: {
      city?: string
      state?: string
      zipCode?: string
      lat?: number
      lng?: number
    }
    enableDelivery?: boolean
    enableSmartcar?: boolean
    enableBlockchain?: boolean
  }
): Promise<{ success: boolean; vehicleId: string | null; error: string | null }> {
  try {
    // Update import status
    await supabaseAdmin
      .from('turo_imports')
      .update({
        import_status: 'importing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', importId)
    
    // Create vehicle record
    const { data: vehicle, error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .insert({
        host_id: hostId,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        vin: vehicleData.vin,
        description: vehicleData.description,
        daily_rate: vehicleData.dailyRate,
        images: vehicleData.photos,
        features: vehicleData.features,
        location_city: vehicleData.location.city,
        location_state: vehicleData.location.state,
        location_zip: vehicleData.location.zipCode,
        location_lat: vehicleData.location.lat,
        location_lng: vehicleData.location.lng,
        status: 'active',
        listing_status: 'draft',
        import_source: 'turo',
        turo_import_id: importId,
        imported_at: new Date().toISOString(),
        delivery_enabled: vehicleData.enableDelivery || false,
        is_ev: ['Tesla', 'Rivian', 'Lucid', 'Polestar'].includes(vehicleData.make),
      })
      .select()
      .single()
    
    if (vehicleError || !vehicle) {
      throw new Error(`Failed to create vehicle: ${vehicleError?.message}`)
    }
    
    // Update import record with vehicle reference
    await supabaseAdmin
      .from('turo_imports')
      .update({
        vehicle_id: vehicle.id,
        import_status: 'completed',
        smartcar_prompted: vehicleData.enableSmartcar || false,
        blockchain_minted: vehicleData.enableBlockchain || false,
        delivery_enabled: vehicleData.enableDelivery || false,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', importId)
    
    return {
      success: true,
      vehicleId: vehicle.id,
      error: null,
    }
  } catch (error) {
    // Mark import as failed
    await supabaseAdmin
      .from('turo_imports')
      .update({
        import_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString(),
      })
      .eq('id', importId)
    
    return {
      success: false,
      vehicleId: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// Get import status and data
export async function getTuroImport(importId: string, hostId: string) {
  const { data, error } = await supabaseAdmin
    .from('turo_imports')
    .select('*')
    .eq('id', importId)
    .eq('host_id', hostId)
    .single()
  
  if (error) {
    return { success: false, data: null, error: error.message }
  }
  
  return { success: true, data, error: null }
}
