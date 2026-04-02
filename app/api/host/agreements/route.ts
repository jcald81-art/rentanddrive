import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Current version of the safety standards agreement
export const CURRENT_AGREEMENT_VERSION = '2026.1.0'

// GET - Check if host has signed the current agreement
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const agreementType = request.nextUrl.searchParams.get('type') || 'safety_standards'

  // Check if user has signed the current version
  const { data: agreement, error } = await supabase
    .from('host_agreements')
    .select('*')
    .eq('host_user_id', user.id)
    .eq('agreement_type', agreementType)
    .eq('document_version', CURRENT_AGREEMENT_VERSION)
    .order('signed_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    return NextResponse.json({ error: 'Failed to check agreement' }, { status: 500 })
  }

  // Also get all past agreements for records
  const { data: allAgreements } = await supabase
    .from('host_agreements')
    .select('id, agreement_type, document_version, signed_at, electronic_signature')
    .eq('host_user_id', user.id)
    .order('signed_at', { ascending: false })

  return NextResponse.json({
    hasSigned: !!agreement,
    currentVersion: CURRENT_AGREEMENT_VERSION,
    signedAgreement: agreement || null,
    allAgreements: allAgreements || []
  })
}

// POST - Sign the agreement
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { 
    agreementType = 'safety_standards',
    electronicSignature,
    checkboxesAcknowledged 
  } = body

  // Validate signature
  if (!electronicSignature || typeof electronicSignature !== 'string' || electronicSignature.trim().length < 2) {
    return NextResponse.json({ error: 'Valid electronic signature (full name) is required' }, { status: 400 })
  }

  // Check if already signed current version
  const { data: existingAgreement } = await supabase
    .from('host_agreements')
    .select('id')
    .eq('host_user_id', user.id)
    .eq('agreement_type', agreementType)
    .eq('document_version', CURRENT_AGREEMENT_VERSION)
    .limit(1)
    .single()

  if (existingAgreement) {
    return NextResponse.json({ 
      error: 'You have already signed this version of the agreement',
      alreadySigned: true 
    }, { status: 400 })
  }

  // Get request metadata
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                    headersList.get('x-real-ip') || 
                    'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  // Store the signed agreement
  const { data: newAgreement, error: insertError } = await supabase
    .from('host_agreements')
    .insert({
      host_user_id: user.id,
      agreement_type: agreementType,
      document_version: CURRENT_AGREEMENT_VERSION,
      electronic_signature: electronicSignature.trim(),
      checkboxes_acknowledged: checkboxesAcknowledged || {},
      ip_address: ipAddress,
      user_agent: userAgent
    })
    .select()
    .single()

  if (insertError) {
    console.error('Failed to store agreement:', insertError)
    return NextResponse.json({ error: 'Failed to record agreement' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    agreement: newAgreement,
    message: 'Agreement signed successfully'
  })
}
