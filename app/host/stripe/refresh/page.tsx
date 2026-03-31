"use client";

import { useState } from "react";

export default function StripeRefreshPage() {
  const [loading, setLoading] = useState(false);

  async function handleResume() {
    setLoading(true);
    const res = await fetch("/api/hosts/stripe/onboard", { method: "POST" });
    const { url, error } = await res.json();
    if (error) {
      setLoading(false);
      return;
    }
    window.location.href = url;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center mx-auto text-4xl">
          ⏳
        </div>
        <h1 className="text-2xl font-bold">Link expired</h1>
        <p className="text-white/50">
          Your Stripe onboarding link has expired. Click below to get a new link
          and continue setting up your payout account.
        </p>
        <button
          onClick={handleResume}
          disabled={loading}
          className="w-full bg-[#e63946] hover:bg-[#c1121f] text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-60"
        >
          {loading ? "Loading..." : "Resume setup"}
        </button>
      </div>
    </div>
  );
}
