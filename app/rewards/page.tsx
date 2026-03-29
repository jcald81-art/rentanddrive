'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/logo'
import { 
  Camera, 
  Video, 
  Gift, 
  CheckCircle2, 
  Instagram, 
  Facebook,
  ArrowRight,
  Sparkles,
  DollarSign,
  Share2,
  AlertCircle,
  Loader2
} from 'lucide-react'

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { id: 'tiktok', name: 'TikTok', icon: Video, color: 'bg-black' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
]

const POST_TYPES = [
  { id: 'photo', name: 'Photo Post', icon: Camera, reward: 500, description: 'Single photo or carousel' },
  { id: 'reel', name: 'Reel/Short', icon: Video, reward: 1000, description: 'Short-form video content' },
  { id: 'video', name: 'Full Video', icon: Video, reward: 1500, description: 'Longer video review' },
  { id: 'story', name: 'Story', icon: Share2, reward: 250, description: 'Temporary story post' },
]

export default function RewardsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userBookings, setUserBookings] = useState<any[]>([])
  const [existingRewards, setExistingRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    booking_id: '',
    platform: '',
    post_url: '',
    post_type: '',
    caption: '',
    follower_count: '',
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  async function checkAuthAndLoadData() {
    try {
      // Check auth
      const authRes = await fetch('/api/auth/me')
      if (!authRes.ok) {
        setIsAuthenticated(false)
        setLoading(false)
        return
      }
      setIsAuthenticated(true)

      // Load user's completed bookings
      const bookingsRes = await fetch('/api/bookings?status=completed&limit=20')
      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setUserBookings(data.bookings || [])
      }

      // Load existing reward submissions
      const rewardsRes = await fetch('/api/rewards/my-submissions')
      if (rewardsRes.ok) {
        const data = await rewardsRes.json()
        setExistingRewards(data.rewards || [])
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // Validate URL
      const urlPattern = /^https?:\/\/(www\.)?(instagram\.com|tiktok\.com|facebook\.com|fb\.watch)\/.+/i
      if (!urlPattern.test(formData.post_url)) {
        throw new Error('Please enter a valid social media post URL')
      }

      const res = await fetch('/api/rewards/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: formData.booking_id,
          platform: formData.platform,
          post_url: formData.post_url,
          post_type: formData.post_type,
          caption: formData.caption,
          follower_count: formData.follower_count ? parseInt(formData.follower_count) : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit')
      }

      setSuccess(true)
      setFormData({
        booking_id: '',
        platform: '',
        post_url: '',
        post_type: '',
        caption: '',
        follower_count: '',
      })

      // Reload rewards
      checkAuthAndLoadData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPostType = POST_TYPES.find(p => p.id === formData.post_type)
  const rewardAmount = selectedPostType?.reward || 0

  // Check if booking already has a reward for selected platform
  const existingRewardForBooking = existingRewards.find(
    r => r.booking_id === formData.booking_id && r.platform === formData.platform
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Logo size="md" />
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <Gift className="mx-auto h-16 w-16 text-[#CC0000] mb-6" />
            <h1 className="text-3xl font-bold mb-4">Share Your Trip, Earn Rewards</h1>
            <p className="text-muted-foreground mb-8">
              Post about your Rent and Drive experience on social media and get discounts on your next rental.
            </p>
            <Button size="lg" asChild>
              <Link href="/login?redirect=/rewards">
                Sign In to Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo size="md" />
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/vehicles">Browse Vehicles</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/bookings">My Bookings</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <Badge className="mb-4 bg-[#CC0000]/10 text-[#CC0000] border-[#CC0000]/20">
              <Sparkles className="mr-1 h-3 w-3" />
              Social Rewards Program
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Share Your Trip, Earn Rewards
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Post about your Rent and Drive experience on social media and receive 
              discount codes for your next rental. It&apos;s that simple!
            </p>
          </div>

          {/* How It Works */}
          <div className="grid gap-4 md:grid-cols-3 mb-12">
            <Card className="text-center border-0 bg-muted/50">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#CC0000]/10">
                  <Camera className="h-6 w-6 text-[#CC0000]" />
                </div>
                <h3 className="font-semibold mb-2">1. Post Your Trip</h3>
                <p className="text-sm text-muted-foreground">
                  Share a photo or video of your rental experience on Instagram, TikTok, or Facebook
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 bg-muted/50">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#CC0000]/10">
                  <Share2 className="h-6 w-6 text-[#CC0000]" />
                </div>
                <h3 className="font-semibold mb-2">2. Submit Your Link</h3>
                <p className="text-sm text-muted-foreground">
                  Fill out the form below with your post URL and booking details
                </p>
              </CardContent>
            </Card>
            <Card className="text-center border-0 bg-muted/50">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#CC0000]/10">
                  <DollarSign className="h-6 w-6 text-[#CC0000]" />
                </div>
                <h3 className="font-semibold mb-2">3. Get Your Reward</h3>
                <p className="text-sm text-muted-foreground">
                  Once approved, receive a discount code via email for your next booking
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Reward Tiers */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-[#CC0000]" />
                Reward Amounts
              </CardTitle>
              <CardDescription>
                Earn more with video content - it helps other renters make decisions!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {POST_TYPES.map((type) => (
                  <div 
                    key={type.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <type.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{type.name}</p>
                      <p className="text-sm font-semibold text-[#CC0000]">
                        ${(type.reward / 100).toFixed(0)} off
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Success Message */}
          {success && (
            <Card className="mb-8 border-green-200 bg-green-50">
              <CardContent className="flex items-center gap-4 pt-6">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Submission Received!</h3>
                  <p className="text-sm text-green-700">
                    We&apos;ll review your post and send your discount code within 24-48 hours.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submission Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Submit Your Post</CardTitle>
              <CardDescription>
                Tag @rentanddrive and use #RentAndDrive in your post for faster approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userBookings.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Completed Bookings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You need to complete a booking before you can submit a reward claim.
                  </p>
                  <Button asChild>
                    <Link href="/vehicles">Browse Vehicles</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  {/* Booking Selection */}
                  <div className="space-y-2">
                    <Label>Select Booking</Label>
                    <select
                      required
                      value={formData.booking_id}
                      onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
                      className="w-full rounded-md border bg-background px-3 py-2"
                    >
                      <option value="">Choose a completed booking...</option>
                      {userBookings.map((booking) => (
                        <option key={booking.id} value={booking.id}>
                          {booking.vehicle?.year} {booking.vehicle?.make} {booking.vehicle?.model} - {new Date(booking.start_date).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Platform Selection */}
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {PLATFORMS.map((platform) => (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, platform: platform.id })}
                          className={`flex items-center gap-3 rounded-lg border p-4 transition-all ${
                            formData.platform === platform.id
                              ? 'border-[#CC0000] ring-2 ring-[#CC0000]/20'
                              : 'hover:border-muted-foreground/50'
                          }`}
                        >
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${platform.color} text-white`}>
                            <platform.icon className="h-5 w-5" />
                          </div>
                          <span className="font-medium">{platform.name}</span>
                        </button>
                      ))}
                    </div>
                    {existingRewardForBooking && (
                      <p className="text-sm text-amber-600">
                        You&apos;ve already submitted a {existingRewardForBooking.platform} post for this booking.
                      </p>
                    )}
                  </div>

                  {/* Post Type */}
                  <div className="space-y-2">
                    <Label>Post Type</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {POST_TYPES.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, post_type: type.id })}
                          className={`flex items-center gap-3 rounded-lg border p-4 transition-all text-left ${
                            formData.post_type === type.id
                              ? 'border-[#CC0000] ring-2 ring-[#CC0000]/20'
                              : 'hover:border-muted-foreground/50'
                          }`}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <type.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{type.name}</span>
                              <Badge variant="secondary" className="text-[#CC0000]">
                                ${(type.reward / 100).toFixed(0)} off
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{type.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Post URL */}
                  <div className="space-y-2">
                    <Label htmlFor="post_url">Post URL</Label>
                    <Input
                      id="post_url"
                      type="url"
                      required
                      placeholder="https://www.instagram.com/p/..."
                      value={formData.post_url}
                      onChange={(e) => setFormData({ ...formData, post_url: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste the full URL to your public post
                    </p>
                  </div>

                  {/* Caption (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="caption">Caption (optional)</Label>
                    <Textarea
                      id="caption"
                      placeholder="Copy/paste your post caption here..."
                      value={formData.caption}
                      onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Follower Count (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="follower_count">Your Follower Count (optional)</Label>
                    <Input
                      id="follower_count"
                      type="number"
                      placeholder="e.g. 1500"
                      value={formData.follower_count}
                      onChange={(e) => setFormData({ ...formData, follower_count: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Helps us estimate reach - larger accounts may receive bonus rewards!
                    </p>
                  </div>

                  {/* Submit */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      {rewardAmount > 0 && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Reward: </span>
                          <span className="font-semibold text-[#CC0000]">
                            ${(rewardAmount / 100).toFixed(0)} off next booking
                          </span>
                        </p>
                      )}
                    </div>
                    <Button 
                      type="submit" 
                      disabled={submitting || !!existingRewardForBooking}
                      className="bg-[#CC0000] hover:bg-[#AA0000]"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit for Review
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* My Submissions */}
          {existingRewards.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>My Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {existingRewards.map((reward) => (
                    <div 
                      key={reward.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          reward.platform === 'instagram' ? 'bg-gradient-to-br from-purple-500 to-pink-500' :
                          reward.platform === 'tiktok' ? 'bg-black' :
                          'bg-blue-600'
                        } text-white`}>
                          {reward.platform === 'instagram' ? <Instagram className="h-5 w-5" /> :
                           reward.platform === 'facebook' ? <Facebook className="h-5 w-5" /> :
                           <Video className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{reward.platform} {reward.post_type}</p>
                          <p className="text-sm text-muted-foreground">
                            Submitted {new Date(reward.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            reward.status === 'approved' ? 'default' :
                            reward.status === 'rejected' ? 'destructive' :
                            'secondary'
                          }
                          className={reward.status === 'approved' ? 'bg-green-600' : ''}
                        >
                          {reward.status}
                        </Badge>
                        {reward.status === 'approved' && reward.discount_code && (
                          <p className="mt-1 text-sm font-mono font-semibold text-[#CC0000]">
                            {reward.discount_code}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
