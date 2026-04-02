import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * MFA Verify API Route
 * 
 * Verifies a TOTP code during MFA enrollment or login challenge.
 * 
 * For custom TOTP implementation (without Supabase):
 * ```typescript
 * import { authenticator } from 'otplib'
 * 
 * // Verify a TOTP code
 * const isValid = authenticator.verify({
 *   token: code,
 *   secret: userMfaSecret // stored in database
 * })
 * ```
 * 
 * Database schema for custom implementation:
 * ```sql
 * ALTER TABLE profiles ADD COLUMN mfa_enabled BOOLEAN DEFAULT false;
 * ALTER TABLE profiles ADD COLUMN mfa_secret TEXT;
 * ALTER TABLE profiles ADD COLUMN mfa_backup_codes JSONB DEFAULT '[]';
 * ```
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { factorId, code } = body

    if (!factorId || !code) {
      return NextResponse.json(
        { error: 'Factor ID and verification code are required' },
        { status: 400 }
      )
    }

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      return NextResponse.json(
        { error: 'Code must be 6 digits' },
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

    // Create a challenge for the factor
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId
    })

    if (challengeError) {
      console.error('MFA challenge error:', challengeError)
      return NextResponse.json(
        { error: challengeError.message },
        { status: 400 }
      )
    }

    // Verify the code
    const { data, error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code
    })

    if (verifyError) {
      console.error('MFA verify error:', verifyError)
      return NextResponse.json(
        { error: 'Invalid verification code. Please try again.' },
        { status: 400 }
      )
    }

    // Generate backup codes (in production, store these securely)
    const backupCodes = generateBackupCodes()

    // Update user profile to mark MFA as enabled
    await supabase
      .from('profiles')
      .update({ 
        mfa_enabled: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      message: 'MFA enabled successfully',
      backupCodes, // In production, only show these once and store hashed versions
      session: data.session
    })

  } catch (error) {
    console.error('MFA verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify MFA code' },
      { status: 500 }
    )
  }
}

/**
 * Generate random backup codes for account recovery
 * In production, hash these before storing and only show plaintext once
 */
function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = Array.from(
      { length: 8 },
      () => '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 34)]
    ).join('')
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
  }
  return codes
}
