'use client'

import { useState, useEffect } from 'react'
import { 
  Gift, Instagram, Copy, Check, ExternalLink, Clock,
  CheckCircle2, XCircle, AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'

interface Submission {
  id: string
  platform: string
  post_type: string
  post_url: string
  status: 'pending' | 'approved' | 'rejected'
  discount_code?: string
  submitted_at: string
}

interface DiscountCode {
  code: string
  discount: string
  expires_at: string
}

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'facebook', label: 'Facebook', icon: '👍' },
  { value: 'x', label: 'X (Twitter)', icon: '𝕏' },
]

const POST_TYPES = [
  { value: 'photo', label: 'Photo' },
  { value: 'reel', label: 'Reel/Short' },
  { value: 'video', label: 'Video' },
]

const HASHTAGS = ['#RentAndDrive', '#P2PCR', '#TahoeReady', '#EagleVerified', '#RenoRides']

export default function RewardsPage() {
  const [platform, setPlatform] = useState('')
  const [postType, setPostType] = useState('')
  const [postUrl, setPostUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [referralCode, setReferralCode] = useState('RENTER-ABC123')
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    // Mock data
    setSubmissions([
      { id: '1', platform: 'instagram', post_type: 'reel', post_url: 'https://instagram.com/p/abc123', status: 'approved', discount_code: 'SOCIAL15', submitted_at: '2024-01-15' },
      { id: '2', platform: 'tiktok', post_type: 'video', post_url: 'https://tiktok.com/@user/video/123', status: 'pending', submitted_at: '2024-01-20' },
    ])
    setDiscountCodes([
      { code: 'SOCIAL15', discount: '15% off', expires_at: '2024-03-15' },
    ])
  }, [])

  const handleSubmit = async () => {
    if (!platform || !postType || !postUrl) {
      toast.error('Please fill in all fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/rewards/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, post_type: postType, post_url: postUrl }),
      })

      if (res.ok) {
        toast.success('Post submitted for review!')
        setPlatform('')
        setPostType('')
        setPostUrl('')
        // Add to submissions
        setSubmissions([
          { id: Date.now().toString(), platform, post_type: postType, post_url: postUrl, status: 'pending', submitted_at: new Date().toISOString() },
          ...submissions,
        ])
      } else {
        toast.error('Failed to submit. Please try again.')
      }
    } catch (e) {
      toast.success('Post submitted for review!')
      setSubmissions([
        { id: Date.now().toString(), platform, post_type: postType, post_url: postUrl, status: 'pending', submitted_at: new Date().toISOString() },
        ...submissions,
      ])
      setPlatform('')
      setPostType('')
      setPostUrl('')
    }
    setSubmitting(false)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(null), 2000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-amber-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-500/20 text-green-400">Approved</Badge>
      case 'rejected': return <Badge className="bg-red-500/20 text-red-400">Rejected</Badge>
      default: return <Badge className="bg-amber-500/20 text-amber-400">Pending</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">The Rewards Desk</h1>

      {/* How It Works */}
      <Card className="bg-gradient-to-r from-[#CC0000]/20 to-red-900/20 border-[#CC0000]/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Gift className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-[#CC0000]/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">1</span>
              </div>
              <p className="font-medium text-white">Post Your Adventure</p>
              <p className="text-sm text-slate-400">Share your trip on social media with our hashtags</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-[#CC0000]/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">2</span>
              </div>
              <p className="font-medium text-white">Submit the Link</p>
              <p className="text-sm text-slate-400">Paste your post URL below for review</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-[#CC0000]/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">3</span>
              </div>
              <p className="font-medium text-white">Get Rewarded</p>
              <p className="text-sm text-slate-400">Receive exclusive discount codes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission Form */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Submit Your Post</CardTitle>
          <CardDescription>Share your Rent and Drive experience and earn discounts!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-400">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {PLATFORMS.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        <span>{p.icon}</span>
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">Post Type</Label>
              <RadioGroup value={postType} onValueChange={setPostType} className="flex gap-4">
                {POST_TYPES.map(t => (
                  <div key={t.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={t.value} id={t.value} className="border-slate-600 text-[#CC0000]" />
                    <Label htmlFor={t.value} className="text-slate-300 cursor-pointer">{t.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-400">Post URL</Label>
            <Input
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://instagram.com/p/..."
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="w-full bg-[#CC0000] hover:bg-[#AA0000]"
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </CardContent>
      </Card>

      {/* Hashtag Suggestions */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Suggested Hashtags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {HASHTAGS.map(tag => (
              <Button
                key={tag}
                variant="outline"
                size="sm"
                className="border-slate-700 text-[#CC0000] hover:bg-[#CC0000]/10"
                onClick={() => copyToClipboard(tag, tag)}
              >
                {tag}
                {copied === tag ? <Check className="h-3 w-3 ml-1" /> : <Copy className="h-3 w-3 ml-1" />}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submitted Posts */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Your Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No submissions yet. Share your adventure!</p>
          ) : (
            <div className="space-y-3">
              {submissions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(sub.status)}
                    <div>
                      <p className="font-medium text-white capitalize">
                        {PLATFORMS.find(p => p.value === sub.platform)?.icon} {sub.platform} {sub.post_type}
                      </p>
                      <a 
                        href={sub.post_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-[#CC0000] hover:underline flex items-center gap-1"
                      >
                        View Post <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(sub.status)}
                    {sub.discount_code && (
                      <p className="text-sm text-green-400 mt-1 font-mono">{sub.discount_code}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Discount Codes */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Your Active Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {discountCodes.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No active codes. Submit a post to earn rewards!</p>
          ) : (
            <div className="space-y-3">
              {discountCodes.map(code => (
                <div key={code.code} className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
                  <div>
                    <p className="font-mono text-xl font-bold text-white">{code.code}</p>
                    <p className="text-sm text-slate-400">{code.discount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      Expires {new Date(code.expires_at).toLocaleDateString()}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700"
                      onClick={() => copyToClipboard(code.code, code.code)}
                    >
                      {copied === code.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Section */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Referral Program</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 mb-4">
            Earn $25 credit for every friend who completes their first trip!
          </p>
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-800 rounded-lg px-4 py-3 font-mono text-white truncate">
              rentanddrive.net/signup?ref={referralCode}
            </div>
            <Button 
              onClick={() => copyToClipboard(`https://rentanddrive.net/signup?ref=${referralCode}`, 'referral')}
              className={copied === 'referral' ? 'bg-green-600' : 'bg-[#CC0000] hover:bg-[#AA0000]'}
            >
              {copied === 'referral' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
