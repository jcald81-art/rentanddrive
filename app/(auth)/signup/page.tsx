'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
      setSuccess(true)
      setLoading(false)
    }
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://rentanddrive.net/callback' }
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="text-gray-400">We sent a confirmation link to {email}</p>
          <Link href="/login" className="text-[#f97316] hover:underline">Back to login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400">Join Rent and Drive today</p>
        </div>
        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-[#1e293b] border-gray-700 text-white" />
          </div>
          <div>
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="bg-[#1e293b] border-gray-700 text-white" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#f97316] hover:bg-[#ea580c]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign Up'}
          </Button>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-[#0f172a] px-2 text-gray-500">Or</span></div>
        </div>
        <Button type="button" variant="outline" onClick={handleGoogle} className="w-full border-gray-700 text-white hover:bg-[#1e293b]">Continue with Google</Button>
        <p className="text-center text-gray-400 text-sm">Already have an account? <Link href="/login" className="text-[#f97316] hover:underline">Sign in</Link></p>
      </div>
    </div>
  )
}
