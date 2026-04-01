import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripeServer } from '@/lib/stripe'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has a pending or completed verification
    const { data: profile } = await supabase
      .from('profiles')
      .select('identity_verified, identity_verification_session_id')
      .eq('id', user.id)
      .single()

    if (profile?.identity_verified) {
      return NextResponse.json({ error: 'Already verified' }, { status: 400 })
    }

    // Create Stripe Identity VerificationSession
    // Real implementation:
    const verificationSession = await getStripeServer().identity.verificationSessions.create({
      type: 'document',
      options: {
        document: {
          require_matching_selfie: true,
        },
      },
      metadata: {
        user_id: user.id,
        email: user.email || '',
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'}/api/verify/callback`,
    })

    // Store the session ID in the user's profile
    await supabase
      .from('profiles')
      .update({
        identity_verification_session_id: verificationSession.id,
        identity_verification_status: 'pending',
      })
      .eq('id', user.id)

    return NextResponse.json({
      url: verificationSession.url,
      session_id: verificationSession.id,
    })

    /* 
    // STUB for testing without Stripe Identity:
    const fakeSessionId = `vs_${Date.now()}_${user.id.slice(0, 8)}`
    
    await supabase
      .from('profiles')
      .update({
        identity_verification_session_id: fakeSessionId,
        identity_verification_status: 'pending',
      })
      .eq('id', user.id)

    return NextResponse.json({
      url: `/api/verify/callback?session_id=${fakeSessionId}`,
      session_id: fakeSessionId,
    })
    */
  } catch (error) {
    console.error('[Stripe Identity] Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create verification session' },
      { status: 500 }
    )
  }
}
