import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getInspectionReport, compareInspections } from "@/lib/verification/inspektlabs"
import { headers } from "next/headers"
import crypto from "crypto"

const INSPEKT_WEBHOOK_SECRET = process.env.INSPEKTLABS_WEBHOOK_SECRET || ""

/**
 * POST /api/inspect/webhook
 * Handles Inspektlabs webhooks when inspections complete
 */
export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get("x-inspektlabs-signature") || ""

    // Verify webhook signature in production
    if (INSPEKT_WEBHOOK_SECRET && signature) {
      const expectedSig = crypto.createHmac("sha256", INSPEKT_WEBHOOK_SECRET).update(body).digest("hex")
      if (signature !== expectedSig) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const event = JSON.parse(body)
    const supabase = await createClient()

    if (event.type === "inspection.completed") {
      const sessionId = event.data.session_id

      // Find inspection by session ID
      const { data: inspection } = await supabase
        .from("trip_inspections")
        .select("*")
        .eq("inspektlabs_session_id", sessionId)
        .single()

      if (!inspection) {
        console.error("[Inspect Webhook] No inspection found for session:", sessionId)
        return NextResponse.json({ received: true })
      }

      // Fetch full report
      const report = await getInspectionReport(sessionId)

      if ("error" in report) {
        console.error("[Inspect Webhook] Failed to fetch report:", report.error)
        return NextResponse.json({ received: true })
      }

      // Update inspection with results
      await supabase
        .from("trip_inspections")
        .update({
          inspektlabs_report_id: report.id,
          inspektlabs_report_url: report.report_url,
          inspektlabs_status: report.status,
          damages_detected: report.damages,
          damage_count: report.damages.length,
          estimated_repair_cost: report.damages.reduce((sum, d) => sum + d.estimated_repair_cost, 0),
          fraud_flags: report.fraud_indicators,
          vin_ocr: report.vehicle_info?.vin,
          odometer_ocr: report.vehicle_info?.odometer,
          completed: true,
          completed_at: new Date().toISOString(),
          completed_via: "inspektlabs",
        })
        .eq("id", inspection.id)

      // If this is a post-trip inspection, compare with pre-trip
      if (inspection.inspection_type === "post_trip") {
        const { data: preTrip } = await supabase
          .from("trip_inspections")
          .select("*")
          .eq("booking_id", inspection.booking_id)
          .eq("inspection_type", "pre_trip")
          .eq("completed", true)
          .single()

        if (preTrip && preTrip.inspektlabs_report_id) {
          const preReport = await getInspectionReport(preTrip.inspektlabs_session_id)

          if (!("error" in preReport)) {
            const comparison = compareInspections(preReport, report)

            // Create comparison record
            await supabase.from("inspection_comparisons").insert({
              booking_id: inspection.booking_id,
              pre_inspection_id: preTrip.id,
              post_inspection_id: inspection.id,
              new_damages: comparison.newDamages,
              pre_existing_damages: comparison.preExistingDamages,
              damage_claim_triggered: comparison.hasNewDamage && comparison.totalNewDamageCost > 100,
              damage_claim_amount: comparison.totalNewDamageCost,
            })

            // Update post-trip with new damage count
            await supabase
              .from("trip_inspections")
              .update({
                new_damage_count: comparison.newDamages.length,
              })
              .eq("id", inspection.id)

            // If significant new damage, notify host
            if (comparison.hasNewDamage && comparison.totalNewDamageCost > 100) {
              // TODO: Send notification to host
              console.log(`[Inspect Webhook] New damage detected for booking ${inspection.booking_id}: $${comparison.totalNewDamageCost}`)
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Inspect Webhook] Error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
