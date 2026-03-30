'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/logo'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: 'https://rentanddrive.net/callback' }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/signup/verify')
    }
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://rentanddrive.net/callback' }
    })
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Logo size="lg" />
          <h1 className="mt-6 text-3xl font-bold text-white">Create account</h1>
          <p className="mt-2 text-gray-400">Start your journey with Rent and Drive</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">{error}</div>}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 bg-white/10 border-white/20 text-white" placeholder="you@example.com" />
            </div>
            <div>
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 bg-white/10 border-white/20 text-white" placeholder="Create a password" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#f97316] hover:bg-[#ea580c]">{loading ? 'Creating...' : 'Create Account'}</Button>
        </form>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/20" /></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-[#0f172a] text-gray-400">Or</span></div>
        </div>
        <Button onClick={handleGoogle} variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">Continue with Google</Button>
        <p className="text-center text-gray-400">Already have an account? <Link href="/login" className="text-[#f97316] hover:underline">Sign in</Link></p>
      </div>
    </div>
  )
}
