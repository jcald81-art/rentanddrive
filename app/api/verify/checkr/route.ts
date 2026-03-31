import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createCheckrCandidate, createMVRReport, enrollContinuousMonitoring } from "@/lib/verification/checkr"

/**
 * POST /api/verify/checkr
 * Initiates Checkr MVR check after Stripe Identity verification passes
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

    // Get verification record
    const { data: verification } = await supabase
      .from("driver_verifications")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (!verification) {
      return NextResponse.json({ error: "No verification found" }, { status: 404 })
    }

    // Ensure Stripe Identity passed first
    if (verification.stripe_verification_status !== "verified") {
      return NextResponse.json({ error: "License verification required first" }, { status: 400 })
    }

    // Ensure FCRA consent was given
    if (!verification.fcra_consent) {
      return NextResponse.json({ error: "FCRA consent required" }, { status: 400 })
    }

    // Get user profile for email
    const { data: profile } = await supabase.from("profiles").select("email, first_name, last_name").eq("id", user.id).single()

    // Create Checkr candidate
    const candidateResult = await createCheckrCandidate({
      email: profile?.email || user.email || "",
      firstName: verification.driver_name?.split(" ")[0] || profile?.first_name || "",
      lastName: verification.driver_name?.split(" ").slice(1).join(" ") || profile?.last_name || "",
      dob: verification.driver_dob,
      licenseNumber: verification.license_number,
      licenseState: verification.license_state,
    })

    if ("error" in candidateResult) {
      return NextResponse.json({ error: candidateResult.error }, { status: 500 })
    }

    // Create MVR report
    const reportResult = await createMVRReport(candidateResult.candidateId)

    if ("error" in reportResult) {
      return NextResponse.json({ error: reportResult.error }, { status: 500 })
    }

    // Update verification record
    await supabase
      .from("driver_verifications")
      .update({
        checkr_candidate_id: candidateResult.candidateId,
        checkr_report_id: reportResult.reportId,
        checkr_status: "pending",
        checkr_mvr_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", verification.id)

    // Enroll in continuous monitoring
    await enrollContinuousMonitoring(candidateResult.candidateId)

    return NextResponse.json({
      status: "mvr_pending",
      reportId: reportResult.reportId,
      message: "MVR check initiated. Results typically arrive within 24-48 hours.",
    })
  } catch (error) {
    console.error("[Checkr Route] Error:", error)
    return NextResponse.json({ error: "Failed to initiate MVR check" }, { status: 500 })
  }
}
