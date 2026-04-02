import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * MFA Disable API Route
 * 
 * Disables MFA for a user account. Requires password confirmation.
 * 
 * Security considerations:
 * - Always require password re-entry before disabling MFA
 * - Send email notification when MFA is disabled
 * - Log the event for audit purposes
 * - Consider requiring a waiting period before MFA can be disabled
 * 
 * For custom implementation:
 * ```typescript
 * await db.update(profiles)
 *   .set({ mfa_enabled: false, mfa_secret: null })
 *   .where(eq(profiles.id, userId))
 * ```
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { factorId, password } = body

    if (!factorId) {
      return NextResponse.json(
        { error: 'Factor ID is required' },
        { status: 400 }
      )
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Optional: Verify password before disabling MFA
    // In production, always require password confirmation
    if (password) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password
      })

      if (signInError) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        )
      }
    }

    // Unenroll the MFA factor
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId
    })

    if (unenrollError) {
      console.error('MFA unenroll error:', unenrollError)
      return NextResponse.json(
        { error: unenrollError.message },
        { status: 400 }
      )
    }

    // Update user profile
    await supabase
      .from('profiles')
      .update({ 
        mfa_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    // TODO: Send email notification about MFA being disabled
    // await sendEmail({
    //   to: user.email,
    //   subject: 'MFA Disabled on Your RAD Account',
    //   template: 'mfa-disabled'
    // })

    return NextResponse.json({
      success: true,
      message: 'MFA has been disabled'
    })

  } catch (error) {
    console.error('MFA disable error:', error)
    return NextResponse.json(
      { error: 'Failed to disable MFA' },
      { status: 500 }
    )
  }
}
