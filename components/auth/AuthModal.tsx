'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, X, Eye, EyeOff, Mail, ExternalLink } from 'lucide-react'

// Email provider detection and webmail URLs
const EMAIL_PROVIDERS: Record<string, { name: string; url: string; icon?: string }> = {
  'gmail.com': { name: 'Gmail', url: 'https://mail.google.com' },
  'googlemail.com': { name: 'Gmail', url: 'https://mail.google.com' },
  'outlook.com': { name: 'Outlook', url: 'https://outlook.live.com' },
  'hotmail.com': { name: 'Outlook', url: 'https://outlook.live.com' },
  'live.com': { name: 'Outlook', url: 'https://outlook.live.com' },
  'msn.com': { name: 'Outlook', url: 'https://outlook.live.com' },
  'yahoo.com': { name: 'Yahoo Mail', url: 'https://mail.yahoo.com' },
  'yahoo.co.uk': { name: 'Yahoo Mail', url: 'https://mail.yahoo.com' },
  'ymail.com': { name: 'Yahoo Mail', url: 'https://mail.yahoo.com' },
  'icloud.com': { name: 'iCloud Mail', url: 'https://www.icloud.com/mail' },
  'me.com': { name: 'iCloud Mail', url: 'https://www.icloud.com/mail' },
  'mac.com': { name: 'iCloud Mail', url: 'https://www.icloud.com/mail' },
  'protonmail.com': { name: 'ProtonMail', url: 'https://mail.proton.me' },
  'proton.me': { name: 'ProtonMail', url: 'https://mail.proton.me' },
  'aol.com': { name: 'AOL Mail', url: 'https://mail.aol.com' },
  'zoho.com': { name: 'Zoho Mail', url: 'https://mail.zoho.com' },
  'fastmail.com': { name: 'Fastmail', url: 'https://www.fastmail.com' },
  'tutanota.com': { name: 'Tutanota', url: 'https://mail.tutanota.com' },
  'gmx.com': { name: 'GMX', url: 'https://www.gmx.com' },
  'gmx.net': { name: 'GMX', url: 'https://www.gmx.net' },
  'mail.com': { name: 'Mail.com', url: 'https://www.mail.com' },
}

function getEmailProvider(email: string): { name: string; url: string } | null {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null
  return EMAIL_PROVIDERS[domain] || null
}
import Image from 'next/image'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'signin' | 'signup'
  redirectTo?: string
}

export function AuthModal({ isOpen, onClose, defaultMode = 'signin', redirectTo = '/dashboard' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Detect email provider for smart "Open Email" button
  const emailProvider = useMemo(() => getEmailProvider(email), [email])

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError(null)
    setSuccessMessage(null)
  }

  const switchMode = (newMode: 'signin' | 'signup') => {
    resetForm()
    setMode(newMode)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        onClose()
        // Use window.location to avoid router initialization issues
        window.location.href = redirectTo
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}` 
          }
        })
        if (error) throw error
        setSuccessMessage('Check your email for a confirmation link!')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      })
      if (error) throw error
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/70 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="fixed top-[50%] left-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-[420px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          {/* Accessibility: Hidden title for screen readers */}
          <VisuallyHidden.Root>
            <DialogPrimitive.Title>
              {mode === 'signin' ? 'Sign in to Rent and Drive' : 'Create a Rent and Drive account'}
            </DialogPrimitive.Title>
          </VisuallyHidden.Root>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-white" />
          </button>

          {/* Logo Header with Brand Image */}
          <div className="relative h-48 bg-[#1C1F1A] rounded-t-2xl overflow-hidden">
            <Image
              src="/images/rad-brand-logo.png"
              alt="Rent and Drive"
              fill
              sizes="420px"
              className="object-contain p-6"
              priority
            />
            {/* Gradient overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1C1F1A] to-transparent" />
          </div>

          {/* Form Content */}
          <div className="bg-[#1C1F1A] rounded-b-2xl px-8 pb-8 pt-2">
            {/* Mode Toggle */}
            <div className="flex bg-[#262A24] rounded-full p-1 mb-6">
              <button
                onClick={() => switchMode('signin')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all ${
                  mode === 'signin'
                    ? 'bg-[#C4813A] text-white shadow-lg'
                    : 'text-[#A8B5A8] hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all ${
                  mode === 'signup'
                    ? 'bg-[#C4813A] text-white shadow-lg'
                    : 'text-[#A8B5A8] hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Success Message with Smart Email Button */}
            {successMessage && (
              <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <p className="text-green-400 text-sm text-center mb-3">
                  {successMessage}
                </p>
                {emailProvider ? (
                  <a
                    href={emailProvider.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg font-medium text-sm transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    Open {emailProvider.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-xs text-green-400/70 text-center">
                    Check your inbox at {email.split('@')[1]}
                  </p>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="auth-email" className="text-[#A8B5A8] text-sm">
                  Email
                </Label>
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 bg-[#262A24] border-[#3D4A3D] text-white placeholder:text-[#6B7B6B] focus:border-[#C4813A] focus:ring-[#C4813A] rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth-password" className="text-[#A8B5A8] text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'signup' ? 'Create a password' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 bg-[#262A24] border-[#3D4A3D] text-white placeholder:text-[#6B7B6B] focus:border-[#C4813A] focus:ring-[#C4813A] rounded-xl pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7B6B] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {mode === 'signin' && (
                <div className="flex justify-end">
                  <Link 
                    href="/forgot-password" 
                    onClick={onClose}
                    className="text-sm text-[#C4813A] hover:text-[#D4915A] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#C4813A] hover:bg-[#B4712A] text-white font-semibold rounded-xl shadow-lg shadow-[#C4813A]/20 transition-all hover:shadow-xl hover:shadow-[#C4813A]/30"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  mode === 'signin' ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#3D4A3D]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#1C1F1A] text-[#6B7B6B] uppercase tracking-wider">or</span>
              </div>
            </div>

            {/* Google OAuth */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 bg-card hover:bg-muted text-card-foreground border border-border font-medium rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Terms */}
            {mode === 'signup' && (
              <p className="mt-4 text-center text-xs text-[#6B7B6B]">
                By creating an account, you agree to our{' '}
                <Link href="/terms" onClick={onClose} className="text-[#C4813A] hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" onClick={onClose} className="text-[#C4813A] hover:underline">
                  Privacy Policy
                </Link>
              </p>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

// Standalone page wrapper that shows the modal over a nice background with navbar
export function AuthPage({ defaultMode = 'signin', redirectTo = '/dashboard' }: { defaultMode?: 'signin' | 'signup'; redirectTo?: string }) {
  const [isOpen, setIsOpen] = useState(true)
  
  const handleClose = () => {
    setIsOpen(false)
    // Use window.location to avoid router initialization issues
    window.location.href = '/'
  }
  
  return (
    <div className="min-h-screen bg-[#1C1F1A] relative">
      {/* Background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1C1F1A] via-[#252923] to-[#1C1F1A]" />
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Centered Modal */}
      <AuthModal 
        isOpen={isOpen} 
        onClose={handleClose} 
        defaultMode={defaultMode}
        redirectTo={redirectTo}
      />
    </div>
  )
}
