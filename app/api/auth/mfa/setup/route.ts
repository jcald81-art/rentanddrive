import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * MFA Setup API Route
 * 
 * Environment Variables (add to .env.local):
 * - NEXTAUTH_SECRET: Your NextAuth secret for session encryption
 * - TOTP_ISSUER: "Rent and Drive RAD" (default issuer name shown in authenticator apps)
 * 
 * Supabase MFA is used by default. For custom TOTP implementations:
 * - Install: npm install otplib qrcode
 * - Use otplib to generate secrets and verify codes
 * - Store mfaEnabled (boolean) and mfaSecret (string) in user profile
 * 
 * For Auth.js/NextAuth integration:
 * - Implement MFA as a custom provider or use the @next-auth/prisma-adapter
 * - Store MFA state in the User model
 * 
 * For Clerk integration:
 * - Use Clerk's built-in MFA: https://clerk.com/docs/authentication/configuration/sign-up-sign-in-options#multi-factor-authentication
 */

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Enroll user in TOTP MFA using Supabase Auth
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator App'
    })

    if (error) {
      console.error('MFA enrollment error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Return the QR code and secret for the user to scan
    return NextResponse.json({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
      // Issuer name shown in authenticator apps
      issuer: process.env.TOTP_ISSUER || 'Rent and Drive RAD'
    })

  } catch (error) {
    console.error('MFA setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup MFA' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // List enrolled MFA factors
    const { data: factors, error } = await supabase.auth.mfa.listFactors()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    const verifiedFactors = factors.totp?.filter(f => f.status === 'verified') || []
    const pendingFactors = factors.totp?.filter(f => f.status === 'unverified') || []

    return NextResponse.json({
      mfaEnabled: verifiedFactors.length > 0,
      factors: {
        verified: verifiedFactors.map(f => ({
          id: f.id,
          name: f.friendly_name,
          createdAt: f.created_at
        })),
        pending: pendingFactors.map(f => ({
          id: f.id,
          name: f.friendly_name
        }))
      }
    })

  } catch (error) {
    console.error('MFA status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check MFA status' },
      { status: 500 }
    )
  }
}
