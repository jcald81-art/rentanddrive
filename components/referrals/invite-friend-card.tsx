'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Gift, Copy, Check, Share2, Users, DollarSign, Mail, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ReferralData {
  referralCode: string
  referralCount: number
  rewardsEarned: number
  shareUrl: string
  referralHistory: Array<{
    id: string
    created_at: string
    reward_amount: number
    reward_issued: boolean
  }>
}

export function InviteFriendCard() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetchReferralData()
  }, [])

  const fetchReferralData = async () => {
    try {
      const res = await fetch('/api/referrals')
      if (res.ok) {
        const data = await res.json()
        setReferralData(data)
      }
    } catch (error) {
      console.error('Failed to fetch referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  const shareVia = (platform: 'sms' | 'email' | 'twitter') => {
    if (!referralData) return
    
    const message = `Join me on Rent and Drive! Use my code ${referralData.referralCode} to get $25 off your first rental. ${referralData.shareUrl}`
    
    switch (platform) {
      case 'sms':
        window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank')
        break
      case 'email':
        window.open(`mailto:?subject=${encodeURIComponent('$25 off Rent and Drive!')}&body=${encodeURIComponent(message)}`, '_blank')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank')
        break
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-[#e50914]/10 to-[#e50914]/5 border-[#e50914]/20">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-white/10 rounded w-1/2"></div>
            <div className="h-10 bg-white/10 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-[#e50914]/10 to-[#e50914]/5 border-[#e50914]/20 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-[#e50914]/20">
            <Gift className="h-5 w-5 text-[#e50914]" />
          </div>
          <div>
            <CardTitle className="text-lg text-white">Invite Friends, Earn $25</CardTitle>
            <CardDescription className="text-white/60">
              Share your code and earn rewards
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-[#e50914] mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xl font-bold">{referralData?.referralCount || 0}</span>
            </div>
            <p className="text-xs text-white/60">Friends Referred</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xl font-bold">{referralData?.rewardsEarned?.toFixed(0) || 0}</span>
            </div>
            <p className="text-xs text-white/60">Earned</p>
          </div>
        </div>

        {/* Promo Code Box */}
        <div className="space-y-2">
          <label className="text-sm text-white/70">Your Personal Code</label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={referralData?.referralCode || 'Loading...'}
              className="bg-white/10 border-white/20 text-white font-mono text-center tracking-wider"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(referralData?.referralCode || '')}
              className="border-white/20 text-white hover:bg-white/10 shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Share URL */}
        <div className="space-y-2">
          <label className="text-sm text-white/70">Share Link</label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={referralData?.shareUrl || ''}
              className="bg-white/10 border-white/20 text-white text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(referralData?.shareUrl || '')}
              className="border-white/20 text-white hover:bg-white/10 shrink-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Share Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => shareVia('sms')}
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => shareVia('email')}
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </div>

        {/* How It Works */}
        <div className="pt-2 border-t border-white/10">
          <p className="text-xs text-white/50 text-center">
            Your friend gets $25 off their first rental. You get $25 credit when they complete a trip.
          </p>
        </div>

        {/* Referral History Toggle */}
        {referralData?.referralHistory && referralData.referralHistory.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-[#e50914] hover:underline w-full text-center"
            >
              {showHistory ? 'Hide History' : `View ${referralData.referralHistory.length} Referrals`}
            </button>
            
            {showHistory && (
              <div className="mt-3 space-y-2">
                {referralData.referralHistory.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between bg-white/5 rounded-lg p-2 text-sm">
                    <span className="text-white/70">
                      {new Date(ref.created_at).toLocaleDateString()}
                    </span>
                    <span className={ref.reward_issued ? 'text-emerald-400' : 'text-amber-400'}>
                      {ref.reward_issued ? '+$25 Earned' : '$25 Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
