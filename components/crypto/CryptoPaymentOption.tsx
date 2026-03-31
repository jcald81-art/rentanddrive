'use client'

import { useState } from 'react'
import { Bitcoin, Wallet, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CryptoPaymentOptionProps {
  amount: number
  currency?: string
  onPaymentInitiated?: (paymentMethod: 'usdc' | 'usdt') => void
  onPaymentComplete?: (txHash: string) => void
  disabled?: boolean
  className?: string
}

const CRYPTO_OPTIONS = [
  {
    id: 'usdc' as const,
    name: 'USDC',
    fullName: 'USD Coin',
    icon: '💵',
    color: 'bg-blue-500',
    description: 'Stablecoin pegged to USD',
  },
  {
    id: 'usdt' as const,
    name: 'USDT',
    fullName: 'Tether',
    icon: '💲',
    color: 'bg-green-500',
    description: 'Most widely used stablecoin',
  },
]

export function CryptoPaymentOption({
  amount,
  currency = 'USD',
  onPaymentInitiated,
  onPaymentComplete,
  disabled = false,
  className,
}: CryptoPaymentOptionProps) {
  const [selectedCrypto, setSelectedCrypto] = useState<'usdc' | 'usdt' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'complete' | 'error'>('idle')

  const handleCryptoSelect = (cryptoId: 'usdc' | 'usdt') => {
    if (disabled || isProcessing) return
    setSelectedCrypto(cryptoId)
  }

  const handlePayWithCrypto = async () => {
    if (!selectedCrypto || disabled) return

    setIsProcessing(true)
    setPaymentStatus('pending')
    onPaymentInitiated?.(selectedCrypto)

    try {
      // Create crypto checkout session
      const response = await fetch('/api/crypto/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: selectedCrypto,
        }),
      })

      if (!response.ok) throw new Error('Failed to create checkout')

      const data = await response.json()
      
      if (data.checkoutUrl) {
        // Redirect to payment page
        window.location.href = data.checkoutUrl
      } else if (data.walletAddress) {
        // Show wallet address for direct payment
        setPaymentStatus('pending')
      }
    } catch (error) {
      console.error('Crypto payment error:', error)
      setPaymentStatus('error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-[#C4813A]" />
        <span className="font-medium text-white">Pay with Crypto</span>
        <span className="text-xs text-[#6B7B6B] bg-[#2D4A2D] px-2 py-0.5 rounded">Stablecoins</span>
      </div>

      {/* Crypto Options */}
      <div className="grid grid-cols-2 gap-3">
        {CRYPTO_OPTIONS.map((crypto) => (
          <button
            key={crypto.id}
            onClick={() => handleCryptoSelect(crypto.id)}
            disabled={disabled || isProcessing}
            className={cn(
              'relative p-4 rounded-xl border-2 transition-all duration-200',
              'hover:scale-[1.02] active:scale-[0.98]',
              selectedCrypto === crypto.id
                ? 'border-[#C4813A] bg-[#C4813A]/10'
                : 'border-[#3D4A3D] bg-[#262A24] hover:border-[#4A7C59]',
              (disabled || isProcessing) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {selectedCrypto === crypto.id && (
              <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-[#C4813A]" />
            )}
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">{crypto.icon}</span>
              <div className="text-center">
                <p className="font-semibold text-white">{crypto.name}</p>
                <p className="text-xs text-[#A8B5A8]">{crypto.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Amount Display */}
      {selectedCrypto && (
        <div className="bg-[#1C1F1A] rounded-lg p-4 border border-[#3D4A3D]">
          <div className="flex justify-between items-center">
            <span className="text-[#A8B5A8]">Amount to pay</span>
            <div className="text-right">
              <p className="text-xl font-bold text-white">
                {amount.toFixed(2)} {selectedCrypto.toUpperCase()}
              </p>
              <p className="text-xs text-[#6B7B6B]">≈ ${amount.toFixed(2)} USD</p>
            </div>
          </div>
        </div>
      )}

      {/* Pay Button */}
      <Button
        onClick={handlePayWithCrypto}
        disabled={!selectedCrypto || disabled || isProcessing}
        className={cn(
          'w-full h-12 rounded-full font-medium transition-all',
          'bg-gradient-to-r from-[#2D4A2D] to-[#4A7C59]',
          'hover:from-[#3D5A3D] hover:to-[#5A8C69]',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : paymentStatus === 'complete' ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Payment Complete
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Pay with {selectedCrypto?.toUpperCase() || 'Crypto'}
          </>
        )}
      </Button>

      {/* Info */}
      <p className="text-xs text-center text-[#6B7B6B]">
        Stablecoin payments are processed instantly with no volatility risk
      </p>
    </div>
  )
}
