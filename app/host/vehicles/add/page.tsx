"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

// ─── Types ────────────────────────────────────────────────────────────────────
interface VehicleData {
  vin: string; year: string; make: string; model: string; trim: string;
  engine: string; drivetrain: string; fuel_type: string; mileage: string;
  daily_rate: number; location: string;
  features: string[]; adventure_tags: string[];
  description: string;
}

interface PhotoSlot {
  angle: string; label: string; required: boolean;
  url?: string; path?: string; score?: string; tip?: string;
}

interface RecallStatus {
  count: number; inspektlabs: { status: string; label: string; color: string };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_FEATURES = [
  "AWD/4WD", "Bluetooth", "Apple CarPlay", "Android Auto", "Backup Camera",
  "Heated Seats", "Sunroof/Panorama", "Ski Rack", "Roof Box", "Tow Hitch",
  "USB Charging", "Keyless Entry", "Pet Friendly", "Child Seat Available",
  "Snow Chains", "Bike Rack", "Cooler/Fridge", "Starlink WiFi",
];

const ADVENTURE_TAGS = [
  "Ski/Snowboard", "Mountain Biking", "Camping", "Beach", "Off-Road",
  "Road Trip", "Rock Climbing", "Kayaking", "Hunting/Fishing", "Eco-Friendly",
];

const PHOTO_SLOTS: PhotoSlot[] = [
  { angle: "front", label: "Front", required: true },
  { angle: "front_three_quarter", label: "3/4 Front", required: true },
  { angle: "left_side", label: "Left Side", required: true },
  { angle: "right_side", label: "Right Side", required: true },
  { angle: "back", label: "Back", required: true },
  { angle: "back_three_quarter", label: "3/4 Back", required: false },
  { angle: "dashboard", label: "Dashboard", required: true },
  { angle: "back_seat", label: "Back Seat", required: false },
  { angle: "trunk", label: "Trunk", required: false },
];

const DRAFT_KEY = "rad-listing-draft";

function currency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

// ─── Earnings Calculator ──────────────────────────────────────────────────────
function EarningsBar({ dailyRate, daysPerMonth = 15 }: { dailyRate: number; daysPerMonth?: number }) {
  const rad = dailyRate * daysPerMonth * 0.90;
  const turoLow = dailyRate * daysPerMonth * 0.65;
  const turoHigh = dailyRate * daysPerMonth * 0.75;
  const delta = Math.round(rad - turoHigh);
  if (dailyRate < 1) return null;
  return (
    <div className="bg-[#e63946]/5 border border-[#e63946]/20 rounded-2xl p-4 mt-4">
      <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Monthly earnings at {daysPerMonth} days/mo</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
          <p className="text-xs text-green-400/70 mb-1">RAD (10% fee)</p>
          <p className="text-2xl font-bold text-green-400">{currency(rad)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-xs text-white/30 mb-1">Turo (25–35% fee)</p>
          <p className="text-2xl font-bold text-white/40">{currency(turoLow)}–{currency(turoHigh)}</p>
        </div>
      </div>
      {delta > 0 && (
        <div className="mt-3 text-center">
          <span className="text-[#e63946] font-bold text-sm">
            You earn {currency(delta)}+ MORE per month with RAD
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Step 1: Vehicle Details ──────────────────────────────────────────────────
function StepDetails({
  data, setData, onNext
}: {
  data: VehicleData;
  setData: (d: Partial<VehicleData>) => void;
  onNext: () => void;
}) {
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState<string | null>(null);
  const [recalls, setRecalls] = useState<RecallStatus | null>(null);
  const [pricingSuggestion, setPricingSuggestion] = useState<string | null>(null);

  async function decodeVin(vin: string) {
    if (vin.length !== 17) return;
    setVinLoading(true);
    setVinError(null);
    try {
      const res = await fetch("/api/vehicles/vin-decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin }),
      });
      const result = await res.json();
      if (result.error) { setVinError(result.error); return; }
      setData({
        year: result.vehicle.year ?? "",
        make: result.vehicle.make ?? "",
        model: result.vehicle.model ?? "",
        trim: result.vehicle.trim ?? "",
        engine: result.vehicle.engine ?? "",
        drivetrain: result.vehicle.drivetrain ?? "",
        fuel_type: result.vehicle.fuel_type ?? "",
        features: result.detected_features ?? [],
        adventure_tags: result.suggested_tags ?? [],
        daily_rate: result.pricing?.suggested_daily_rate ?? data.daily_rate,
      });
      setRecalls(result.recalls);
      setPricingSuggestion(result.pricing?.market_note ?? null);
    } catch {
      setVinError("VIN decode failed. Fill in details manually.");
    } finally {
      setVinLoading(false);
    }
  }

  function toggleFeature(f: string) {
    const has = data.features.includes(f);
    setData({ features: has ? data.features.filter(x => x !== f) : [...data.features, f] });
  }

  function toggleTag(t: string) {
    const has = data.adventure_tags.includes(t);
    setData({ adventure_tags: has ? data.adventure_tags.filter(x => x !== t) : [...data.adventure_tags, t] });
  }

  const canProceed = data.make && data.model && data.year && data.daily_rate > 0 && data.location;

  return (
    <div className="space-y-6">
      {/* VIN input */}
      <div>
        <label className="block text-xs text-white/50 mb-2 font-medium uppercase tracking-wider">
          VIN — auto-fills everything
        </label>
        <div className="relative">
          <input
            type="text"
            value={data.vin}
            onChange={e => setData({ vin: e.target.value.toUpperCase() })}
            onBlur={e => decodeVin(e.target.value)}
            maxLength={17}
            placeholder="17-character VIN"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 text-sm font-mono focus:outline-none focus:border-[#e63946] transition-colors pr-32"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className={`text-xs font-mono ${data.vin.length === 17 ? "text-green-400" : "text-white/20"}`}>
              {data.vin.length}/17
            </span>
            {vinLoading && <Spinner />}
          </div>
        </div>
        {vinError && <p className="text-red-400 text-xs mt-1">{vinError}</p>}
        {recalls && (
          <div className={`flex items-center gap-2 mt-2 text-xs font-medium ${recalls.inspektlabs.color === "green" ? "text-green-400" : "text-red-400"}`}>
            {recalls.inspektlabs.color === "green" ? "✓" : "⚠"} Inspektlabs: {recalls.inspektlabs.label}
          </div>
        )}
        <p className="text-white/25 text-xs mt-1">Find your VIN on the dashboard, door jamb, or title</p>
      </div>

      {/* Vehicle fields grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: "year", label: "Year", placeholder: "2020" },
          { key: "make", label: "Make", placeholder: "Subaru" },
          { key: "model", label: "Model", placeholder: "Outback" },
          { key: "trim", label: "Trim (optional)", placeholder: "Touring" },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-xs text-white/40 mb-1.5 font-medium">{label}</label>
            <input
              type="text"
              value={data[key as keyof VehicleData] as string}
              onChange={e => setData({ [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#e63946] transition-colors"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs text-white/40 mb-1.5 font-medium">Mileage</label>
          <input
            type="number"
            value={data.mileage}
            onChange={e => setData({ mileage: e.target.value })}
            placeholder="85000"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#e63946] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1.5 font-medium">Location</label>
          <input
            type="text"
            value={data.location}
            onChange={e => setData({ location: e.target.value })}
            placeholder="Reno, NV"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#e63946] transition-colors"
          />
        </div>
      </div>

      {/* Daily rate + earnings calculator */}
      <div>
        <label className="block text-xs text-white/40 mb-1.5 font-medium">Daily Rate (USD)</label>
        {pricingSuggestion && (
          <p className="text-green-400/70 text-xs mb-2">RAD Pricing: {pricingSuggestion}</p>
        )}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
          <input
            type="number"
            value={data.daily_rate || ""}
            onChange={e => setData({ daily_rate: parseFloat(e.target.value) || 0 })}
            placeholder="115"
            min="25" max="2000"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 pl-8 text-white placeholder-white/20 text-2xl font-bold focus:outline-none focus:border-[#e63946] transition-colors"
          />
        </div>
        <EarningsBar dailyRate={data.daily_rate} />
      </div>

      {/* Features */}
      <div>
        <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">Features</label>
        <div className="flex flex-wrap gap-2">
          {ALL_FEATURES.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => toggleFeature(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                data.features.includes(f)
                  ? "bg-[#e63946]/20 border-[#e63946]/50 text-[#e63946]"
                  : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Adventure tags */}
      <div>
        <label className="block text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">
          Adventure Tags — RAD exclusive
        </label>
        <div className="flex flex-wrap gap-2">
          {ADVENTURE_TAGS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                data.adventure_tags.includes(t)
                  ? "bg-green-500/20 border-green-500/40 text-green-400"
                  : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full bg-[#e63946] hover:bg-[#c1121f] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors"
      >
        Next: Add Photos →
      </button>
    </div>
  );
}

// ─── Step 2: Photos ───────────────────────────────────────────────────────────
function StepPhotos({
  photos, setPhotos, onNext, onBack
}: {
  photos: PhotoSlot[];
  setPhotos: (p: PhotoSlot[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  const completedRequired = photos.filter(p => p.required && p.url).length;
  const totalRequired = photos.filter(p => p.required).length;
  const canProceed = completedRequired >= totalRequired;

  async function uploadPhoto(file: File, angle: string) {
    setUploading(angle);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      fd.append("angle", angle);

      const res = await fetch("/api/vehicles/validate-photo", {
        method: "POST",
        body: fd,
      });
      const result = await res.json();

      setPhotos(photos.map(p =>
        p.angle === angle
          ? { ...p, url: result.url, path: result.path, score: result.score, tip: result.tip }
          : p
      ));
    } catch {
      // Handle error
    } finally {
      setUploading(null);
    }
  }

  function handleFiles(files: FileList, angle: string) {
    const file = files[0];
    if (!file) return;
    uploadPhoto(file, angle);
  }

  function openPhotoOptions(angle: string) {
    setActiveSlot(angle);
    setShowPhotoOptions(true);
  }

  function useCamera() {
    setShowPhotoOptions(false);
    cameraInputRef.current?.click();
  }

  function useGallery() {
    setShowPhotoOptions(false);
    fileInputRef.current?.click();
  }

  return (
    <div className="space-y-6">
      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => {
          if (e.target.files && activeSlot) handleFiles(e.target.files, activeSlot);
          e.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,image/heic,image/heif"
        multiple
        className="hidden"
        onChange={e => {
          if (e.target.files && activeSlot) handleFiles(e.target.files, activeSlot);
          e.target.value = "";
        }}
      />

      {/* Progress */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/50">Required angles</span>
          <span className={completedRequired >= totalRequired ? "text-green-400" : "text-white/50"}>
            {completedRequired}/{totalRequired} complete
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#e63946] rounded-full transition-all"
            style={{ width: `${(completedRequired / totalRequired) * 100}%` }}
          />
        </div>
      </div>

      {/* Tips */}
      <div className="grid grid-cols-2 gap-2">
        {["Shoot in daylight", "Whole car in frame", "Open/scenic location", "Clean interior"].map(tip => (
          <div key={tip} className="bg-white/5 rounded-lg px-3 py-2 text-xs text-white/40 flex items-center gap-2">
            <span className="text-[#e63946]">✓</span>{tip}
          </div>
        ))}
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-3 gap-3">
        {photos.map(slot => (
          <button
            key={slot.angle}
            type="button"
            onClick={() => openPhotoOptions(slot.angle)}
            disabled={uploading === slot.angle}
            className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${
              slot.url
                ? slot.score === "excellent" ? "border-green-500" : slot.score === "needs_retake" ? "border-yellow-500" : "border-green-500/50"
                : slot.required ? "border-white/20 border-dashed hover:border-[#e63946]/50" : "border-white/10 border-dashed hover:border-white/20"
            }`}
          >
            {slot.url ? (
              <>
                <img src={slot.url} alt={slot.label} className="w-full h-full object-cover" />
                <div className="absolute top-1 right-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                    slot.score === "excellent" ? "bg-green-500 text-white" :
                    slot.score === "needs_retake" ? "bg-yellow-500 text-black" : "bg-green-400/80 text-white"
                  }`}>
                    {slot.score === "excellent" ? "✓" : slot.score === "needs_retake" ? "!" : "✓"}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-1 text-center">
                  {slot.label}
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                {uploading === slot.angle ? (
                  <Spinner />
                ) : (
                  <>
                    <span className="text-2xl">📷</span>
                    <span className="text-[10px] text-white/40 text-center px-1">{slot.label}</span>
                    {slot.required && <span className="text-[9px] text-[#e63946]">required</span>}
                  </>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Photo source modal */}
      {showPhotoOptions && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4"
          onClick={() => setShowPhotoOptions(false)}>
          <div className="w-full max-w-sm bg-[#1a1f2e] rounded-2xl border border-white/10 overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-white/10">
              <p className="font-semibold">Add photo — {photos.find(p => p.angle === activeSlot)?.label}</p>
              <p className="text-white/40 text-xs mt-1">Choose how to add this photo</p>
            </div>
            <div className="p-3 space-y-2">
              <button
                onClick={useCamera}
                className="w-full flex items-center gap-4 px-4 py-4 bg-[#e63946]/10 border border-[#e63946]/20 rounded-xl hover:bg-[#e63946]/20 transition-colors"
              >
                <span className="text-2xl">📱</span>
                <div className="text-left">
                  <p className="font-semibold text-sm">Take photo now</p>
                  <p className="text-white/40 text-xs">Use your phone camera directly</p>
                </div>
              </button>
              <button
                onClick={useGallery}
                className="w-full flex items-center gap-4 px-4 py-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
              >
                <span className="text-2xl">🖼</span>
                <div className="text-left">
                  <p className="font-semibold text-sm">Choose from gallery</p>
                  <p className="text-white/40 text-xs">Upload existing photos</p>
                </div>
              </button>
            </div>
            <div className="px-5 pb-5">
              <button onClick={() => setShowPhotoOptions(false)}
                className="w-full py-3 text-white/40 text-sm hover:text-white transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 bg-white/10 text-white font-semibold py-4 rounded-xl hover:bg-white/20 transition-colors">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-2 flex-grow-[2] bg-[#e63946] hover:bg-[#c1121f] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors"
        >
          Next: Payout →
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Payout + Publish ─────────────────────────────────────────────────
function StepPayout({
  data, photos, onBack
}: {
  data: VehicleData;
  photos: PhotoSlot[];
  onBack: () => void;
}) {
  const router = useRouter();
  const [stripeStatus, setStripeStatus] = useState<string>("checking");
  const [connecting, setConnecting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<{ vehicle_id: string; estimated_first_booking: string; earnings_preview: Record<string, string> } | null>(null);

  useEffect(() => {
    fetch("/api/hosts/stripe/onboard")
      .then(r => r.json())
      .then(d => setStripeStatus(d.status ?? "not_connected"))
      .catch(() => setStripeStatus("not_connected"));
  }, []);

  async function connectStripe() {
    setConnecting(true);
    const res = await fetch("/api/hosts/stripe/onboard", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setConnecting(false);
  }

  async function publish() {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/vehicles/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          photos: photos.filter(p => p.url).map(p => p.url),
        }),
      });
      const result = await res.json();
      if (result.error) { setError(result.error); return; }
      localStorage.removeItem(DRAFT_KEY);
      setPublished(result);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setPublishing(false);
    }
  }

  if (published) {
    return (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto text-4xl animate-bounce">🚗</div>
        <div>
          <h2 className="text-2xl font-bold">You're live!</h2>
          <p className="text-white/50 mt-1">
            {data.year} {data.make} {data.model} is now accepting bookings on RAD
          </p>
        </div>
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 text-left space-y-3">
          <p className="font-semibold text-sm">Estimated first booking: <span className="text-green-400">{published.estimated_first_booking}</span></p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-500/10 rounded-xl p-3">
              <p className="text-xs text-white/40">RAD/mo</p>
              <p className="font-bold text-green-400">${published.earnings_preview.monthly_15_days}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-white/40">Turo/mo</p>
              <p className="font-bold text-white/40">${published.earnings_preview.turo_equivalent}</p>
            </div>
            <div className="bg-[#e63946]/10 rounded-xl p-3">
              <p className="text-xs text-white/40">Extra</p>
              <p className="font-bold text-[#e63946]">+${published.earnings_preview.rad_advantage}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={() => router.push(`/vehicles/${published.vehicle_id}`)}
            className="w-full bg-[#e63946] text-white font-bold py-4 rounded-xl hover:bg-[#c1121f] transition-colors">
            View My Listing
          </button>
          <button onClick={() => router.push("/host/vehicles/add")}
            className="w-full bg-white/10 text-white font-semibold py-3 rounded-xl hover:bg-white/20 transition-colors text-sm">
            List Another Vehicle
          </button>
          <button onClick={() => router.push("/host/dashboard")}
            className="text-white/30 text-sm hover:text-white transition-colors">
            Go to Base Camp →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stripe status */}
      <div className={`rounded-2xl p-5 border ${
        stripeStatus === "active" ? "border-green-500/30 bg-green-500/5" :
        stripeStatus === "checking" ? "border-white/10 bg-white/5" :
        "border-[#e63946]/30 bg-[#e63946]/5"
      }`}>
        {stripeStatus === "checking" && (
          <div className="flex items-center gap-3"><Spinner /><p className="text-white/50 text-sm">Checking payout account…</p></div>
        )}
        {stripeStatus === "active" && (
          <div className="flex items-center gap-3">
            <span className="text-green-400 text-xl">✓</span>
            <div>
              <p className="font-semibold text-green-400 text-sm">Payout account connected</p>
              <p className="text-white/40 text-xs mt-0.5">You'll be paid within 1-2 business days after each trip</p>
            </div>
          </div>
        )}
        {(stripeStatus === "not_connected" || stripeStatus === "pending") && (
          <div className="space-y-3">
            <p className="font-semibold text-sm">
              {stripeStatus === "pending" ? "⏳ Stripe verification in progress" : "💳 Connect payout account"}
            </p>
            <p className="text-white/40 text-xs">
              {stripeStatus === "pending"
                ? "Stripe is verifying your info. You can publish once approved."
                : "Required to receive earnings. Takes 5 minutes. Powered by Stripe."}
            </p>
            {stripeStatus === "not_connected" && (
              <button onClick={connectStripe} disabled={connecting}
                className="w-full bg-[#e63946] text-white font-bold py-3 rounded-xl hover:bg-[#c1121f] transition-colors disabled:opacity-60 text-sm">
                {connecting ? "Connecting…" : "Connect Stripe — 5 minutes"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Listing summary */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-sm">Listing summary</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><p className="text-white/40 text-xs">Vehicle</p><p className="font-medium">{data.year} {data.make} {data.model}</p></div>
          <div><p className="text-white/40 text-xs">Daily rate</p><p className="font-medium text-green-400">${data.daily_rate}/day</p></div>
          <div><p className="text-white/40 text-xs">Location</p><p className="font-medium">{data.location}</p></div>
          <div><p className="text-white/40 text-xs">Photos</p><p className="font-medium">{photos.filter(p => p.url).length} uploaded</p></div>
        </div>
        {data.features.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 border-t border-white/10">
            {data.features.slice(0, 6).map(f => (
              <span key={f} className="text-[10px] px-2 py-0.5 bg-white/10 rounded-full text-white/50">{f}</span>
            ))}
          </div>
        )}
      </div>

      <EarningsBar dailyRate={data.daily_rate} />

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 bg-white/10 text-white font-semibold py-4 rounded-xl hover:bg-white/20 transition-colors">
          ← Back
        </button>
        <button
          onClick={publish}
          disabled={publishing || stripeStatus !== "active"}
          className="flex-2 flex-grow-[2] bg-[#e63946] hover:bg-[#c1121f] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {publishing ? <><Spinner /> Publishing…</> : "Publish Now"}
        </button>
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
  const steps = ["Vehicle Details", "Photos", "Payout & Publish"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
              i < step ? "bg-[#e63946] border-[#e63946] text-white" :
              i === step ? "border-[#e63946] text-[#e63946] bg-transparent" :
              "border-white/20 text-white/30 bg-transparent"
            }`}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={`text-[10px] mt-1 whitespace-nowrap ${i === step ? "text-white" : "text-white/30"}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mx-2 mb-4 transition-all ${i < step ? "bg-[#e63946]" : "bg-white/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function Spinner() {
  return <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AddVehiclePage() {
  const [step, setStep] = useState(0);
  const [data, setDataState] = useState<VehicleData>({
    vin: "", year: "", make: "", model: "", trim: "", engine: "",
    drivetrain: "", fuel_type: "", mileage: "", daily_rate: 0,
    location: "Reno, NV", features: [], adventure_tags: [], description: "",
  });
  const [photos, setPhotosState] = useState<PhotoSlot[]>(
    PHOTO_SLOTS.map(s => ({ ...s }))
  );

  // Auto-save draft
  function setData(partial: Partial<VehicleData>) {
    setDataState(prev => {
      const next = { ...prev, ...partial };
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: next, photos, step })); } catch {}
      return next;
    });
  }

  function setPhotos(p: PhotoSlot[]) {
    setPhotosState(p);
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, photos: p, step })); } catch {}
  }

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const { data: d, photos: p } = JSON.parse(saved);
        if (d) setDataState(d);
        if (p) setPhotosState(p);
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <header className="sticky top-0 z-40 bg-[#0a0f1e]/90 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#e63946] flex items-center justify-center">
              <span className="text-white text-xs font-black">R</span>
            </div>
            <span className="font-bold text-sm">List Your Vehicle</span>
          </div>
          <span className="text-white/30 text-xs">Step {step + 1} of 3</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <ProgressBar step={step} />

        {step === 0 && (
          <StepDetails data={data} setData={setData} onNext={() => setStep(1)} />
        )}
        {step === 1 && (
          <StepPhotos photos={photos} setPhotos={setPhotos} onNext={() => setStep(2)} onBack={() => setStep(0)} />
        )}
        {step === 2 && (
          <StepPayout data={data} photos={photos} onBack={() => setStep(1)} />
        )}
      </main>
    </div>
  );
}
