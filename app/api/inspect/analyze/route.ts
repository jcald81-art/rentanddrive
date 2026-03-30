import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { gateway } from '@ai-sdk/gateway'

const CARTEGRITY_PROMPT = (angle: string) => `You are Cartegrity AI, a vehicle inspection system. Analyze this photo of the ${angle} of a vehicle. Identify any damage, scratches, dents, chips, stains, or wear. Return JSON only: {"damage_detected": boolean, "damage_severity": "none" | "minor" | "moderate" | "severe", "damage_description": string under 20 words, "confidence_score": number 0-100}`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      inspectionId,
      photo, // base64 image
      angle,
    } = await request.json()

    if (!photo || !angle) {
      return NextResponse.json({ error: 'Missing photo or angle' }, { status: 400 })
    }

    let analysis = {
      damage_detected: false,
      damage_severity: 'none' as 'none' | 'minor' | 'moderate' | 'severe',
      damage_description: '',
      confidence_score: 0,
    }

    // Try Gemini first (primary)
    try {
      const { text } = await generateText({
        model: gateway('google/gemini-2.0-flash'),
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: CARTEGRITY_PROMPT(angle) },
              { type: 'image', image: photo },
            ],
          },
        ],
      })

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        analysis = {
          damage_detected: Boolean(parsed.damage_detected),
          damage_severity: parsed.damage_severity || 'none',
          damage_description: String(parsed.damage_description || '').slice(0, 100),
          confidence_score: Number(parsed.confidence_score) || 85,
        }
      }
    } catch (geminiError) {
      console.error('[Cartegrity] Gemini failed, trying Claude:', geminiError)
      
      // Fallback to Claude
      try {
        const { text } = await generateText({
          model: gateway('anthropic/claude-sonnet-4-6'),
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: CARTEGRITY_PROMPT(angle) },
                { type: 'image', image: photo },
              ],
            },
          ],
        })

        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          analysis = {
            damage_detected: Boolean(parsed.damage_detected),
            damage_severity: parsed.damage_severity || 'none',
            damage_description: String(parsed.damage_description || '').slice(0, 100),
            confidence_score: Number(parsed.confidence_score) || 80,
          }
        }
      } catch (claudeError) {
        console.error('[Cartegrity] Claude also failed:', claudeError)
        // Return default no-damage analysis
        analysis = {
          damage_detected: false,
          damage_severity: 'none',
          damage_description: 'AI analysis unavailable',
          confidence_score: 0,
        }
      }
    }

    // Save to inspection_photos if inspectionId provided
    if (inspectionId) {
      try {
        await supabase
          .from('inspection_photos')
          .insert({
            inspection_id: inspectionId,
            photo_url: photo.slice(0, 100) + '...', // Store truncated reference
            photo_type: angle,
            ai_analysis: analysis,
            damage_detected: analysis.damage_detected,
            damage_description: analysis.damage_description,
            severity_score: analysis.damage_severity === 'severe' ? 9 : 
                           analysis.damage_severity === 'moderate' ? 6 :
                           analysis.damage_severity === 'minor' ? 3 : 0,
          })
      } catch (dbError) {
        console.error('[Cartegrity] DB save failed:', dbError)
        // Continue without saving - photo still analyzed
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      angle,
    })
  } catch (error) {
    console.error('[Cartegrity Analyze Error]:', error)
    return NextResponse.json(
      { error: 'Failed to analyze photo' },
      { status: 500 }
    )
  }
}
