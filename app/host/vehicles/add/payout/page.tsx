'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, CreditCard, Loader2, ShieldCheck, Clock, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createBrowserClient } from '@supabase/ssr'

export default function PayoutPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [hasStripeConnect, setHasStripeConnect] = useState(false)
  const [listingData, setListingData] = useState<Record<string, unknown> | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Check Stripe Connect status
  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/signin?redirect=/host/vehicles/add/payout')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_connect_id, stripe_onboarding_complete')
        .eq('id', user.id)
        .single()

      setHasStripeConnect(profile?.stripe_onboarding_complete || false)
      setIsLoading(false)
    }

    checkStatus()

    // Load draft
    const draft = localStorage.getItem('rad-listing-draft')
    if (draft) {
      try {
        setListingData(JSON.parse(draft))
      } catch {}
    }
  }, [supabase, router])

  // Connect Stripe
  const handleConnectStripe = async () => {
    setIsConnecting(true)
    
    try {
      const response = await fetch('/api/hosts/stripe/onboard', {
        method: 'POST',
      })

      const { url, error } = await response.json()

      if (error) {
        console.error('Stripe onboard error:', error)
        setIsConnecting(false)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (err) {
      console.error('Failed to connect Stripe:', err)
      setIsConnecting(false)
    }
  }

  const handleContinue = () => {
    router.push('/host/vehicles/add/publish')
  }

  // Earnings calculations
  const dailyRate = listingData?.daily_rate ? parseFloat(String(listingData.daily_rate)) : 0
  const daysPerMonth = 15
  const radEarnings = Math.round(dailyRate * daysPerMonth * 0.90)
  const turoEarnings = Math.round(dailyRate * daysPerMonth * 0.70)
  const extraEarnings = radEarnings - turoEarnings

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#e63946] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Payout Setup</h1>
        <p className="text-white/60">
          Connect your bank account to receive earnings from your rentals.
        </p>
      </div>

      {/* Stripe Connect Status */}
      <Card className={`border-2 ${hasStripeConnect ? 'border-green-500 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
        <CardContent className="p-6">
          {hasStripeConnect ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Payout Account Connected</h3>
                <p className="text-white/60">You&apos;re ready to receive earnings</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white/60" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Connect Your Payout Account</h3>
                  <p className="text-white/60">Securely link your bank account via Stripe</p>
                </div>
              </div>
              
              <Button
                onClick={handleConnectStripe}
                disabled={isConnecting}
                size="lg"
                className="w-full bg-[#e63946] hover:bg-[#e63946]/80"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Connect with Stripe
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Schedule */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#e63946]" />
            Payout Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <p className="text-white">Paid within 1-2 business days after each completed trip</p>
              <p className="text-white/60 text-sm">No waiting for monthly payouts</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <p className="text-white">Direct deposit to your bank account</p>
              <p className="text-white/60 text-sm">Powered by Stripe for security</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <p className="text-white">Instant payout option available</p>
              <p className="text-white/60 text-sm">Get funds in minutes for a small fee</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Summary */}
      {dailyRate > 0 && (
        <Card className="bg-gradient-to-br from-[#e63946]/20 to-[#0a0f1e] border-[#e63946]/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#e63946]" />
              Your Earnings Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-white/60 text-sm mb-1">Your daily rate</p>
                <p className="text-2xl font-bold text-white">${dailyRate}/day</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-white/60 text-sm mb-1">Est. days/month</p>
                <p className="text-2xl font-bold text-white">{daysPerMonth} days</p>
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white">RAD monthly earnings (90%)</span>
                <span className="text-2xl font-bold text-[#e63946]">${radEarnings}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Turo would pay (70%)</span>
                <span className="text-lg text-white/40 line-through">${turoEarnings}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                <span className="text-green-400">Extra earnings with RAD</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-lg px-3 py-1">
                  +${extraEarnings}/mo
                </Badge>
              </div>
            </div>

            <p className="text-white/60 text-sm text-center">
              That&apos;s <span className="text-green-400 font-semibold">${extraEarnings * 12}/year</span> more in your pocket
            </p>
          </CardContent>
        </Card>
      )}

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
        <ShieldCheck className="w-4 h-4" />
        <span>256-bit encryption • Bank-level security • Powered by Stripe</span>
      </div>

      {/* Continue Button */}
      <div className="flex justify-between pb-20 sm:pb-0">
        <Button
          variant="outline"
          onClick={() => router.push('/host/vehicles/add/photos')}
          className="border-white/20 text-white hover:bg-white/10"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!hasStripeConnect}
          size="lg"
          className="bg-[#e63946] hover:bg-[#e63946]/80 text-white px-8"
        >
          Continue to Publish
        </Button>
      </div>
    </div>
  )
}
