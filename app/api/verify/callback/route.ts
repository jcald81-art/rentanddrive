import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripeServer } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.redirect(
      new URL('/renter/verify?error=true', request.url)
    )
  }

  try {
    const supabase = await createClient()

    // Retrieve the verification session from Stripe
    const verificationSession = await getStripeServer().identity.verificationSessions.retrieve(sessionId)

    // Find the user by verification session ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('identity_verification_session_id', sessionId)
      .single()

    if (!profile) {
      console.error('[Stripe Identity Callback] No profile found for session:', sessionId)
      return NextResponse.redirect(
        new URL('/renter/verify?error=true', request.url)
      )
    }

    // Check verification status
    if (verificationSession.status === 'verified') {
      // Mark user as verified
      await supabase
        .from('profiles')
        .update({
          identity_verified: true,
          identity_verification_status: 'verified',
          identity_verified_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      // Create notification
      await supabase.from('notifications').insert({
        user_id: profile.id,
        type: 'identity_verified',
        title: 'Identity Verified!',
        message: 'Your identity has been verified. You can now book any vehicle on Rent and Drive.',
      })

      return NextResponse.redirect(
        new URL('/renter/verify?verified=true', request.url)
      )
    } else if (verificationSession.status === 'requires_input') {
      // User needs to provide additional information
      await supabase
        .from('profiles')
        .update({
          identity_verification_status: 'requires_input',
        })
        .eq('id', profile.id)

      return NextResponse.redirect(
        new URL('/renter/verify?error=true&reason=requires_input', request.url)
      )
    } else {
      // Processing or other status
      await supabase
        .from('profiles')
        .update({
          identity_verification_status: verificationSession.status,
        })
        .eq('id', profile.id)

      // Redirect back to verify page - webhook will handle final status
      return NextResponse.redirect(
        new URL('/renter/verify', request.url)
      )
    }

    /* 
    // STUB for testing without Stripe:
    // Simulate successful verification
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('identity_verification_session_id', sessionId)
      .single()

    if (profile) {
      await supabase
        .from('profiles')
        .update({
          identity_verified: true,
          identity_verification_status: 'verified',
          identity_verified_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      return NextResponse.redirect(
        new URL('/renter/verify?verified=true', request.url)
      )
    }

    return NextResponse.redirect(
      new URL('/renter/verify?error=true', request.url)
    )
    */
  } catch (error) {
    console.error('[Stripe Identity Callback] Error:', error)
    return NextResponse.redirect(
      new URL('/renter/verify?error=true', request.url)
    )
  }
}
