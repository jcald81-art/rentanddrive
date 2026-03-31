import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getMVRReport, parseMVRRecords } from "@/lib/verification/checkr"
import { calculateRentabilityScore } from "@/lib/verification/score-engine"
import { headers } from "next/headers"
import crypto from "crypto"

const CHECKR_WEBHOOK_SECRET = process.env.CHECKR_WEBHOOK_SECRET || ""

/**
 * POST /api/verify/checkr/webhook
 * Handles Checkr webhooks for MVR report completion and continuous monitoring alerts
 */
export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get("x-checkr-signature") || ""

    // Verify webhook signature in production
    if (CHECKR_WEBHOOK_SECRET && signature) {
      const expectedSig = crypto.createHmac("sha256", CHECKR_WEBHOOK_SECRET).update(body).digest("hex")
      if (signature !== expectedSig) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const event = JSON.parse(body)
    const supabase = await createClient()

    // Handle different event types
    switch (event.type) {
      case "report.completed": {
        await handleReportCompleted(supabase, event.data)
        break
      }
      case "continuous_check.alert": {
        await handleContinuousAlert(supabase, event.data)
        break
      }
      default:
        console.log("[Checkr Webhook] Unhandled event type:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Checkr Webhook] Error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handleReportCompleted(supabase: Awaited<ReturnType<typeof createClient>>, data: { id: string }) {
  const reportId = data.id

  // Find verification by report ID
  const { data: verification } = await supabase
    .from("driver_verifications")
    .select("*")
    .eq("checkr_report_id", reportId)
    .single()

  if (!verification) {
    console.error("[Checkr Webhook] No verification found for report:", reportId)
    return
  }

  // Fetch full report
  const report = await getMVRReport(reportId)

  if ("error" in report) {
    console.error("[Checkr Webhook] Failed to fetch report:", report.error)
    return
  }

  // Parse MVR records
  const mvrData = report.motor_vehicle_report
  const records = mvrData?.records || []
  const parsedRecords = parseMVRRecords(records)

  // Calculate years licensed (estimate from earliest record or 10 years if clean)
  let yearsLicensed = 10 // Default assumption for clean records
  if (records.length > 0) {
    const oldestRecord = records.reduce((oldest, r) => {
      const d = new Date(r.date)
      return d < new Date(oldest.date) ? r : oldest
    }, records[0])
    const oldestDate = new Date(oldestRecord.date)
    const now = new Date()
    yearsLicensed = Math.max(1, Math.floor((now.getTime() - oldestDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
  }

  // Update verification with MVR results
  const updateData = {
    checkr_status: "complete",
    checkr_mvr_status: mvrData?.status || "complete",
    years_licensed: yearsLicensed,
    ...parsedRecords,
    updated_at: new Date().toISOString(),
  }

  await supabase.from("driver_verifications").update(updateData).eq("id", verification.id)

  // Now calculate final score
  const scoreResult = calculateRentabilityScore({
    stripe_verification_status: verification.stripe_verification_status,
    face_match_confidence: verification.face_match_confidence,
    license_expiry: verification.license_expiry,
    driver_age: verification.driver_age,
    years_licensed: yearsLicensed,
    dui_count_7yr: parsedRecords.dui_count_7yr,
    dui_count_lifetime: parsedRecords.dui_count_lifetime,
    at_fault_accidents_3yr: parsedRecords.at_fault_accidents_3yr,
    at_fault_accidents_7yr: parsedRecords.at_fault_accidents_7yr,
    major_violations_3yr: parsedRecords.major_violations_3yr,
    minor_violations_3yr: parsedRecords.minor_violations_3yr,
    suspensions_lifetime: parsedRecords.suspensions_lifetime,
    license_currently_suspended: parsedRecords.suspensions_lifetime > 0 && records.some((r) => r.type === "suspension" && !r.date),
  })

  // Determine final status
  let status = "verified"
  let blockReason: string | null = null
  let blockReasonDetail: string | null = null

  if (scoreResult.tier === "auto_deny") {
    status = "auto_denied"
    blockReason = scoreResult.flags[0] || "Auto-denied based on driving history"
    blockReasonDetail = scoreResult.flags.join("; ")
  } else if (scoreResult.tier === "red") {
    status = "soft_blocked"
    blockReason = "Requires manual review"
    blockReasonDetail = scoreResult.flags.join("; ")
  }

  // Final update with score
  await supabase
    .from("driver_verifications")
    .update({
      status,
      rentability_score: scoreResult.score,
      score_tier: scoreResult.tier,
      score_recommendation: scoreResult.recommendation,
      score_breakdown: scoreResult.breakdown,
      block_reason: blockReason,
      block_reason_detail: blockReasonDetail,
      completed_at: new Date().toISOString(),
      verified_at: status === "verified" ? new Date().toISOString() : null,
      expires_at: status === "verified" ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null,
      next_recheck_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", verification.id)

  // Update profiles table with verification status
  await supabase
    .from("profiles")
    .update({
      verification_status: status === "verified" ? "verified" : "pending",
      rentability_score: scoreResult.score,
      mvr_tier: scoreResult.tier,
    })
    .eq("id", verification.user_id)

  console.log(`[Checkr Webhook] Verification ${verification.id} completed with score ${scoreResult.score} (${scoreResult.tier})`)
}

async function handleContinuousAlert(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: { candidate_id: string; alert_type: string }
) {
  // Find verification by candidate ID
  const { data: verification } = await supabase
    .from("driver_verifications")
    .select("*")
    .eq("checkr_candidate_id", data.candidate_id)
    .single()

  if (!verification) return

  const oldScore = verification.rentability_score
  const oldTier = verification.score_tier

  // Re-fetch and recalculate score
  if (verification.checkr_report_id) {
    const report = await getMVRReport(verification.checkr_report_id)
    if (!("error" in report) && report.motor_vehicle_report) {
      const parsedRecords = parseMVRRecords(report.motor_vehicle_report.records || [])

      const newScoreResult = calculateRentabilityScore({
        ...verification,
        ...parsedRecords,
      })

      // Log the monitoring event
      await supabase.from("checkr_monitoring_events").insert({
        user_id: verification.user_id,
        verification_id: verification.id,
        event_type: data.alert_type,
        event_data: data,
        old_score: oldScore,
        new_score: newScoreResult.score,
        old_tier: oldTier,
        new_tier: newScoreResult.tier,
        tier_changed: oldTier !== newScoreResult.tier,
      })

      // Update verification
      await supabase
        .from("driver_verifications")
        .update({
          rentability_score: newScoreResult.score,
          score_tier: newScoreResult.tier,
          score_recommendation: newScoreResult.recommendation,
          ...parsedRecords,
          updated_at: new Date().toISOString(),
        })
        .eq("id", verification.id)
    }
  }
}
