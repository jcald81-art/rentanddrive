import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AIPersona } from '@/lib/ai-personas'

// GET - Fetch host's current AI persona preference
export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ persona: 'RAD' }) // Default for non-authenticated
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('ai_persona')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ 
      persona: (profile?.ai_persona as AIPersona) || 'RAD',
      userId: user.id
    })
  } catch (error) {
    console.error('[AI Persona] Error fetching preference:', error)
    return NextResponse.json({ persona: 'RAD' })
  }
}

// POST - Update host's AI persona preference
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { persona }: { persona: AIPersona } = await req.json()
    
    // Validate persona
    if (!['R&D', 'RAD'].includes(persona)) {
      return NextResponse.json({ error: 'Invalid persona' }, { status: 400 })
    }

    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update({ ai_persona: persona })
      .eq('id', user.id)

    if (error) {
      console.error('[AI Persona] Error updating:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    // Log the change for analytics
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'ai_persona_changed',
      details: { old_persona: null, new_persona: persona },
    }).catch(() => {}) // Non-critical, don't fail

    return NextResponse.json({ 
      success: true, 
      persona,
      message: persona === 'RAD' 
        ? "Sweet! You're now cruisin' with RAD 🏄" 
        : "Welcome to the beta squad! R&D activated 🔬"
    })
  } catch (error) {
    console.error('[AI Persona] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
