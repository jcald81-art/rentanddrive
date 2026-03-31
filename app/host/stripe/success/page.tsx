"use client";

// app/host/stripe/success/page.tsx
// Landing page after host completes Stripe onboarding

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StripeSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "active" | "pending">("checking");

  useEffect(() => {
    // Check actual account status from Stripe
    fetch("/api/hosts/stripe/onboard")
      .then(r => r.json())
      .then(data => {
        setStatus(data.status === "active" ? "active" : "pending");
      })
      .catch(() => setStatus("pending"));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">

        {status === "checking" && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto animate-pulse">
              <svg className="animate-spin h-8 w-8 text-white/50" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
            <p className="text-white/50">Verifying your account…</p>
          </div>
        )}

        {status === "active" && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto text-4xl">✓</div>
            <h1 className="text-3xl font-bold">Payout account active!</h1>
            <p className="text-white/50">
              Your Stripe account is verified. You'll receive payouts automatically 
              within 1-2 business days after each completed trip.
            </p>
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 text-left space-y-3">
              <h3 className="font-semibold">Your payout setup</h3>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">RAD commission</span>
                <span className="text-green-400 font-semibold">10% only</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Turo commission</span>
                <span className="text-red-400">25–35%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Payout timing</span>
                <span>1-2 business days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Instant payout</span>
                <span>Coming soon</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/host/dashboard"
                className="w-full bg-[#e63946] text-white font-bold py-4 rounded-xl text-center hover:bg-[#c1121f] transition-colors">
                Go to Eagle Eye Dashboard
              </Link>
              <Link href="/host/vehicles/add"
                className="w-full bg-white/10 text-white font-semibold py-3 rounded-xl text-center hover:bg-white/20 transition-colors text-sm">
                List your first vehicle
              </Link>
            </div>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center mx-auto text-4xl">⏳</div>
            <h1 className="text-2xl font-bold">Almost there</h1>
            <p className="text-white/50">
              Stripe is still verifying your information. This usually takes a few minutes. 
              You'll get an email when your account is active.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => window.location.reload()}
                className="w-full bg-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/20 transition-colors text-sm">
                Check again
              </button>
              <Link href="/host/dashboard"
                className="text-white/40 text-sm hover:text-white transition-colors">
                Go to dashboard anyway
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
