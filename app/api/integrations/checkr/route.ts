import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckrCandidate, requestMVRReport, getMVRStatus } from '@/lib/integrations/checkr'

// POST: Initiate MVR check
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, dob, licenseNumber, licenseState } = body

    if (!firstName || !lastName || !dob || !licenseNumber || !licenseState) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get user's email from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const email = profile?.email || user.email

    // Create candidate
    const { candidateId, error: candidateError } = await createCheckrCandidate(user.id, {
      email: email || '',
      firstName,
      lastName,
      dob,
      licenseNumber,
      licenseState,
    })

    if (candidateError || !candidateId) {
      return NextResponse.json({ error: candidateError || 'Failed to create candidate' }, { status: 500 })
    }

    // Request MVR report
    const { reportId, error: reportError } = await requestMVRReport(user.id, candidateId)

    if (reportError || !reportId) {
      return NextResponse.json({ error: reportError || 'Failed to request report' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      reportId,
      message: 'MVR check initiated. Results typically available within 24 hours.',
    })
  } catch (error) {
    console.error('[v0] Checkr initiation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Get MVR status
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await getMVRStatus(user.id)

    return NextResponse.json(status)
  } catch (error) {
    console.error('[v0] Checkr status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
