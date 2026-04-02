import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCanopySession, getInsuranceStatus, completeMockCanopySession } from '@/lib/integrations/canopy'

// POST: Create Canopy session for insurance verification
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { returnUrl } = body

    if (!returnUrl) {
      return NextResponse.json({ error: 'Return URL is required' }, { status: 400 })
    }

    const { sessionUrl, sessionId, error } = await createCanopySession(user.id, returnUrl)

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sessionUrl,
      sessionId,
    })
  } catch (error) {
    console.error('[v0] Canopy session creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Get insurance verification status
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await getInsuranceStatus(user.id)

    return NextResponse.json(status)
  } catch (error) {
    console.error('[v0] Canopy status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Complete mock session (for development)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId } = body

    if (!sessionId?.startsWith('mock_')) {
      return NextResponse.json({ error: 'Only mock sessions can be completed this way' }, { status: 400 })
    }

    await completeMockCanopySession(sessionId, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Canopy mock completion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
