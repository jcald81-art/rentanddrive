'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Loader2, Car, User } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'renter' | 'host'>('renter')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://rentanddrive.net/callback',
        data: { full_name: fullName, role: role },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      setSuccess(true)
    }
    setLoading(false)
  }

  async function handleGoogleSignUp() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `https://rentanddrive.net/callback?role=${role}` },
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="text-gray-400">We sent a verification link to <span className="text-white font-medium">{email}</span></p>
          <p className="text-gray-500 text-sm">Click the link in your email to complete your registration.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-[#0f172a]">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
          <Logo size="lg" />
          <h2 className="text-3xl font-bold text-white mt-8 text-center">Join Rent and Drive</h2>
          <p className="text-gray-400 mt-4 text-center max-w-md">Rent unique vehicles from local hosts or earn money sharing your car, motorcycle, or RV.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center mb-8">
            <Logo size="lg" />
          </div>
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-gray-400">Start your adventure today</p>
          </div>
          <div className="flex gap-2 p-1 bg-[#1e293b] rounded-lg">
            <button type="button" onClick={() => setRole('renter')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md transition-colors ${role === 'renter' ? 'bg-[#f97316] text-white' : 'text-gray-400 hover:text-white'}`}>
              <User className="h-4 w-4" />
              Renter
            </button>
            <button type="button" onClick={() => setRole('host')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md transition-colors ${role === 'host' ? 'bg-[#f97316] text-white' : 'text-gray-400 hover:text-white'}`}>
              <Car className="h-4 w-4" />
              Host
            </button>
          </div>
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && <div className="p-3 text-sm text-red-400 bg-red-500/10 rounded-md border border-red-500/20">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
              <Input id="fullName" type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="bg-[#1e293b] border-gray-700 text-white placeholder:text-gray-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-[#1e293b] border-gray-700 text-white placeholder:text-gray-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <Input id="password" type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-[#1e293b] border-gray-700 text-white placeholder:text-gray-500" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0f172a] px-2 text-gray-500">Or continue with</span></div>
          </div>
          <Button type="button" variant="outline" onClick={handleGoogleSignUp} disabled={loading} className="w-full border-gray-700 text-white hover:bg-[#1e293b]">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Continue with Google
          </Button>
          <p className="text-center text-sm text-gray-500">Already have an account? <Link href="/sign-in" className="text-[#f97316] hover:underline">Sign in</Link></p>
        </div>
      </div>
    </div>
  )
}
