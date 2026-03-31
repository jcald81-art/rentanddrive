import { createClient } from "@/lib/supabase/server"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const page = searchParams.get("page") || "/"

  // Get session (may be null for anonymous visitors)
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id || null

  // Fetch available vehicles (always — for all visitors)
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select(`
      id, make, model, year, daily_rate, 
      pickup_location, features,
      carfidelity_score, carfidelity_certified,
      status
    `)
    .eq("status", "active")
    .order("daily_rate", { ascending: true })
    .limit(10)

  // Fetch upcoming local events for demand context
  const today = new Date().toISOString().split("T")[0]
  const { data: events } = await supabase
    .from("local_events")
    .select("event_name, start_date, demand_level, market")
    .gte("start_date", today)
    .eq("active", true)
    .order("start_date", { ascending: true })
    .limit(5)

  // If logged in — fetch personalized renter data
  let renterProfile = null
  let upcomingBookings = null
  let recentTrips = null
  let mileMakersInfo = null

  if (userId) {
    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, city, state")
      .eq("id", userId)
      .single()

    // Get renter stats
    const { data: stats } = await supabase
      .from("renter_stats")
      .select(`
        total_trips, total_miles, avg_road_score,
        current_streak, mile_markers_points,
        mile_markers_tier, road_score_rank
      `)
      .eq("renter_id", userId)
      .single()

    // Get upcoming bookings
    const { data: bookings } = await supabase
      .from("bookings")
      .select(`
        id, start_date, end_date, status,
        pickup_location,
        vehicles(make, model, year)
      `)
      .eq("renter_id", userId)
      .in("status", ["confirmed", "active"])
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .limit(3)

    // Get 3 most recent completed trips
    const { data: trips } = await supabase
      .from("bookings")
      .select(`
        start_date, end_date,
        vehicles(make, model, year),
        road_scores(overall_score)
      `)
      .eq("renter_id", userId)
      .eq("status", "complete")
      .order("end_date", { ascending: false })
      .limit(3)

    renterProfile = profile
    upcomingBookings = bookings
    recentTrips = trips
    mileMakersInfo = stats
  }

  return Response.json({
    isLoggedIn: !!userId,
    page,
    renterProfile,
    upcomingBookings,
    recentTrips,
    mileMakersInfo,
    availableVehicles: vehicles || [],
    localEvents: events || [],
    serverTime: new Date().toISOString(),
  })
}
