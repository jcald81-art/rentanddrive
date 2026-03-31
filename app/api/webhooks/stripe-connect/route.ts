import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Service role — bypasses RLS for webhook processing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Connect webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {

    // ── Host completed Stripe onboarding ─────────────────────────────────
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      const isActive = account.charges_enabled && account.payouts_enabled;

      if (isActive && account.metadata?.supabase_user_id) {
        await supabase
          .from("profiles")
          .update({ stripe_onboarding_complete: true })
          .eq("id", account.metadata.supabase_user_id);

        // Notify host — their account is live
        await supabase.from("notifications").insert({
          user_id: account.metadata.supabase_user_id,
          type: "stripe_connected",
          title: "Payout account active!",
          body: "Your Stripe payout account is verified. You'll receive payouts automatically after each completed trip.",
          read: false,
        });
      }
      break;
    }

    // ── Payment succeeded → transfer to host ─────────────────────────────
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const bookingId = pi.metadata?.booking_id;
      if (!bookingId) break;

      // Get booking + vehicle + host connect account
      const { data: booking } = await supabase
        .from("bookings")
        .select(`
          *,
          vehicle:vehicles(host_id, make, model, year),
          host:profiles!bookings_host_id_fkey(
            stripe_connect_id,
            stripe_onboarding_complete
          )
        `)
        .eq("id", bookingId)
        .single();

      if (!booking?.host?.stripe_connect_id || !booking.host.stripe_onboarding_complete) {
        console.log(`[connect] Host not connected for booking ${bookingId} — skipping transfer`);
        break;
      }

      // Calculate host payout (total minus RAD 10% fee)
      const radFeeRate = 0.10;
      const totalCents = pi.amount;
      const radFeeCents = Math.round(totalCents * radFeeRate);
      const hostPayoutCents = totalCents - radFeeCents;

      // Create transfer to host
      const transfer = await stripe.transfers.create({
        amount: hostPayoutCents,
        currency: "usd",
        destination: booking.host.stripe_connect_id,
        transfer_group: bookingId,
        metadata: {
          booking_id: bookingId,
          host_id: booking.host_id,
          rad_fee_cents: radFeeCents.toString(),
        },
      });

      // Record payout
      await supabase.from("payouts").insert({
        booking_id: bookingId,
        host_id: booking.host_id,
        stripe_transfer_id: transfer.id,
        amount: hostPayoutCents / 100,
        rad_fee: radFeeCents / 100,
        status: "transferred",
        payout_type: "standard",
      });

      // Update booking with transfer info
      await supabase
        .from("bookings")
        .update({ stripe_transfer_id: transfer.id, host_payout_status: "transferred" })
        .eq("id", bookingId);

      // Notify host
      const vehicle = booking.vehicle;
      await supabase.from("notifications").insert({
        user_id: booking.host_id,
        type: "payout_sent",
        title: `Payout sent — $${(hostPayoutCents / 100).toFixed(2)}`,
        body: `Your payout for the ${vehicle?.year} ${vehicle?.make} ${vehicle?.model} booking is on its way. Arrives in 1-2 business days.`,
        metadata: { booking_id: bookingId, transfer_id: transfer.id },
        read: false,
      });

      break;
    }

    // ── Refund → reverse transfer to host ────────────────────────────────
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const bookingId = charge.metadata?.booking_id;
      if (!bookingId) break;

      // Find the transfer for this booking
      const { data: payout } = await supabase
        .from("payouts")
        .select("stripe_transfer_id, amount")
        .eq("booking_id", bookingId)
        .single();

      if (payout?.stripe_transfer_id) {
        // Reverse the transfer
        await stripe.transfers.createReversal(payout.stripe_transfer_id, {
          metadata: { booking_id: bookingId, reason: "booking_refunded" },
        });

        await supabase
          .from("payouts")
          .update({ status: "reversed" })
          .eq("booking_id", bookingId);
      }
      break;
    }

    // ── Payout to host bank account completed ────────────────────────────
    case "payout.paid": {
      const payout = event.data.object as Stripe.Payout;
      // Update payout record as fully paid out to bank
      await supabase
        .from("payouts")
        .update({ 
          status: "paid_out", 
          paid_out_at: new Date().toISOString() 
        })
        .eq("stripe_transfer_id", payout.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
