'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Wallet, 
  CheckCircle2, 
  ExternalLink,
  Building2,
  CreditCard,
  Shield,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface StripePayoutSetupProps {
  onComplete: () => void
  onSkip?: () => void
  onBack?: () => void
  isLoading?: boolean
  userId?: string
}

export function StripePayoutSetup({ 
  onComplete, 
  onSkip, 
  onBack, 
  isLoading = false,
  userId 
}: StripePayoutSetupProps) {
  const [payoutStatus, setPayoutStatus] = useState<'idle' | 'checking' | 'connected' | 'pending' | 'error' | 'unavailable'>('idle')
  const [connectingStripe, setConnectingStripe] = useState(false)
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isStripeUnavailable, setIsStripeUnavailable] = useState(false)

  // Check if user already has Stripe Connect set up
  useEffect(() => {
    async function checkPayoutStatus() {
      if (!userId) return
      
      setPayoutStatus('checking')
      try {
        const res = await fetch('/api/stripe/connect/status')
        if (res.ok) {
          const data = await res.json()
          if (data.connected) {
            setPayoutStatus('connected')
            setStripeAccountId(data.accountId)
          } else if (data.pending) {
            setPayoutStatus('pending')
            setStripeAccountId(data.accountId)
          } else {
            setPayoutStatus('idle')
          }
        } else {
          setPayoutStatus('idle')
        }
      } catch {
        setPayoutStatus('idle')
      }
    }
    
    checkPayoutStatus()
  }, [userId])

  const handleConnectStripe = async () => {
    setConnectingStripe(true)
    setErrorMessage(null)
    setIsStripeUnavailable(false)
    
    try {
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          returnUrl: window.location.href,
          refreshUrl: window.location.href
        }),
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          // Redirect to Stripe Connect onboarding
          window.location.href = data.url
        } else {
          setErrorMessage('Could not start Stripe onboarding. Please try again.')
        }
      } else if (res.status === 503) {
        // Stripe is temporarily unavailable
        setIsStripeUnavailable(true)
        setPayoutStatus('unavailable')
        setErrorMessage('Stripe setup is temporarily unavailable. You can skip this step and complete it later from your host dashboard.')
      } else {
        const error = await res.json()
        setErrorMessage(error.message || 'Failed to connect to Stripe. Please try again.')
      }
    } catch (err) {
      console.error('Stripe Connect error:', err)
      // Network errors or fetch failures - treat as unavailable
      setIsStripeUnavailable(true)
      setPayoutStatus('unavailable')
      setErrorMessage('Stripe setup is temporarily unavailable. You can skip this step and complete it later from your host dashboard.')
    } finally {
      setConnectingStripe(false)
    }
  }

  const benefits = [
    {
      icon: Building2,
      title: 'Direct Bank Deposits',
      description: 'Get paid directly to your bank account',
    },
    {
      icon: CreditCard,
      title: 'Fast Payouts',
      description: 'Receive funds within 2-3 business days',
    },
    {
      icon: Shield,
      title: 'Secure & Protected',
      description: 'Bank-level security powered by Stripe',
    },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 border-border">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 mx-auto bg-[#CC0000]/10 rounded-full flex items-center justify-center mb-4">
            <Wallet className="h-8 w-8 text-[#CC0000]" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Set Up Payouts
          </CardTitle>
          <CardDescription className="text-base">
            Connect your bank account to receive payments when guests rent your vehicle.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status Display */}
          {payoutStatus === 'checking' && (
            <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-xl">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Checking payout status...</span>
            </div>
          )}

          {payoutStatus === 'connected' && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-700">Payouts Connected</p>
                  <p className="text-sm text-green-600">Your bank account is linked and ready to receive payments.</p>
                </div>
              </div>
            </div>
          )}

          {payoutStatus === 'pending' && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-700">Setup Incomplete</p>
                  <p className="text-sm text-amber-600">Please complete your Stripe account setup to receive payouts.</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnectStripe}
                  disabled={connectingStripe}
                  className="border-amber-500/50 text-amber-700 hover:bg-amber-500/10"
                >
                  {connectingStripe ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete Setup'}
                </Button>
              </div>
            </div>
          )}

          {payoutStatus === 'unavailable' && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-700">Stripe Temporarily Unavailable</p>
                  <p className="text-sm text-amber-600 mt-1">
                    Stripe setup is temporarily unavailable. You can skip this step and complete it later from your host dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          {payoutStatus !== 'connected' && (
            <div className="grid gap-4">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-[#CC0000]/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-5 w-5 text-[#CC0000]" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{benefit.title}</p>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Connect Button */}
          {payoutStatus !== 'connected' && payoutStatus !== 'checking' && (
            <Button
              onClick={handleConnectStripe}
              disabled={connectingStripe || isLoading}
              className="w-full h-12 bg-[#635BFF] hover:bg-[#635BFF]/90 text-white font-medium"
            >
              {connectingStripe ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Connecting to Stripe...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                  </svg>
                  Connect with Stripe
                  <ExternalLink className="h-4 w-4" />
                </span>
              )}
            </Button>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onBack && (
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isLoading || connectingStripe}
                className="flex-1 sm:flex-none"
              >
                Back
              </Button>
            )}
            
            {payoutStatus === 'connected' ? (
              <Button
                onClick={onComplete}
                disabled={isLoading}
                className="flex-1 bg-[#CC0000] hover:bg-[#CC0000]/90 text-white font-medium h-12"
              >
                Continue
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            ) : isStripeUnavailable && onSkip ? (
              // Prominent Skip button when Stripe is unavailable
              <Button
                onClick={onSkip}
                disabled={isLoading}
                className="flex-1 bg-[#CC0000] hover:bg-[#CC0000]/90 text-white font-medium h-12"
              >
                Continue Without Stripe
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            ) : onSkip && (
              <Button
                variant="ghost"
                onClick={onSkip}
                disabled={isLoading || connectingStripe}
                className="flex-1 sm:flex-none text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </Button>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {payoutStatus === 'connected' 
              ? 'You can update your payout settings anytime from your dashboard.'
              : 'You can set up payouts later, but you won\'t receive payments until connected.'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Simple status indicator for use elsewhere
export function PayoutStatusBadge({ className = '' }: { className?: string }) {
  const [status, setStatus] = useState<'loading' | 'connected' | 'not_connected'>('loading')

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/stripe/connect/status')
        if (res.ok) {
          const data = await res.json()
          setStatus(data.connected ? 'connected' : 'not_connected')
        } else {
          setStatus('not_connected')
        }
      } catch {
        setStatus('not_connected')
      }
    }
    checkStatus()
  }, [])

  if (status === 'loading') return null

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
      status === 'connected' 
        ? 'bg-green-500/10 text-green-700' 
        : 'bg-amber-500/10 text-amber-700'
    } ${className}`}>
      {status === 'connected' ? (
        <>
          <CheckCircle2 className="h-3 w-3" />
          Payouts Active
        </>
      ) : (
        <>
          <AlertCircle className="h-3 w-3" />
          Setup Payouts
        </>
      )}
    </div>
  )
}
