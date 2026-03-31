import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ─── POST /api/vehicles/vin-decode ───────────────────────────────────────────
// Decodes VIN using GoodCar API + runs NHTSA recall check
// Returns: vehicle details + features + recalls + CarFidelity score

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

    // Auth required
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { vin } = await req.json();

    if (!vin || vin.length !== 17) {
      return NextResponse.json({ error: "VIN must be 17 characters" }, { status: 400 });
    }

    const cleanVin = vin.toUpperCase().trim();

    // ── 1. GoodCar VIN decode ─────────────────────────────────────────────
    const goodCarRes = await fetch(
      `https://api.goodcar.com/v1/vin/${cleanVin}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GOODCAR_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let vehicleData: Record<string, unknown> = {};
    if (goodCarRes.ok) {
      const gc = await goodCarRes.json();
      vehicleData = {
        year: gc.year ?? gc.model_year,
        make: gc.make,
        model: gc.model,
        trim: gc.trim ?? gc.series,
        engine: gc.engine_displacement ? `${gc.engine_displacement}L ${gc.fuel_type}` : gc.engine,
        drivetrain: gc.drive_type ?? gc.drivetrain,
        transmission: gc.transmission,
        doors: gc.doors,
        body_style: gc.body_style ?? gc.body_class,
        fuel_type: gc.fuel_type,
        mpg_city: gc.city_mpg,
        mpg_hwy: gc.highway_mpg,
      };
    } else {
      // Fallback: NHTSA free VIN decoder
      const nhtsaRes = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${cleanVin}?format=json`
      );
      if (nhtsaRes.ok) {
        const nhtsa = await nhtsaRes.json();
        const results = nhtsa.Results ?? [];
        const get = (var_name: string) =>
          results.find((r: { Variable: string; Value: string }) => r.Variable === var_name)?.Value ?? "";

        vehicleData = {
          year: get("Model Year"),
          make: get("Make"),
          model: get("Model"),
          trim: get("Trim"),
          engine: `${get("Displacement (L)")}L`,
          drivetrain: get("Drive Type"),
          transmission: get("Transmission Style"),
          doors: get("Doors"),
          body_style: get("Body Class"),
          fuel_type: get("Fuel Type - Primary"),
        };
      }
    }

    // ── 2. NHTSA recall check ─────────────────────────────────────────────
    let recalls: unknown[] = [];
    let openRecalls = 0;
    try {
      const recallRes = await fetch(
        `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${vehicleData.make}&model=${vehicleData.model}&modelYear=${vehicleData.year}`
      );
      if (recallRes.ok) {
        const recallData = await recallRes.json();
        recalls = recallData.results ?? [];
        openRecalls = recalls.length;
      }
    } catch {
      // Non-blocking — recalls check failure doesn't fail VIN decode
    }

    // ── 3. Auto-detect features from VIN data ─────────────────────────────
    const detectedFeatures: string[] = [];
    const drivetrain = String(vehicleData.drivetrain ?? "").toLowerCase();
    const bodyStyle = String(vehicleData.body_style ?? "").toLowerCase();
    const fuel = String(vehicleData.fuel_type ?? "").toLowerCase();

    if (drivetrain.includes("awd") || drivetrain.includes("4wd") || drivetrain.includes("4x4")) {
      detectedFeatures.push("AWD/4WD");
    }
    if (bodyStyle.includes("suv") || bodyStyle.includes("pickup") || bodyStyle.includes("truck")) {
      detectedFeatures.push("High Clearance");
    }
    if (fuel.includes("electric") || fuel.includes("ev")) {
      detectedFeatures.push("Electric");
    }
    if (fuel.includes("hybrid")) {
      detectedFeatures.push("Hybrid");
    }

    // ── 4. Adventure tags based on vehicle type ───────────────────────────
    const suggestedTags: string[] = [];
    if (detectedFeatures.includes("AWD/4WD")) {
      suggestedTags.push("Ski/Snowboard", "Off-Road", "Mountain Biking");
    }
    if (bodyStyle.includes("suv") || bodyStyle.includes("pickup")) {
      suggestedTags.push("Camping", "Road Trip");
    }
    if (detectedFeatures.includes("Electric")) {
      suggestedTags.push("Eco-Friendly");
    }

    // ── 5. CarFidelity baseline score ─────────────────────────────────────
    const carFidelityStatus = openRecalls === 0
      ? { status: "certified", label: "0 open recalls", color: "green" }
      : { status: "warning", label: `${openRecalls} open recall${openRecalls > 1 ? "s" : ""}`, color: "red" };

    // ── 6. Market rate suggestion from RAD Pricing ────────────────────────
    // Simple heuristic until RAD Pricing agent is live
    const year = parseInt(String(vehicleData.year));
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    let suggestedDailyRate = 85; // base economy

    if (bodyStyle.includes("suv")) suggestedDailyRate = 115;
    if (bodyStyle.includes("pickup") || bodyStyle.includes("truck")) suggestedDailyRate = 120;
    if (detectedFeatures.includes("Electric")) suggestedDailyRate += 30;
    if (detectedFeatures.includes("AWD/4WD")) suggestedDailyRate += 15;
    if (age <= 3) suggestedDailyRate += 20;
    if (age >= 8) suggestedDailyRate -= 15;

    return NextResponse.json({
      vin: cleanVin,
      vehicle: vehicleData,
      detected_features: detectedFeatures,
      suggested_tags: suggestedTags,
      recalls: {
        count: openRecalls,
        items: recalls.slice(0, 5), // first 5
        carfidelity: carFidelityStatus,
      },
      pricing: {
        suggested_daily_rate: Math.max(55, suggestedDailyRate),
        market_note: `Similar ${vehicleData.year} ${vehicleData.make} ${vehicleData.model}s in Reno average $${Math.max(55, suggestedDailyRate)}/day`,
      },
    });
  } catch (err: unknown) {
    console.error("[vin-decode]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "VIN decode failed" },
      { status: 500 }
    );
  }
}
