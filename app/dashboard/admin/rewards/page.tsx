'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Gift,
  Instagram,
  Facebook,
  Video,
  Camera,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  TrendingUp,
  DollarSign,
  Users,
  Share2,
  Loader2,
  AlertCircle,
} from 'lucide-react'

interface SocialReward {
  id: string
  booking_id: string
  user_id: string
  platform: string
  post_url: string
  post_type: string
  caption?: string
  reward_amount_cents: number
  discount_code?: string
  status: string
  rejection_reason?: string
  follower_count?: number
  estimated_impressions: number
  estimated_reach: number
  created_at: string
  approved_at?: string
  user?: {
    full_name: string
    email: string
    avatar_url?: string
  }
  booking?: {
    booking_number: string
    vehicle?: {
      make: string
      model: string
      year: number
    }
  }
}

interface Stats {
  total_submissions: number
  pending_count: number
  approved_count: number
  rejected_count: number
  total_discount_given_cents: number
  total_estimated_reach: number
  posts_by_platform: Record<string, number>
}

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<SocialReward[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedReward, setSelectedReward] = useState<SocialReward | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeTab])

  async function loadData() {
    setLoading(true)
    try {
      const [rewardsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/rewards?status=${activeTab === 'all' ? '' : activeTab}`),
        fetch('/api/admin/rewards/stats'),
      ])

      if (rewardsRes.ok) {
        const data = await rewardsRes.json()
        setRewards(data.rewards || [])
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Error loading rewards:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAction() {
    if (!selectedReward || !actionType) return
    setProcessing(true)

    try {
      const res = await fetch(`/api/admin/rewards/${selectedReward.id}/${actionType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejection_reason: actionType === 'reject' ? rejectionReason : undefined,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to process reward')
      }

      // Refresh data
      loadData()
      setSelectedReward(null)
      setActionType(null)
      setRejectionReason('')
    } catch (err) {
      console.error('Error processing reward:', err)
    } finally {
      setProcessing(false)
    }
  }

  function getPlatformIcon(platform: string) {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-5 w-5" />
      case 'facebook':
        return <Facebook className="h-5 w-5" />
      case 'tiktok':
        return <Video className="h-5 w-5" />
      default:
        return <Share2 className="h-5 w-5" />
    }
  }

  function getPlatformColor(platform: string) {
    switch (platform) {
      case 'instagram':
        return 'bg-gradient-to-br from-purple-500 to-pink-500'
      case 'facebook':
        return 'bg-blue-600'
      case 'tiktok':
        return 'bg-black'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Media Rewards</h1>
          <p className="text-muted-foreground">
            Review and approve social media posts for discount rewards
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                  <p className="text-2xl font-bold">{stats.total_submissions}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <Share2 className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold">{stats.pending_count}</p>
                </div>
                <div className="rounded-full bg-amber-100 p-3">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Est. Total Reach</p>
                  <p className="text-2xl font-bold">
                    {stats.total_estimated_reach >= 1000 
                      ? `${(stats.total_estimated_reach / 1000).toFixed(1)}K`
                      : stats.total_estimated_reach}
                  </p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Discounts Given</p>
                  <p className="text-2xl font-bold">
                    ${(stats.total_discount_given_cents / 100).toFixed(0)}
                  </p>
                </div>
                <div className="rounded-full bg-[#CC0000]/10 p-3">
                  <DollarSign className="h-5 w-5 text-[#CC0000]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Platform Breakdown */}
      {stats && stats.posts_by_platform && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Posts by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {Object.entries(stats.posts_by_platform).map(([platform, count]) => (
                <div key={platform} className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getPlatformColor(platform)} text-white`}>
                    {getPlatformIcon(platform)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground capitalize">{platform}</p>
                    <p className="font-semibold">{count} posts</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending
            {stats && stats.pending_count > 0 && (
              <Badge variant="secondary" className="ml-1">{stats.pending_count}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            All
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rewards.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No submissions</h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'pending' 
                    ? 'No pending submissions to review'
                    : `No ${activeTab} submissions found`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rewards.map((reward) => (
                <Card key={reward.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Platform Icon */}
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${getPlatformColor(reward.platform)} text-white shrink-0`}>
                        {getPlatformIcon(reward.platform)}
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold">{reward.user?.full_name || 'Unknown User'}</p>
                              <Badge variant="outline" className="capitalize">
                                {reward.platform}
                              </Badge>
                              <Badge variant="secondary" className="capitalize">
                                {reward.post_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {reward.user?.email}
                            </p>
                            {reward.booking && (
                              <p className="text-sm text-muted-foreground">
                                Booking: {reward.booking.booking_number} - {reward.booking.vehicle?.year} {reward.booking.vehicle?.make} {reward.booking.vehicle?.model}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
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
                            <p className="mt-1 text-sm text-muted-foreground">
                              {new Date(reward.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Post Details */}
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                          <a 
                            href={reward.post_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Post
                          </a>
                          
                          <span className="text-muted-foreground">
                            Reward: <span className="font-semibold text-[#CC0000]">${(reward.reward_amount_cents / 100).toFixed(0)}</span>
                          </span>

                          {reward.follower_count && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              {reward.follower_count.toLocaleString()} followers
                            </span>
                          )}

                          {reward.estimated_reach > 0 && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Eye className="h-4 w-4" />
                              ~{reward.estimated_reach.toLocaleString()} reach
                            </span>
                          )}
                        </div>

                        {/* Caption Preview */}
                        {reward.caption && (
                          <div className="mt-3 rounded-lg bg-muted/50 p-3">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {reward.caption}
                            </p>
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {reward.status === 'rejected' && reward.rejection_reason && (
                          <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <p>{reward.rejection_reason}</p>
                          </div>
                        )}

                        {/* Approved Code */}
                        {reward.status === 'approved' && reward.discount_code && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Discount Code:</span>
                            <code className="rounded bg-muted px-2 py-1 text-sm font-mono font-semibold">
                              {reward.discount_code}
                            </code>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {reward.status === 'pending' && (
                          <div className="mt-4 flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedReward(reward)
                                setActionType('approve')
                              }}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReward(reward)
                                setActionType('reject')
                              }}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approve/Reject Dialog */}
      <Dialog open={!!selectedReward && !!actionType} onOpenChange={() => {
        setSelectedReward(null)
        setActionType(null)
        setRejectionReason('')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Submission' : 'Reject Submission'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? 'This will generate a discount code and email it to the user.'
                : 'Please provide a reason for rejection.'}
            </DialogDescription>
          </DialogHeader>

          {selectedReward && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getPlatformColor(selectedReward.platform)} text-white`}>
                    {getPlatformIcon(selectedReward.platform)}
                  </div>
                  <div>
                    <p className="font-semibold">{selectedReward.user?.full_name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedReward.platform} {selectedReward.post_type}
                    </p>
                  </div>
                </div>
                <a 
                  href={selectedReward.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Post
                </a>
              </div>

              {actionType === 'approve' && (
                <div className="rounded-lg bg-green-50 p-4">
                  <p className="text-sm text-green-700">
                    A <span className="font-semibold">${(selectedReward.reward_amount_cents / 100).toFixed(0)}</span> discount code will be generated and emailed to the user.
                  </p>
                </div>
              )}

              {actionType === 'reject' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rejection Reason</label>
                  <Textarea
                    placeholder="e.g. Post is not visible, doesn't mention Rent and Drive, etc."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedReward(null)
                setActionType(null)
                setRejectionReason('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing || (actionType === 'reject' && !rejectionReason)}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {processing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : actionType === 'approve' ? (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              {actionType === 'approve' ? 'Approve & Send Code' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
