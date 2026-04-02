import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ─── POST /api/vehicles/publish ──────────────────────────────────────────────
// Creates vehicle listing in Supabase and activates it

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(c) { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      vin, year, make, model, trim, engine, drivetrain,
      fuel_type, mileage, daily_rate, location, latitude, longitude,
      features, adventure_tags, photos, rules, description,
      igloo_pin, bouncie_device_id,
      // New availability fields
      availability,
      // New settings fields  
      settings,
      location_city, location_state,
    } = body;
    
    // Extract availability settings
    const {
      blockedDates = [],
      minimumTrip = 1,
      maximumTrip = 30,
      advanceBooking = 90,
      instantBook = true,
      weekendPremium = 0,
      weeklyDiscount = 10,
      monthlyDiscount = 20,
    } = availability || {};
    
    // Extract vehicle settings
    const {
      pickupAddress = '',
      pickupInstructions = '',
      mileageLimit = 200,
      unlimitedMiles = false,
      fuelPolicy = 'full_to_full',
      smokingAllowed = false,
      petsAllowed = false,
      festivalFriendly = false,
      minimumAge = 25,
      securityDeposit = 500,
      cleaningFee = 75,
      lateFeePerHour = 25,
    } = settings || {};

    // ── Validate required fields ───────────────────────────────────────────
    if (!make || !model || !year || !daily_rate || !photos?.length) {
      return NextResponse.json(
        { error: "Missing required fields: make, model, year, daily_rate, photos" },
        { status: 400 }
      );
    }

    if (photos.length < 6) {
      return NextResponse.json(
        { error: "Minimum 6 photos required" },
        { status: 400 }
      );
    }

    if (daily_rate < 25 || daily_rate > 2000) {
      return NextResponse.json(
        { error: "Daily rate must be between $25 and $2,000" },
        { status: 400 }
      );
    }

    // ── Check host has Stripe Connect ─────────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_connect_id, stripe_onboarding_complete, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_onboarding_complete) {
      return NextResponse.json(
        { error: "Complete Stripe payout setup before listing a vehicle" },
        { status: 402 }
      );
    }

    // ── Insert vehicle ────────────────────────────────────────────────────
    const { data: vehicle, error: insertError } = await supabase
      .from("vehicles")
      .insert({
        host_id: user.id,
        vin: vin ?? null,
        year: parseInt(year),
        make,
        model,
        trim: trim ?? null,
        engine: engine ?? null,
        drivetrain: drivetrain ?? null,
        fuel_type: fuel_type ?? null,
        mileage: mileage ? parseInt(mileage) : null,
        daily_rate: parseFloat(daily_rate),
        daily_rate_cents: Math.round(parseFloat(daily_rate) * 100),
        location: location ?? pickupAddress ?? "Reno, NV",
        location_city: location_city ?? "Reno",
        location_state: location_state ?? "NV",
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        features: features ?? [],
        adventure_tags: adventure_tags ?? [],
        images: photos, // array of Supabase Storage URLs
        photos: photos, // also store in photos column for compatibility
        description: description ?? `${year} ${make} ${model} available for rent in ${location ?? "Reno, NV"}.`,
        rules: {
          ...rules,
          smoking_allowed: smokingAllowed,
          pets_allowed: petsAllowed,
          festival_friendly: festivalFriendly,
          minimum_age: minimumAge,
          fuel_policy: fuelPolicy,
        },
        igloo_pin: igloo_pin ?? null,
        bouncie_device_id: bouncie_device_id ?? null,
        host_stripe_account_id: profile.stripe_connect_id,
        listing_status: "active",
        status: "active",
        // Availability settings
        minimum_trip_days: minimumTrip,
        maximum_trip_days: maximumTrip,
        maximum_advance_booking: advanceBooking,
        instant_book: instantBook,
        // Pricing adjustments
        weekly_rate_cents: Math.round(parseFloat(daily_rate) * 7 * (1 - weeklyDiscount / 100) * 100),
        monthly_rate_cents: Math.round(parseFloat(daily_rate) * 30 * (1 - monthlyDiscount / 100) * 100),
        security_deposit_cents: securityDeposit * 100,
        // Vehicle settings
        pickup_address: pickupAddress,
        pickup_instructions: pickupInstructions,
        mileage_limit: unlimitedMiles ? null : mileageLimit,
        pet_friendly: petsAllowed,
        // Certifications
        rad_certified: false, // unlocked after 10 trips + 4.8+ rating
        carfidelity_certified: false, // unlocked after inspection
      })
      .select("id, make, model, year, daily_rate, status")
      .single();

    if (insertError || !vehicle) {
      console.error("[publish]", insertError);
      return NextResponse.json(
        { error: "Failed to create listing" },
        { status: 500 }
      );
    }

    // ── Notify host via notification record ───────────────────────────────
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "vehicle_listed",
      title: `${year} ${make} ${model} is live!`,
      body: "Your vehicle is now active and accepting bookings on RAD.",
      metadata: { vehicle_id: vehicle.id },
      read: false,
    });

    // ── Estimate first booking (simple heuristic) ─────────────────────────
    const dayOfWeek = new Date().getDay();
    const daysToWeekend = dayOfWeek === 0 ? 6 : dayOfWeek === 6 ? 1 : 6 - dayOfWeek;
    const estimatedFirstBooking = daysToWeekend <= 2
      ? "This weekend"
      : `Within ${daysToWeekend} days`;

    return NextResponse.json({
      success: true,
      vehicle_id: vehicle.id,
      vehicle: {
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        daily_rate: vehicle.daily_rate,
        status: vehicle.status,
      },
      estimated_first_booking: estimatedFirstBooking,
      listing_url: `/vehicles/${vehicle.id}`,
      earnings_preview: {
        monthly_15_days: (vehicle.daily_rate * 15 * 0.9).toFixed(0),
        turo_equivalent: (vehicle.daily_rate * 15 * 0.70).toFixed(0),
        rad_advantage: (vehicle.daily_rate * 15 * 0.20).toFixed(0),
      },
    });
  } catch (err: unknown) {
    console.error("[publish]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Internal error" },
      { status: 500 }
    );
  }
}
