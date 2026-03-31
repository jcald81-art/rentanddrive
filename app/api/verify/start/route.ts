import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
})

/**
 * POST /api/verify/start
 * Initiates the full driver verification flow:
 * 1. Creates/updates driver_verifications record
 * 2. Creates Stripe Identity session for license + face verification
 * 3. Returns session URL for redirect
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { fcraConsent, consentIp } = body

    // FCRA consent is legally required before background check
    if (!fcraConsent) {
      return NextResponse.json({ error: "FCRA consent required" }, { status: 400 })
    }

    // Check for existing verification
    const { data: existing } = await supabase
      .from("driver_verifications")
      .select("*")
      .eq("user_id", user.id)
      .single()

    // If already verified and not expired, return early
    if (existing?.status === "verified" && existing.expires_at) {
      const expiresAt = new Date(existing.expires_at)
      if (expiresAt > new Date()) {
        return NextResponse.json({
          status: "already_verified",
          expiresAt: existing.expires_at,
          score: existing.rentability_score,
          tier: existing.score_tier,
        })
      }
    }

    // Create or update verification record with FCRA consent
    const verificationData = {
      user_id: user.id,
      status: "pending",
      fcra_consent: true,
      fcra_consent_at: new Date().toISOString(),
      fcra_consent_ip: consentIp || "unknown",
      initiated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    let verificationId: string

    if (existing) {
      const { data: updated, error } = await supabase
        .from("driver_verifications")
        .update(verificationData)
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error
      verificationId = updated.id
    } else {
      const { data: created, error } = await supabase
        .from("driver_verifications")
        .insert(verificationData)
        .select()
        .single()

      if (error) throw error
      verificationId = created.id
    }

    // Create Stripe Identity verification session
    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      options: {
        document: {
          require_matching_selfie: true,
          allowed_types: ["driving_license"],
        },
      },
      metadata: {
        user_id: user.id,
        verification_id: verificationId,
        platform: "rad",
      },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/renter/verify?step=mvr`,
    })

    // Store Stripe session ID
    await supabase
      .from("driver_verifications")
      .update({
        stripe_session_id: session.id,
        stripe_verification_status: session.status,
      })
      .eq("id", verificationId)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      verificationId,
    })
  } catch (error) {
    console.error("[Verify Start] Error:", error)
    return NextResponse.json({ error: "Failed to start verification" }, { status: 500 })
  }
}
