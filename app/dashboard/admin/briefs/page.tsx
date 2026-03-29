'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Newspaper,
  Star,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Eye,
  RefreshCw,
  Sparkles,
  MessageSquare,
} from 'lucide-react'

interface BriefStats {
  total_briefs: number
  avg_quality_score: number
  positive_feedback: number
  negative_feedback: number
  briefs_today: number
  hosts_without_brief: number
}

interface Brief {
  id: string
  host_id: string
  host: { full_name: string; email: string }
  brief_date: string
  subject: string
  summary: string
  highlights: string[]
  action_items: string[]
  quality_score: number | null
  admin_feedback: string | null
  host_feedback: 'positive' | 'negative' | null
  model_used: string
  token_cost: number
  generated_at: string
}

export default function MorningBriefsPage() {
  const [stats, setStats] = useState<BriefStats | null>(null)
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('today')
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null)
  const [feedback, setFeedback] = useState('')
  const [qualityScore, setQualityScore] = useState<number>(3)

  useEffect(() => {
    fetchData()
  }, [dateFilter])

  async function fetchData() {
    setLoading(true)
    try {
      const [statsRes, briefsRes] = await Promise.all([
        fetch('/api/admin/briefs/stats'),
        fetch(`/api/admin/briefs?date=${dateFilter}`),
      ])
      
      if (statsRes.ok) setStats(await statsRes.json())
      if (briefsRes.ok) setBriefs((await briefsRes.json()).briefs || [])
    } catch (error) {
      console.error('Failed to fetch briefs:', error)
    }
    setLoading(false)
  }

  async function submitReview(briefId: string) {
    try {
      const res = await fetch(`/api/admin/briefs/${briefId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality_score: qualityScore, admin_feedback: feedback }),
      })
      if (res.ok) {
        setSelectedBrief(null)
        setFeedback('')
        setQualityScore(3)
        fetchData()
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
    }
  }

  async function regenerateBrief(hostId: string) {
    try {
      await fetch(`/api/admin/briefs/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host_id: hostId }),
      })
      fetchData()
    } catch (error) {
      console.error('Failed to regenerate brief:', error)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
    })

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
    })

  const getQualityColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 4) return 'text-green-600'
    if (score >= 3) return 'text-amber-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-6" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Newspaper className="h-8 w-8 text-[#CC0000]" />
            Morning Briefs
          </h1>
          <p className="text-muted-foreground">Review AI-generated host briefings</p>
        </div>
        <div className="flex gap-3">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Briefs Today</CardTitle>
            <Newspaper className="h-4 w-4 text-[#CC0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.briefs_today || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.hosts_without_brief || 0} hosts pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality</CardTitle>
            <Star className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.avg_quality_score || 0).toFixed(1)}/5</div>
            <Progress value={(stats?.avg_quality_score || 0) * 20} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Feedback</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.positive_feedback || 0}</div>
            <p className="text-xs text-muted-foreground">From hosts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negative Feedback</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.negative_feedback || 0}</div>
            <p className="text-xs text-muted-foreground">Needs improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Briefs List */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Briefs</CardTitle>
          <CardDescription>Review and score AI-generated morning briefs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {briefs.map((brief) => (
              <div 
                key={brief.id}
                className="p-4 rounded-lg border hover:border-[#CC0000] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{brief.host.full_name}</span>
                      </div>
                      <Badge variant="outline">{formatDate(brief.brief_date)}</Badge>
                      {brief.host_feedback === 'positive' && (
                        <Badge className="bg-green-600 gap-1">
                          <ThumbsUp className="h-3 w-3" /> Liked
                        </Badge>
                      )}
                      {brief.host_feedback === 'negative' && (
                        <Badge variant="destructive" className="gap-1">
                          <ThumbsDown className="h-3 w-3" /> Disliked
                        </Badge>
                      )}
                      {brief.quality_score && (
                        <span className={`flex items-center gap-1 text-sm ${getQualityColor(brief.quality_score)}`}>
                          <Star className="h-4 w-4 fill-current" />
                          {brief.quality_score}/5
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-semibold mb-1">{brief.subject}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{brief.summary}</p>
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {brief.model_used}
                      </span>
                      <span>
                        ${brief.token_cost.toFixed(4)} cost
                      </span>
                      <span>
                        Generated {formatTime(brief.generated_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedBrief(brief)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>{brief.subject}</DialogTitle>
                          <DialogDescription>
                            Brief for {brief.host.full_name} - {formatDate(brief.brief_date)}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 mt-4">
                          <div>
                            <h4 className="font-semibold mb-2">Summary</h4>
                            <p className="text-sm text-muted-foreground">{brief.summary}</p>
                          </div>
                          
                          {brief.highlights.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Highlights</h4>
                              <ul className="space-y-1">
                                {brief.highlights.map((h, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                    {h}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {brief.action_items.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Action Items</h4>
                              <ul className="space-y-1">
                                {brief.action_items.map((a, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                    {a}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Admin Review</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="text-sm font-medium">Quality Score</label>
                                <div className="flex gap-2 mt-1">
                                  {[1, 2, 3, 4, 5].map((score) => (
                                    <Button
                                      key={score}
                                      variant={qualityScore === score ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setQualityScore(score)}
                                    >
                                      {score}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Feedback</label>
                                <Textarea
                                  placeholder="Add notes about this brief's quality..."
                                  value={feedback}
                                  onChange={(e) => setFeedback(e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <Button onClick={() => submitReview(brief.id)}>
                                Submit Review
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => regenerateBrief(brief.host_id)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {briefs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No briefs found for this period</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
