'use client'

import { useState, useEffect } from 'react'
import { Wallet, Building2, Bitcoin, CheckCircle2, AlertCircle, Loader2, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type PayoutMethod = 'bank' | 'crypto_wallet' | 'coinbase'

interface CryptoSettings {
  acceptCrypto: boolean
  payoutMethod: PayoutMethod
  walletAddress: string
  walletNetwork: 'ethereum' | 'polygon' | 'solana' | 'base'
  coinbaseEmail: string
  preferredStablecoin: 'usdc' | 'usdt'
}

const NETWORKS = [
  { id: 'ethereum', name: 'Ethereum', icon: '⟠', fee: 'Higher fees, most secure' },
  { id: 'polygon', name: 'Polygon', icon: '⬡', fee: 'Low fees, fast' },
  { id: 'base', name: 'Base', icon: '🔵', fee: 'Very low fees, Coinbase L2' },
  { id: 'solana', name: 'Solana', icon: '◎', fee: 'Ultra low fees, fast' },
] as const

const PAYOUT_OPTIONS = [
  {
    id: 'bank' as const,
    title: 'Bank Account',
    description: 'Convert crypto to USD and deposit to your bank',
    icon: Building2,
    recommended: true,
  },
  {
    id: 'crypto_wallet' as const,
    title: 'Direct to Wallet',
    description: 'Receive stablecoins directly to your crypto wallet',
    icon: Wallet,
  },
  {
    id: 'coinbase' as const,
    title: 'Coinbase Account',
    description: 'Send to your Coinbase account for easy conversion',
    icon: Bitcoin,
  },
]

export function HostCryptoSettings() {
  const [settings, setSettings] = useState<CryptoSettings>({
    acceptCrypto: false,
    payoutMethod: 'bank',
    walletAddress: '',
    walletNetwork: 'polygon',
    coinbaseEmail: '',
    preferredStablecoin: 'usdc',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [walletError, setWalletError] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data } = await supabase
        .from('host_crypto_preferences')
        .select('*')
        .eq('host_id', user.id)
        .single()

      if (data) {
        setSettings({
          acceptCrypto: data.accept_crypto || false,
          payoutMethod: data.payout_method || 'bank',
          walletAddress: data.wallet_address || '',
          walletNetwork: data.wallet_network || 'polygon',
          coinbaseEmail: data.coinbase_email || '',
          preferredStablecoin: data.preferred_stablecoin || 'usdc',
        })
      }
    } catch (error) {
      console.error('Error loading crypto settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const validateWalletAddress = (address: string, network: string): boolean => {
    if (!address) return true // Empty is valid (not required)
    
    // Basic validation patterns
    const patterns: Record<string, RegExp> = {
      ethereum: /^0x[a-fA-F0-9]{40}$/,
      polygon: /^0x[a-fA-F0-9]{40}$/,
      base: /^0x[a-fA-F0-9]{40}$/,
      solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    }

    return patterns[network]?.test(address) ?? false
  }

  const handleSave = async () => {
    // Validate wallet address if using crypto wallet payout
    if (settings.payoutMethod === 'crypto_wallet' && settings.walletAddress) {
      if (!validateWalletAddress(settings.walletAddress, settings.walletNetwork)) {
        setWalletError(`Invalid ${settings.walletNetwork} wallet address`)
        return
      }
    }
    setWalletError('')

    setIsSaving(true)
    setSaveStatus('idle')

    try {
      const response = await fetch('/api/crypto/payout-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accept_crypto: settings.acceptCrypto,
          payout_method: settings.payoutMethod,
          wallet_address: settings.walletAddress,
          wallet_network: settings.walletNetwork,
          coinbase_email: settings.coinbaseEmail,
          preferred_stablecoin: settings.preferredStablecoin,
        }),
      })

      if (!response.ok) throw new Error('Failed to save')

      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Error saving crypto settings:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#C4813A]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#C4813A]" />
            Crypto Payments
          </h3>
          <p className="text-sm text-[#A8B5A8]">
            Accept USDC and USDT stablecoin payments from renters
          </p>
        </div>
        <Switch
          checked={settings.acceptCrypto}
          onCheckedChange={(checked) => setSettings({ ...settings, acceptCrypto: checked })}
        />
      </div>

      {settings.acceptCrypto && (
        <>
          {/* Preferred Stablecoin */}
          <div className="space-y-3">
            <Label className="text-[#A8B5A8]">Preferred Stablecoin</Label>
            <div className="flex gap-3">
              {['usdc', 'usdt'].map((coin) => (
                <button
                  key={coin}
                  onClick={() => setSettings({ ...settings, preferredStablecoin: coin as 'usdc' | 'usdt' })}
                  className={cn(
                    'flex-1 p-3 rounded-lg border-2 transition-all',
                    settings.preferredStablecoin === coin
                      ? 'border-[#C4813A] bg-[#C4813A]/10'
                      : 'border-[#3D4A3D] bg-[#262A24] hover:border-[#4A7C59]'
                  )}
                >
                  <span className="font-medium text-white">{coin.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payout Method */}
          <div className="space-y-3">
            <Label className="text-[#A8B5A8]">Payout Method</Label>
            <div className="space-y-2">
              {PAYOUT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSettings({ ...settings, payoutMethod: option.id })}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 transition-all text-left',
                    'hover:scale-[1.01] active:scale-[0.99]',
                    settings.payoutMethod === option.id
                      ? 'border-[#C4813A] bg-[#C4813A]/10'
                      : 'border-[#3D4A3D] bg-[#262A24] hover:border-[#4A7C59]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      settings.payoutMethod === option.id ? 'bg-[#C4813A]' : 'bg-[#3D4A3D]'
                    )}>
                      <option.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{option.title}</span>
                        {option.recommended && (
                          <span className="text-xs bg-[#2D4A2D] text-[#A8B5A8] px-2 py-0.5 rounded">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#6B7B6B]">{option.description}</p>
                    </div>
                    {settings.payoutMethod === option.id && (
                      <CheckCircle2 className="h-5 w-5 text-[#C4813A]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Settings */}
          {settings.payoutMethod === 'crypto_wallet' && (
            <div className="space-y-4 p-4 bg-[#1C1F1A] rounded-xl border border-[#3D4A3D]">
              <div className="space-y-3">
                <Label className="text-[#A8B5A8]">Network</Label>
                <div className="grid grid-cols-2 gap-2">
                  {NETWORKS.map((network) => (
                    <button
                      key={network.id}
                      onClick={() => setSettings({ ...settings, walletNetwork: network.id })}
                      className={cn(
                        'p-3 rounded-lg border transition-all text-left',
                        settings.walletNetwork === network.id
                          ? 'border-[#C4813A] bg-[#C4813A]/10'
                          : 'border-[#3D4A3D] hover:border-[#4A7C59]'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{network.icon}</span>
                        <div>
                          <p className="font-medium text-white text-sm">{network.name}</p>
                          <p className="text-xs text-[#6B7B6B]">{network.fee}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#A8B5A8]">Wallet Address</Label>
                <Input
                  value={settings.walletAddress}
                  onChange={(e) => {
                    setSettings({ ...settings, walletAddress: e.target.value })
                    setWalletError('')
                  }}
                  placeholder={settings.walletNetwork === 'solana' ? 'Your Solana address...' : '0x...'}
                  className="bg-[#262A24] border-[#3D4A3D] text-white font-mono text-sm"
                />
                {walletError && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {walletError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Coinbase Settings */}
          {settings.payoutMethod === 'coinbase' && (
            <div className="space-y-4 p-4 bg-[#1C1F1A] rounded-xl border border-[#3D4A3D]">
              <div className="space-y-2">
                <Label className="text-[#A8B5A8]">Coinbase Email</Label>
                <Input
                  type="email"
                  value={settings.coinbaseEmail}
                  onChange={(e) => setSettings({ ...settings, coinbaseEmail: e.target.value })}
                  placeholder="your@email.com"
                  className="bg-[#262A24] border-[#3D4A3D] text-white"
                />
                <p className="text-xs text-[#6B7B6B]">
                  We&apos;ll send stablecoins to your Coinbase account where you can convert to USD
                </p>
              </div>
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              'w-full h-11 rounded-full font-medium',
              saveStatus === 'success'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-[#C4813A] hover:bg-[#B4712A]'
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saveStatus === 'success' ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Saved!
              </>
            ) : saveStatus === 'error' ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Error - Try Again
              </>
            ) : (
              'Save Crypto Settings'
            )}
          </Button>
        </>
      )}
    </div>
  )
}
