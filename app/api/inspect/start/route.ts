import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createInspectionSession, sendInspectionSMS } from "@/lib/verification/inspektlabs"
import crypto from "crypto"

/**
 * POST /api/inspect/start
 * Creates a new inspection session and sends SMS link to renter
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { bookingId, type } = body

    if (!bookingId || !type) {
      return NextResponse.json({ error: "Missing bookingId or type" }, { status: 400 })
    }

    if (type !== "pre_trip" && type !== "post_trip") {
      return NextResponse.json({ error: "Invalid inspection type" }, { status: 400 })
    }

    // Get booking with vehicle and renter info
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        vehicles (id, make, model, year, vin),
        renter:profiles!bookings_renter_id_fkey (id, first_name, phone)
      `
      )
      .eq("id", bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Check if inspection already exists
    const { data: existingInspection } = await supabase
      .from("trip_inspections")
      .select("*")
      .eq("booking_id", bookingId)
      .eq("inspection_type", type)
      .single()

    if (existingInspection?.completed) {
      return NextResponse.json({
        status: "already_completed",
        inspectionId: existingInspection.id,
      })
    }

    // Create Inspektlabs session
    const session = await createInspectionSession({
      bookingId,
      vehicleId: booking.vehicle_id,
      renterId: booking.renter_id,
      type,
      vehicleMake: booking.vehicles.make,
      vehicleModel: booking.vehicles.model,
      vehicleYear: booking.vehicles.year,
      vehicleVin: booking.vehicles.vin,
    })

    if ("error" in session) {
      return NextResponse.json({ error: session.error }, { status: 500 })
    }

    // Generate unique SMS link token
    const smsLinkToken = crypto.randomBytes(32).toString("hex")

    // Create or update inspection record
    const inspectionData = {
      booking_id: bookingId,
      vehicle_id: booking.vehicle_id,
      renter_id: booking.renter_id,
      inspection_type: type,
      inspektlabs_session_id: session.id,
      inspektlabs_status: "pending",
      sms_link_token: smsLinkToken,
      sms_link_expires_at: session.expires_at,
      created_at: new Date().toISOString(),
    }

    let inspectionId: string

    if (existingInspection) {
      const { data: updated } = await supabase
        .from("trip_inspections")
        .update(inspectionData)
        .eq("id", existingInspection.id)
        .select()
        .single()
      inspectionId = updated?.id || existingInspection.id
    } else {
      const { data: created } = await supabase.from("trip_inspections").insert(inspectionData).select().single()
      inspectionId = created?.id || ""
    }

    // Send SMS link
    if (booking.renter?.phone) {
      await sendInspectionSMS({
        phone: booking.renter.phone,
        inspectionUrl: session.url,
        renterName: booking.renter.first_name || "Renter",
        vehicleName: `${booking.vehicles.year} ${booking.vehicles.make} ${booking.vehicles.model}`,
        type,
      })

      await supabase
        .from("trip_inspections")
        .update({
          sms_link_sent: true,
          sms_sent_at: new Date().toISOString(),
          sms_phone: booking.renter.phone,
        })
        .eq("id", inspectionId)
    }

    return NextResponse.json({
      inspectionId,
      sessionUrl: session.url,
      expiresAt: session.expires_at,
      smsSent: !!booking.renter?.phone,
    })
  } catch (error) {
    console.error("[Inspect Start] Error:", error)
    return NextResponse.json({ error: "Failed to start inspection" }, { status: 500 })
  }
}
