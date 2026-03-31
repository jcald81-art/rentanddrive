'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2, Eye, EyeOff, Lock, ShieldCheck, CreditCard } from 'lucide-react'

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/dashboard'
  const isBookingRedirect = redirectTo.includes('/booking/')

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  const supabase = createClient()

  // Check if already signed in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.replace(decodeURIComponent(redirectTo))
      } else {
        setCheckingSession(false)
      }
    }
    checkSession()
  }, [supabase, router, redirectTo])

  // Listen for auth state changes (for email/password sign in)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.replace(decodeURIComponent(redirectTo))
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase, router, redirectTo])

  const getPasswordStrength = useCallback(() => {
    if (!password) return 0
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++
    return strength
  }, [password])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Invalid email or password. Please try again.'
          : error.message
      )
      setLoading(false)
    }
    // Success handled by onAuthStateChange
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: callbackUrl,
        data: { full_name: fullName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setMessage('Check your email for a confirmation link.')
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const redirectUrl = `${window.location.origin}/auth/update-password?redirect=${encodeURIComponent(redirectTo)}`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for a password reset link.')
    }
    setLoading(false)
  }

  const handleGoogleOAuth = async () => {
    setLoading(true)
    setError(null)

    const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-white" />
      </div>
    )
  }

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
  const strength = getPasswordStrength()

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-3">
        <div className="relative size-10 rounded-full bg-[#e63946] flex items-center justify-center">
          <span className="text-white font-bold text-xl">R</span>
        </div>
        <span className="text-white text-xl font-semibold">Rent and Drive</span>
      </Link>

      {/* Booking Redirect Banner */}
      {isBookingRedirect && (
        <div className="mb-6 max-w-md w-full p-4 rounded-lg border border-[#e63946]/30 bg-[#e63946]/10">
          <p className="text-sm text-[#e63946] text-center">
            Sign in to complete your booking — you&apos;ll be returned to your reservation immediately.
          </p>
        </div>
      )}

      <Card className="w-full max-w-md bg-[#111827] border-gray-800">
        <CardHeader className="text-center pb-2">
          <h1 className="text-2xl font-bold text-white">
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'reset' && 'Reset Password'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {mode === 'signin' && 'Sign in to your RAD account'}
            {mode === 'signup' && 'Join RAD and start your adventure'}
            {mode === 'reset' && 'We&apos;ll send you a reset link'}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google OAuth */}
          {mode !== 'reset' && (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full bg-white hover:bg-gray-100 text-gray-900 border-0"
                onClick={handleGoogleOAuth}
                disabled={loading}
              >
                <Image
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#111827] px-2 text-gray-500">or</span>
                </div>
              </div>
            </>
          )}

          {/* Error/Message Display */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              {message}
            </div>
          )}

          {/* Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-[#1f2937] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-300">Password</Label>
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-xs text-[#e63946] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-[#1f2937] border-gray-700 text-white placeholder:text-gray-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#e63946] hover:bg-[#d62836] text-white"
                disabled={loading}
              >
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Sign In
              </Button>
            </form>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="bg-[#1f2937] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-[#1f2937] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="bg-[#1f2937] border-gray-700 text-white placeholder:text-gray-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {/* Password Strength Indicator */}
                {password && (
                  <div className="flex gap-1 mt-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i < strength ? strengthColors[strength - 1] : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-[#e63946] hover:bg-[#d62836] text-white"
                disabled={loading}
              >
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>
            </form>
          )}

          {/* Reset Password Form */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-[#1f2937] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#e63946] hover:bg-[#d62836] text-white"
                disabled={loading}
              >
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Send Reset Link
              </Button>
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="w-full text-sm text-gray-400 hover:text-white"
              >
                Back to sign in
              </button>
            </form>
          )}

          {/* Mode Toggle */}
          {mode !== 'reset' && (
            <p className="text-center text-sm text-gray-400">
              {mode === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-[#e63946] hover:underline"
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-[#e63946] hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Trust Signals */}
      <div className="mt-6 flex items-center gap-6 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Lock className="size-3" />
          256-bit encryption
        </span>
        <span className="flex items-center gap-1">
          <CreditCard className="size-3" />
          PCI compliant
        </span>
        <span className="flex items-center gap-1">
          <ShieldCheck className="size-3" />
          SOC 2
        </span>
      </div>

      {/* Footer Links */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <Link href="/terms" className="hover:text-white">Terms of Service</Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-white" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
