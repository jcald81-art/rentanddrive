'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setIsSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md">
        <div className="space-y-6 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
            <p className="text-muted-foreground">
              We sent a password reset link to <strong>{email}</strong>
            </p>
          </div>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open('https://mail.google.com', '_blank')}
            >
              <Mail className="mr-2 h-4 w-4" />
              Open Gmail
            </Button>
            <p className="text-sm text-muted-foreground">
              Didn&apos;t receive the email?{' '}
              <button
                onClick={() => setIsSuccess(false)}
                className="text-primary hover:underline"
              >
                Try again
              </button>
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      {/* Mobile branding */}
      <div className="lg:hidden mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#CC0000] rounded-lg flex items-center justify-center text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
          <span className="text-xl font-semibold">Rent and Drive</span>
        </div>
      </div>

      <div className="space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Link>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
          <p className="text-muted-foreground">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 bg-[#CC0000] hover:bg-[#CC0000]/90"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>
      </div>
    </div>
  )
}
