"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

type AuthMode = "signin" | "signup" | "reset";

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const redirectTo = searchParams.get("redirect") ?? "/dashboard";

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace(redirectTo);
      } else {
        setCheckingSession(false);
      }
    });
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        router.replace(redirectTo);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [redirectTo]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (err) { setError(friendlyError(err.message)); setLoading(false); }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (err) { setError(friendlyError(err.message)); setLoading(false); return; }
    if (data.session) { router.replace(redirectTo); return; }
    setSuccess("Check your email to confirm your account, then return to complete your booking.");
    setLoading(false);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/auth/update-password?redirect=${encodeURIComponent(redirectTo)}` }
    );
    if (err) { setError(friendlyError(err.message)); } 
    else { setSuccess("Password reset link sent. Check your email."); }
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-white/40 text-sm">Checking session…</p>
        </div>
      </div>
    );
  }

  const isBookingRedirect = redirectTo.includes("/booking/");

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#e63946] flex items-center justify-center">
            <span className="text-white text-xs font-black">R</span>
          </div>
          <span className="font-bold text-lg tracking-tight">Rent and Drive</span>
        </div>
      </Link>

      {isBookingRedirect && (
        <div className="w-full max-w-md mb-4 bg-[#e63946]/10 border border-[#e63946]/30 rounded-xl px-4 py-3">
          <p className="text-[#e63946] text-sm font-medium">🚗 Sign in to complete your booking</p>
          <p className="text-white/50 text-xs mt-0.5">You'll be returned to your reservation immediately after.</p>
        </div>
      )}

      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {mode !== "reset" && (
          <div className="flex border-b border-white/10">
            <button
              onClick={() => { setMode("signin"); setError(null); setSuccess(null); }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === "signin" ? "text-white border-b-2 border-[#e63946]" : "text-white/40 hover:text-white/70"}`}
            >Sign In</button>
            <button
              onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === "signup" ? "text-white border-b-2 border-[#e63946]" : "text-white/40 hover:text-white/70"}`}
            >Create Account</button>
          </div>
        )}

        <div className="p-6 space-y-5">
          {mode === "reset" && (
            <div>
              <button onClick={() => { setMode("signin"); setError(null); setSuccess(null); }} className="text-white/40 hover:text-white text-sm flex items-center gap-1 mb-4">← Back to sign in</button>
              <h2 className="text-lg font-bold">Reset your password</h2>
              <p className="text-white/50 text-sm mt-1">We'll email you a reset link.</p>
            </div>
          )}

          {mode !== "reset" && (
            <>
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-60 text-sm"
              >
                <GoogleIcon /> Continue with Google
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
            </>
          )}

          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}
          {success && <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm">{success}</div>}

          {!success && (
            <form onSubmit={mode === "signin" ? handleSignIn : mode === "signup" ? handleSignUp : handleReset} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs text-white/50 mb-1.5 font-medium">Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="John Smith"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#e63946] transition-colors" />
                </div>
              )}

              <div>
                <label className="block text-xs text-white/50 mb-1.5 font-medium">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#e63946] transition-colors" />
              </div>

              {mode !== "reset" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs text-white/50 font-medium">Password</label>
                    {mode === "signin" && (
                      <button type="button" onClick={() => { setMode("reset"); setError(null); setSuccess(null); }}
                        className="text-xs text-[#e63946] hover:text-[#ff6b6b] transition-colors">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#e63946] transition-colors"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                  {mode === "signup" && password.length > 0 && <PasswordStrength password={password} />}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-[#e63946] hover:bg-[#c1121f] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 mt-2">
                {loading ? <><Spinner />{mode === "signin" ? "Signing in…" : mode === "signup" ? "Creating account…" : "Sending reset link…"}</> 
                  : mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>

        <div className="px-6 pb-6 text-center">
          <p className="text-white/30 text-xs">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-white/50 underline hover:text-white">Terms of Service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-white/50 underline hover:text-white">Privacy Policy</Link>
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-6 text-white/25 text-xs">
        <span>🔒 256-bit encryption</span>
        <span>✓ PCI compliant</span>
        <span>✓ SOC 2</span>
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const score = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
  const labels = ["Weak", "Fair", "Good", "Strong"];
  return (
    <div className="mt-2">
      <div className="flex gap-1">{[0,1,2,3].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score-1] : "bg-white/10"}`} />)}</div>
      <p className="text-xs text-white/40 mt-1">{score > 0 ? labels[score-1] : ""}</p>
    </div>
  );
}

function Spinner() {
  return <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>;
}

function Eye() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;
}

function EyeOff() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>;
}

function GoogleIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>;
}

function friendlyError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Incorrect email or password.";
  if (msg.includes("Email not confirmed")) return "Please confirm your email first.";
  if (msg.includes("User already registered")) return "Account exists. Sign in instead.";
  if (msg.includes("rate limit")) return "Too many attempts. Wait a moment and try again.";
  return msg;
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center"><div className="animate-pulse text-white/30 text-sm">Loading…</div></div>}>
      <SignInContent />
    </Suspense>
  );
}
