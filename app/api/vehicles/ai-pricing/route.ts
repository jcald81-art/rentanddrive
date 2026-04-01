import { NextRequest, NextResponse } from 'next/server'
import { aiGenerate, SYSTEM_PROMPTS } from '@/integrations/ai-router'

export const dynamic = 'force-dynamic'

/**
 * POST /api/vehicles/ai-pricing
 * 
 * Uses multi-LLM router (Grok-first) to generate recommended daily rate
 * based on vehicle details and Reno/Tahoe market conditions.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { make, model, year, category, vehicleType, location, mileage, features, description, driveType, trim } = body

    if (!make || !model || !year) {
      return NextResponse.json(
        { error: 'Missing required vehicle information' },
        { status: 400 }
      )
    }

    // Build market context prompt
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' })
    const currentYear = new Date().getFullYear()
    
    // Build features string
    const featuresStr = features && features.length > 0 
      ? features.join(', ')
      : 'None specified'

    // Build vehicle details with all available info
    const vehicleAge = currentYear - parseInt(year)
    
    const prompt = `
Analyze and recommend an optimal daily rental rate for this vehicle:

VEHICLE DETAILS:
- Make: ${make}
- Model: ${model}
- Year: ${year} (${vehicleAge} years old)
- Trim: ${trim || 'Not specified'}
- Category: ${category || 'Unknown'}
- Type: ${vehicleType || 'car'}
- Drivetrain: ${driveType || 'Not specified'}
- Mileage: ${mileage ? `${mileage.toLocaleString()} miles` : 'Not specified'}
- Location: ${location || 'Reno, NV'}

VEHICLE FEATURES:
${featuresStr}

OWNER'S DESCRIPTION:
${description || 'No description provided'}

MARKET CONTEXT (${currentMonth} ${currentYear}):
- Reno-Tahoe International Airport sees 4+ million passengers/year
- Lake Tahoe is 45 minutes away (ski season Nov-Apr, summer peak Jun-Aug)
- Major events: Hot August Nights, Reno Air Races, ski season weekends
- Competitor platforms: Turo, Getaround, traditional rental agencies
- Premium features like ski racks, snow tires, AWD/4WD command higher rates in Tahoe area

PRICING FACTORS TO CONSIDER:
1. Vehicle age and mileage (higher mileage = lower rate)
2. Category demand (SUVs premium for Tahoe trips, economy for airport runs)
3. Current seasonal demand
4. Premium features (ski rack, leather, premium audio add $5-15/day)
5. AWD/4WD vehicles command 10-20% premium in Tahoe market
6. Similar vehicle rates on Turo/Getaround ($40-200/day range)
7. Local market (Reno is value-conscious but tourists pay premium)
8. Owner's description quality and highlighted features

RESPOND WITH ONLY A JSON OBJECT in this exact format:
{
  "recommendedRate": <number between 35 and 300>,
  "confidence": "<high|medium|low>",
  "reasoning": "<1-2 sentence explanation mentioning key factors like features, location, demand>",
  "marketRange": {
    "low": <number>,
    "high": <number>
  }
}

Be realistic and data-backed. Economy cars: $35-55, mid-range: $50-80, SUVs: $65-120, luxury/sports: $100-250+.
Adjust based on mileage, features, and description quality.
`

    const response = await aiGenerate({
      task: 'pricing',
      system: SYSTEM_PROMPTS.pricing,
      prompt,
      preferred: 'grok',
      temperature: 0.3, // Lower temp for more consistent pricing
      maxTokens: 300,
    })

    // Parse the JSON response
    let pricingData
    try {
      // Extract JSON from response (handles markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        pricingData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('[AI Pricing] Failed to parse response:', response)
      // Fallback pricing based on category
      const fallbackRates: Record<string, number> = {
        sedan: 55,
        suv: 85,
        truck: 75,
        coupe: 65,
        convertible: 95,
        van: 80,
        wagon: 60,
        rv: 150,
        atv: 100,
        cruiser: 75,
        sportbike: 85,
        touring: 95,
        adventure: 90,
        standard: 65,
        scooter: 45,
      }
      pricingData = {
        recommendedRate: fallbackRates[category?.toLowerCase()] || 65,
        confidence: 'medium',
        reasoning: 'Based on category average for Reno market',
        marketRange: { low: 45, high: 120 }
      }
    }

    // Validate and clamp the rate
    const rate = Math.min(300, Math.max(35, Math.round(pricingData.recommendedRate)))

    return NextResponse.json({
      recommendedRate: rate,
      confidence: pricingData.confidence || 'medium',
      reasoning: pricingData.reasoning || 'Based on market analysis',
      marketRange: pricingData.marketRange || { low: rate - 15, high: rate + 25 },
      model: 'grok-3',
    })

  } catch (err) {
    console.error('[AI Pricing] Error:', err)
    
    // Return a reasonable fallback
    return NextResponse.json({
      recommendedRate: 65,
      confidence: 'low',
      reasoning: 'Default rate - AI service temporarily unavailable',
      marketRange: { low: 45, high: 100 },
      error: 'AI service error, using fallback rate'
    })
  }
}
