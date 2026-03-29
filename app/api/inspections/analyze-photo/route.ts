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

    const { 
      inspectionId,
      photoUrl,
      photoType, // 'front', 'rear', 'left', 'right', 'interior', 'dashboard', 'trunk', 'damage'
      orderIndex,
    } = await request.json()

    if (!inspectionId || !photoUrl || !photoType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify inspection exists
    const { data: inspection } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', inspectionId)
      .single()

    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    }

    // Analyze photo with AI
    let analysis = null
    let damageDetected = false
    let damageDescription = null
    let severityScore = 0

    try {
      const { text } = await generateText({
        model: gateway('openai/gpt-4o'),
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this vehicle inspection photo (${photoType} view). 
                       Identify any damage, scratches, dents, or issues visible.
                       Respond in JSON format:
                       {
                         "damageDetected": boolean,
                         "damageDescription": string or null,
                         "severityScore": number 0-10 (0=perfect, 10=severe damage),
                         "issues": string[] (list of specific issues found),
                         "condition": "excellent" | "good" | "fair" | "poor",
                         "notes": string
                       }`
              },
              {
                type: 'image',
                image: photoUrl,
              }
            ],
          },
        ],
      })

      try {
        analysis = JSON.parse(text)
        damageDetected = analysis.damageDetected
        damageDescription = analysis.damageDescription
        severityScore = analysis.severityScore
      } catch {
        analysis = { raw: text }
      }
    } catch (aiError) {
      console.error('AI analysis failed:', aiError)
      // Continue without AI analysis
    }

    // Save photo to inspection
    const { data: photo, error: photoError } = await supabase
      .from('inspection_photos')
      .insert({
        inspection_id: inspectionId,
        photo_url: photoUrl,
        photo_type: photoType,
        order_index: orderIndex || 0,
        ai_analysis: analysis,
        damage_detected: damageDetected,
        damage_description: damageDescription,
        severity_score: severityScore,
      })
      .select()
      .single()

    if (photoError) throw photoError

    return NextResponse.json({
      success: true,
      photo: {
        id: photo.id,
        photoType,
        analysis,
        damageDetected,
        severityScore,
      },
    })
  } catch (error) {
    console.error('[Inspections Analyze Photo Error]:', error)
    return NextResponse.json(
      { error: 'Failed to analyze photo' },
      { status: 500 }
    )
  }
}
