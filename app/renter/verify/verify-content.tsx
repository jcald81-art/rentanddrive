'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Camera, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  Lock,
  FileText,
  User
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function VerifyContent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)
  const [checking, setChecking] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    checkVerificationStatus()
    
    // Check URL params for verification result
    if (searchParams.get('verified') === 'true') {
      setVerified(true)
    }
    if (searchParams.get('error') === 'true') {
      setError('Verification failed. Please try again.')
    }
  }, [searchParams])

  async function checkVerificationStatus() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login?redirect=/renter/verify')
      return
    }

    // Check if already verified
    const { data: profile } = await supabase
      .from('profiles')
      .select('identity_verified, identity_verification_status')
      .eq('id', user.id)
      .single()

    if (profile?.identity_verified) {
      setVerified(true)
    }
    
    setChecking(false)
  }

  async function startVerification() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/verify/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start verification')
      }

      // Redirect to Stripe Identity hosted verification
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Success state
  if (verified) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-4">You&apos;re Verified!</h1>
              <p className="text-muted-foreground text-lg">
                Your identity has been confirmed. You can now book any vehicle on Rent and Drive.
              </p>
            </div>
            
            <Link href="/vehicles">
              <Button size="lg" className="bg-[#CC0000] hover:bg-[#AA0000]">
                Find a Car
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-16">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-[#CC0000]/10 text-[#CC0000] border-[#CC0000]/20">
            <Shield className="mr-1 h-3 w-3" />
            Secure Verification
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4 md:text-5xl">
            Verify Your Identity to Start Renting
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Quick, secure, one-time verification. Takes 2 minutes.
          </p>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
              <Lock className="h-4 w-4" />
              Bank-level encryption
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
              <FileText className="h-4 w-4" />
              Data never sold
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
              <CheckCircle2 className="h-4 w-4" />
              One-time only
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Explainer */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-[#CC0000]/10 rounded-full flex items-center justify-center mb-4">
                <Camera className="h-8 w-8 text-[#CC0000]" />
              </div>
              <div className="text-sm font-medium text-[#CC0000] mb-2">Step 1</div>
              <h3 className="font-semibold mb-2">Photo of Your License</h3>
              <p className="text-sm text-muted-foreground">
                Take a photo of your driver&apos;s license front and back
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-[#CC0000]/10 rounded-full flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-[#CC0000]" />
              </div>
              <div className="text-sm font-medium text-[#CC0000] mb-2">Step 2</div>
              <h3 className="font-semibold mb-2">Quick Selfie</h3>
              <p className="text-sm text-muted-foreground">
                Take a quick selfie to match your face to your ID
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-[#CC0000]/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-[#CC0000]" />
              </div>
              <div className="text-sm font-medium text-[#CC0000] mb-2">Step 3</div>
              <h3 className="font-semibold mb-2">Verified Instantly</h3>
              <p className="text-sm text-muted-foreground">
                Get verified instantly and start booking
              </p>
            </div>
          </div>

          {/* Verification Card */}
          <Card className="max-w-lg mx-auto border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Identity Verification</h2>
                <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                  Not Verified
                </Badge>
              </div>

              <p className="text-muted-foreground mb-6">
                <span className="font-medium text-foreground">$2.00 verification fee</span> — applied as rental credit on your first booking
              </p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button 
                onClick={startVerification}
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold h-12"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Starting Verification...
                  </>
                ) : (
                  <>
                    Start Verification
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              {/* Legal Copy */}
              <p className="mt-6 text-xs text-muted-foreground text-center">
                Your identity documents are processed by Stripe Identity and stored securely. 
                rentanddrive.net does not store copies of your license or biometric data.{' '}
                <Link href="/privacy" className="underline hover:text-foreground">
                  View our Privacy Policy
                </Link>.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
