import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://rentanddrive.net";

// ─── POST /api/hosts/stripe/onboard ──────────────────────────────────────────
// Creates a Stripe Connect Express account + returns onboarding URL
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          },
        },
      }
    );

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get host profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, stripe_connect_id, stripe_onboarding_complete")
      .eq("id", user.id)
      .single();

    let connectAccountId = profile?.stripe_connect_id;

    // If host already has a complete account, return dashboard link
    if (connectAccountId && profile?.stripe_onboarding_complete) {
      const loginLink = await stripe.accounts.createLoginLink(connectAccountId);
      return NextResponse.json({ url: loginLink.url, type: "dashboard" });
    }

    // Create new Connect Express account if none exists
    if (!connectAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          supabase_user_id: user.id,
          full_name: profile?.full_name ?? "",
        },
      });

      connectAccountId = account.id;

      // Save connect account ID to profile
      await supabase
        .from("profiles")
        .update({ stripe_connect_id: account.id })
        .eq("id", user.id);
    }

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: connectAccountId,
      refresh_url: `${baseUrl}/host/stripe/refresh`,
      return_url: `${baseUrl}/host/stripe/success`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url, type: "onboarding" });
  } catch (err: unknown) {
    console.error("[hosts/stripe/onboard]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Internal error" },
      { status: 500 }
    );
  }
}

// ─── GET /api/hosts/stripe/onboard ───────────────────────────────────────────
// Returns current payout account status for the host dashboard
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_connect_id, stripe_onboarding_complete")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_connect_id) {
      return NextResponse.json({ status: "not_connected" });
    }

    // Fetch live account status from Stripe
    const account = await stripe.accounts.retrieve(profile.stripe_connect_id);

    const isComplete = account.details_submitted && 
                       account.charges_enabled && 
                       account.payouts_enabled;

    // Sync status back to Supabase if changed
    if (isComplete && !profile.stripe_onboarding_complete) {
      await supabase
        .from("profiles")
        .update({ stripe_onboarding_complete: true })
        .eq("id", user.id);
    }

    return NextResponse.json({
      status: isComplete ? "active" : "pending",
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      connect_id: profile.stripe_connect_id,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
