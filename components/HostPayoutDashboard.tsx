"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

interface Payout {
  id: string;
  booking_id: string;
  amount: number;
  rad_fee: number;
  status: "pending" | "transferred" | "paid_out" | "reversed";
  payout_type: "standard" | "instant";
  created_at: string;
  paid_out_at: string | null;
  booking: {
    start_date: string;
    end_date: string;
    vehicle: { make: string; model: string; year: number };
    renter: { full_name: string };
  };
}

interface StripeStatus {
  status: "not_connected" | "pending" | "active";
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
}

function currency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  transferred: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  paid_out: "bg-green-500/10 text-green-400 border-green-500/30",
  reversed: "bg-red-500/10 text-red-400 border-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  transferred: "In Transit",
  paid_out: "Paid Out",
  reversed: "Reversed",
};

export default function HostPayoutDashboard({ hostId }: { hostId: string }) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    async function load() {
      // Fetch Stripe account status
      const statusRes = await fetch("/api/hosts/stripe/onboard");
      const statusData = await statusRes.json();
      setStripeStatus(statusData);

      // Fetch payout history
      const { data } = await supabase
        .from("payouts")
        .select(`
          *,
          booking:bookings(
            start_date,
            end_date,
            vehicle:vehicles(make, model, year),
            renter:profiles!bookings_renter_id_fkey(full_name)
          )
        `)
        .eq("host_id", hostId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        setPayouts(data as Payout[]);
        setTotalEarned(data.filter(p => p.status === "paid_out").reduce((s, p) => s + p.amount, 0));
        setTotalPending(data.filter(p => ["pending","transferred"].includes(p.status)).reduce((s, p) => s + p.amount, 0));
      }
      setLoading(false);
    }
    load();
  }, [hostId]);

  async function handleConnectStripe() {
    setConnecting(true);
    const res = await fetch("/api/hosts/stripe/onboard", { method: "POST" });
    const { url, error } = await res.json();
    if (error) { setConnecting(false); return; }
    window.location.href = url;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin h-6 w-6 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Stripe Connect Banner */}
      {stripeStatus?.status !== "active" && (
        <div className={`rounded-2xl p-5 border ${
          stripeStatus?.status === "pending" 
            ? "bg-yellow-500/5 border-yellow-500/30" 
            : "bg-[#e63946]/5 border-[#e63946]/30"
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-sm">
                {stripeStatus?.status === "pending" ? "⏳ Stripe verification in progress" : "💳 Connect your payout account"}
              </h3>
              <p className="text-white/50 text-xs mt-1">
                {stripeStatus?.status === "pending"
                  ? "Stripe is verifying your information. You'll receive an email when active."
                  : "Connect Stripe to receive payouts. Takes 5 minutes. RAD only takes 10% — you keep 90%."}
              </p>
            </div>
            {stripeStatus?.status !== "pending" && (
              <button
                onClick={handleConnectStripe}
                disabled={connecting}
                className="shrink-0 bg-[#e63946] hover:bg-[#c1121f] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
              >
                {connecting ? "Connecting…" : "Connect Stripe"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total earned", value: currency(totalEarned), color: "text-green-400" },
          { label: "In transit", value: currency(totalPending), color: "text-blue-400" },
          { label: "RAD fee rate", value: "10%", color: "text-[#e63946]" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs text-white/40 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Payout history */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-semibold">Payout history</h3>
          {stripeStatus?.status === "active" && (
            <button
              onClick={handleConnectStripe}
              className="text-xs text-white/40 hover:text-white transition-colors"
            >
              Stripe dashboard →
            </button>
          )}
        </div>

        {payouts.length === 0 ? (
          <div className="px-5 py-12 text-center text-white/30 text-sm">
            No payouts yet. Complete your first booking to see earnings here.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {payouts.map((payout) => (
              <div key={payout.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {payout.booking?.vehicle?.year} {payout.booking?.vehicle?.make} {payout.booking?.vehicle?.model}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {payout.booking?.start_date && fmt(payout.booking.start_date)} · {payout.booking?.renter?.full_name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm">{currency(payout.amount)}</p>
                  <p className="text-xs text-white/30">RAD fee: {currency(payout.rad_fee)}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 ${STATUS_STYLES[payout.status]}`}>
                  {STATUS_LABELS[payout.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Turo comparison */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
        <h3 className="font-semibold text-sm mb-3">RAD vs Turo — your earnings advantage</h3>
        <div className="space-y-2 text-sm">
          {[
            { label: "On a $345 rental", rad: "$310.50", turo: "$224–$259", delta: "+$52–$87" },
            { label: "Commission rate", rad: "10%", turo: "25–35%", delta: "You keep more" },
            { label: "Payout timing", rad: "1-2 days", turo: "3-5 days", delta: "2x faster" },
            { label: "Instant payout", rad: "Coming soon", turo: "No", delta: "" },
          ].map(({ label, rad, turo, delta }) => (
            <div key={label} className="grid grid-cols-4 gap-2 py-1.5 border-b border-white/5 last:border-0">
              <span className="text-white/40 text-xs">{label}</span>
              <span className="text-green-400 text-xs font-medium">{rad}</span>
              <span className="text-red-400/70 text-xs">{turo}</span>
              <span className="text-white/60 text-xs font-medium">{delta}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 mt-1 text-xs text-white/25">
          <span></span><span>RAD</span><span>Turo</span><span>Difference</span>
        </div>
      </div>

    </div>
  );
}
