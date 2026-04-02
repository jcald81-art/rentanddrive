import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

const DAILY_LIMIT = 3

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { vehicleId, photoUrls = [] } = body

    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID required' }, { status: 400 })
    }

    // Fetch vehicle data
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .eq('host_id', user.id)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: 'Vehicle not found or access denied' }, { status: 404 })
    }

    // Check daily generation limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count: todayCount } = await supabase
      .from('ai_description_generations')
      .select('*', { count: 'exact', head: true })
      .eq('vehicle_id', vehicleId)
      .gte('created_at', today.toISOString())

    if ((todayCount || 0) >= DAILY_LIMIT) {
      return NextResponse.json({ 
        error: `Daily limit reached. You can generate up to ${DAILY_LIMIT} descriptions per vehicle per day.`,
        remainingGenerations: 0
      }, { status: 429 })
    }

    // Build the prompt with all available vehicle data
    const vehicleInfo = {
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      color: vehicle.color || vehicle.exterior_color,
      mileage: vehicle.mileage,
      transmission: vehicle.transmission,
      fuelType: vehicle.fuel_type,
      drivetrain: vehicle.drivetrain,
      seats: vehicle.seats || vehicle.passenger_count,
      features: vehicle.features || [],
      vin: vehicle.vin,
      // Inspektlabs data if available
      inspektlabsCertified: vehicle.inspektlabs_certified,
      recallStatus: vehicle.recall_status,
      // Location context
      location: vehicle.location || vehicle.city,
    }

    const photoContext = photoUrls.length > 0 
      ? `The vehicle has ${photoUrls.length} photos uploaded showing its condition.`
      : ''

    const prompt = `You are a professional automotive copywriter for RAD (Rent and Drive), a premium peer-to-peer car rental platform in Reno, Nevada.

Write a compelling, SEO-optimized vehicle listing description for this vehicle:

**Vehicle Details:**
- Year: ${vehicleInfo.year}
- Make: ${vehicleInfo.make}
- Model: ${vehicleInfo.model}
${vehicleInfo.trim ? `- Trim: ${vehicleInfo.trim}` : ''}
${vehicleInfo.color ? `- Color: ${vehicleInfo.color}` : ''}
${vehicleInfo.mileage ? `- Mileage: ${vehicleInfo.mileage.toLocaleString()} miles` : ''}
${vehicleInfo.transmission ? `- Transmission: ${vehicleInfo.transmission}` : ''}
${vehicleInfo.fuelType ? `- Fuel Type: ${vehicleInfo.fuelType}` : ''}
${vehicleInfo.drivetrain ? `- Drivetrain: ${vehicleInfo.drivetrain}` : ''}
${vehicleInfo.seats ? `- Seats: ${vehicleInfo.seats}` : ''}
${vehicleInfo.features?.length > 0 ? `- Features: ${vehicleInfo.features.join(', ')}` : ''}
${vehicleInfo.inspektlabsCertified ? '- Inspektlabs Certified: Yes (verified vehicle condition)' : ''}
${vehicleInfo.recallStatus === 'clear' ? '- Recall Status: No open recalls' : ''}
${vehicleInfo.location ? `- Location: ${vehicleInfo.location}` : ''}
${photoContext}

**Requirements:**
1. Write 2-3 engaging paragraphs (150-250 words total)
2. Highlight key features and what makes this vehicle special
3. Mention ideal use cases (road trips, business travel, family outings, etc.)
4. Include a warm, inviting tone that builds trust
5. If Inspektlabs certified, mention the peace of mind this provides
6. Reference Reno/Lake Tahoe area activities if appropriate
7. End with a subtle call-to-action

Do NOT include:
- The vehicle's exact price
- Made-up features not listed above
- Excessive superlatives or hype
- Any markdown formatting

Return ONLY the description text, nothing else.`

    // Generate description using AI
    const { text: generatedDescription } = await generateText({
      model: gateway('openai/gpt-4o-mini'),
      prompt,
      maxTokens: 500,
      temperature: 0.7,
    })

    // Log the generation
    await supabase
      .from('ai_description_generations')
      .insert({
        vehicle_id: vehicleId,
        host_user_id: user.id,
        generated_description: generatedDescription,
        generation_metadata: {
          photoCount: photoUrls.length,
          vehicleInfo,
          model: 'openai/gpt-4o-mini',
        }
      })

    // Log to audit_logs
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'ai_description_generated',
        entity_type: 'vehicle',
        entity_id: vehicleId,
        metadata: {
          descriptionLength: generatedDescription.length,
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
      })

    return NextResponse.json({
      description: generatedDescription,
      remainingGenerations: DAILY_LIMIT - (todayCount || 0) - 1,
    })

  } catch (error) {
    console.error('Error generating description:', error)
    return NextResponse.json({ 
      error: 'Failed to generate description. Please try again.' 
    }, { status: 500 })
  }
}

// GET endpoint to check remaining generations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')

    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID required' }, { status: 400 })
    }

    // Check today's count
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count: todayCount } = await supabase
      .from('ai_description_generations')
      .select('*', { count: 'exact', head: true })
      .eq('vehicle_id', vehicleId)
      .gte('created_at', today.toISOString())

    return NextResponse.json({
      remainingGenerations: DAILY_LIMIT - (todayCount || 0),
      dailyLimit: DAILY_LIMIT,
    })

  } catch (error) {
    console.error('Error checking generations:', error)
    return NextResponse.json({ error: 'Failed to check generations' }, { status: 500 })
  }
}
