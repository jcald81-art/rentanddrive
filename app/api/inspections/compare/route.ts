import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
    }

    // Get both inspections for booking
    const { data: inspections } = await supabase
      .from('inspections')
      .select(`
        *,
        inspection_photos(*)
      `)
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true })

    if (!inspections || inspections.length < 2) {
      return NextResponse.json({ 
        error: 'Need both pre-trip and post-trip inspections to compare' 
      }, { status: 400 })
    }

    const preTrip = inspections.find(i => i.inspection_type === 'pre_trip')
    const postTrip = inspections.find(i => i.inspection_type === 'post_trip')

    if (!preTrip || !postTrip) {
      return NextResponse.json({ 
        error: 'Both pre-trip and post-trip inspections required' 
      }, { status: 400 })
    }

    // Compare mileage
    const milesDriven = (postTrip.mileage || 0) - (preTrip.mileage || 0)

    // Compare fuel
    const fuelDifference = (postTrip.fuel_level || 0) - (preTrip.fuel_level || 0)

    // Compare damage
    const preTripDamage = preTrip.inspection_photos?.filter((p: any) => p.damage_detected) || []
    const postTripDamage = postTrip.inspection_photos?.filter((p: any) => p.damage_detected) || []

    const newDamageCount = postTripDamage.length - preTripDamage.length

    // AI comparison of photos if we have damage
    let aiComparison = null
    if (postTripDamage.length > 0 && process.env.OPENAI_API_KEY) {
      try {
        const prePhotos = preTrip.inspection_photos?.slice(0, 4) || []
        const postPhotos = postTrip.inspection_photos?.slice(0, 4) || []

        const { text } = await generateText({
          model: gateway('openai/gpt-4o'),
          messages: [
            {
              role: 'user',
              content: `Compare these vehicle inspection photos.
                       Pre-trip photos show the vehicle condition before rental.
                       Post-trip photos show condition after rental.
                       
                       Identify:
                       1. Any NEW damage that appeared during the rental
                       2. Pre-existing damage that was already present
                       3. Overall condition change
                       
                       Respond in JSON:
                       {
                         "newDamageFound": boolean,
                         "newDamageDescription": string or null,
                         "estimatedRepairCost": number or null,
                         "conditionChange": "improved" | "same" | "minor_wear" | "significant_damage",
                         "recommendation": string,
                         "chargeRenter": boolean
                       }
                       
                       Pre-trip photos: ${prePhotos.map((p: any) => p.photo_url).join(', ')}
                       Post-trip photos: ${postPhotos.map((p: any) => p.photo_url).join(', ')}`
            }
          ],
        })

        try {
          aiComparison = JSON.parse(text)
        } catch {
          aiComparison = { raw: text }
        }
      } catch (aiError) {
        console.error('AI comparison failed:', aiError)
      }
    }

    const comparison = {
      bookingId,
      preTrip: {
        id: preTrip.id,
        mileage: preTrip.mileage,
        fuelLevel: preTrip.fuel_level,
        condition: preTrip.overall_condition,
        damageScore: preTrip.overall_damage_score,
        photoCount: preTrip.inspection_photos?.length || 0,
        damageCount: preTripDamage.length,
      },
      postTrip: {
        id: postTrip.id,
        mileage: postTrip.mileage,
        fuelLevel: postTrip.fuel_level,
        condition: postTrip.overall_condition,
        damageScore: postTrip.overall_damage_score,
        photoCount: postTrip.inspection_photos?.length || 0,
        damageCount: postTripDamage.length,
      },
      differences: {
        milesDriven,
        fuelDifference,
        newDamageCount: Math.max(0, newDamageCount),
        conditionChanged: preTrip.overall_condition !== postTrip.overall_condition,
        damageScoreIncrease: (postTrip.overall_damage_score || 0) - (preTrip.overall_damage_score || 0),
      },
      aiComparison,
      recommendation: newDamageCount > 0 
        ? 'New damage detected. Review photos and consider filing a claim.'
        : 'No significant changes detected.',
    }

    return NextResponse.json({
      success: true,
      comparison,
    })
  } catch (error) {
    console.error('[Inspections Compare Error]:', error)
    return NextResponse.json(
      { error: 'Failed to compare inspections' },
      { status: 500 }
    )
  }
}
