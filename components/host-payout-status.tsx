'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, ExternalLink, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

interface PayoutStatus {
  connected: boolean
  charges_enabled: boolean
  payouts_enabled: boolean
  details_submitted: boolean
  requirements: {
    currently_due: string[]
    eventually_due: string[]
    past_due: string[]
    pending_verification: string[]
  } | null
  balance: {
    available: number
    pending: number
    currency: string
  } | null
  nextPayout: {
    date: string
    amount: number
  } | null
}

export default function HostPayoutStatus() {
  const [status, setStatus] = useState<PayoutStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    fetchPayoutStatus()
  }, [])

  const fetchPayoutStatus = async () => {
    try {
      const response = await fetch('/api/stripe/payout-status')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch payout status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetupPayouts = async () => {
    setIsConnecting(true)

    try {
      const response = await fetch('/api/stripe/connect-host', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Failed to setup payouts:', error)
      setIsConnecting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <Card className="bg-[#1a1a2e] border-[#2d2d44]">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f4d03f]" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Not connected
  if (!status?.connected) {
    return (
      <Card className="bg-[#1a1a2e] border-[#2d2d44]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Wallet className="h-5 w-5" />
            Payout Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-400 text-sm">
            Connect your bank account to receive payouts from your rentals. We use Stripe for secure, fast transfers.
          </p>
          <Button
            onClick={handleSetupPayouts}
            disabled={isConnecting}
            className="w-full bg-[#f4d03f] hover:bg-[#d4b82f] text-[#1a1a2e] font-semibold"
          >
            {isConnecting ? (
              'Connecting...'
            ) : (
              <>
                Set Up Payouts
                <ExternalLink className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Pending verification
  if (!status.payouts_enabled || !status.charges_enabled) {
    return (
      <Card className="bg-[#1a1a2e] border-[#2d2d44]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Wallet className="h-5 w-5" />
            Payout Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              <Clock className="mr-1 h-3 w-3" />
              Verification Pending
            </Badge>
          </div>
          <p className="text-gray-400 text-sm">
            Your account is being verified. This usually takes 1-2 business days.
          </p>
          {status.requirements?.currently_due && status.requirements.currently_due.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-yellow-400 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Additional information needed
              </p>
              <Button
                onClick={handleSetupPayouts}
                variant="outline"
                size="sm"
                className="mt-2 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              >
                Complete Setup
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Fully connected
  return (
    <Card className="bg-[#1a1a2e] border-[#2d2d44]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Payout Status
          </span>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Payouts Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.balance && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#16213e] rounded-lg p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Available</p>
              <p
                className="text-2xl font-bold text-green-400"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                {formatCurrency(status.balance.available)}
              </p>
            </div>
            <div className="bg-[#16213e] rounded-lg p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Pending</p>
              <p
                className="text-2xl font-bold text-yellow-400"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                {formatCurrency(status.balance.pending)}
              </p>
            </div>
          </div>
        )}

        {status.nextPayout && (
          <div className="bg-[#16213e] rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Next Payout</p>
              <p className="text-white font-medium">{formatDate(status.nextPayout.date)}</p>
            </div>
            <p
              className="text-xl font-bold text-[#f4d03f]"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              {formatCurrency(status.nextPayout.amount)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
