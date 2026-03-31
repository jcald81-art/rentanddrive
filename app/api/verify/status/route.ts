import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/verify/status
 * Returns current verification status and score for authenticated user
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: verification } = await supabase
      .from("driver_verifications")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (!verification) {
      return NextResponse.json({
        status: "not_started",
        message: "Verification not yet initiated",
      })
    }

    // Check if expired
    if (verification.expires_at && new Date(verification.expires_at) < new Date()) {
      return NextResponse.json({
        status: "expired",
        message: "Verification has expired. Please re-verify.",
        expiresAt: verification.expires_at,
      })
    }

    return NextResponse.json({
      status: verification.status,
      score: verification.rentability_score,
      tier: verification.score_tier,
      recommendation: verification.score_recommendation,
      breakdown: verification.score_breakdown,
      stripeStatus: verification.stripe_verification_status,
      checkrStatus: verification.checkr_status,
      mvrStatus: verification.checkr_mvr_status,
      isUnder25: verification.is_under_25,
      under25Surcharge: verification.under25_surcharge,
      verifiedAt: verification.verified_at,
      expiresAt: verification.expires_at,
      blockReason: verification.block_reason,
      appealSubmitted: verification.appeal_submitted,
    })
  } catch (error) {
    console.error("[Verify Status] Error:", error)
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 })
  }
}
