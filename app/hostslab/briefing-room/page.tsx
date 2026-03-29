'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Zap,
  MapPin,
  Users,
  Car,
} from 'lucide-react'

interface MarketReport {
  id: string
  week_of: string
  summary: string
  market_position: 'leader' | 'competitive' | 'behind'
  avg_competitor_rate: number
  our_avg_rate: number
  upcoming_events: Event[]
  best_days: string[]
  created_at: string
}

interface Event {
  name: string
  date: string
  expected_demand: 'high' | 'medium' | 'low'
  suggested_premium: number
}

interface PricingRecommendation {
  vehicle_id: string
  vehicle_name: string
  current_rate: number
  recommended_rate: number
  change_percent: number
  confidence: number
  reason: string
}

interface CompetitorSnapshot {
  competitor: string
  avg_daily_rate: number
  vehicle_count: number
  change_from_last_week: number
}

export default function BriefingRoomPage() {
  const [report, setReport] = useState<MarketReport | null>(null)
  const [recommendations, setRecommendations] = useState<PricingRecommendation[]>([])
  const [competitors, setCompetitors] = useState<CompetitorSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [applyingPrice, setApplyingPrice] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/hostslab/briefing/report').then(r => r.json()),
      fetch('/api/hostslab/briefing/recommendations').then(r => r.json()),
      fetch('/api/hostslab/briefing/competitors').then(r => r.json()),
    ])
      .then(([reportData, recsData, compsData]) => {
        if (reportData.report) setReport(reportData.report)
        if (recsData.recommendations) setRecommendations(recsData.recommendations)
        if (compsData.competitors) setCompetitors(compsData.competitors)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const applyRecommendation = async (vehicleId: string, newRate: number) => {
    setApplyingPrice(vehicleId)
    try {
      await fetch(`/api/hostslab/vehicles/${vehicleId}/rate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_rate: newRate }),
      })
      setRecommendations(prev => prev.filter(r => r.vehicle_id !== vehicleId))
    } catch (err) {
      console.error('Failed to apply price:', err)
    } finally {
      setApplyingPrice(null)
    }
  }

  const applyAll = async () => {
    for (const rec of recommendations) {
      await applyRecommendation(rec.vehicle_id, rec.recommended_rate)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100)
  }

  const getMarketPositionBadge = (position: string) => {
    switch (position) {
      case 'leader':
        return <Badge className="bg-green-500">Market Leader</Badge>
      case 'competitive':
        return <Badge className="bg-blue-500">Competitive</Badge>
      case 'behind':
        return <Badge className="bg-amber-500">Below Market</Badge>
      default:
        return <Badge variant="secondary">{position}</Badge>
    }
  }

  const getDemandBadge = (demand: string) => {
    switch (demand) {
      case 'high':
        return <Badge className="bg-red-500">High Demand</Badge>
      case 'medium':
        return <Badge className="bg-amber-500">Medium</Badge>
      case 'low':
        return <Badge variant="secondary">Low</Badge>
      default:
        return <Badge variant="outline">{demand}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 w-full" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  // Default mock data if no report
  const displayReport = report || {
    week_of: new Date().toISOString(),
    summary: 'Market conditions are stable with moderate demand. Upcoming ski season expected to increase rates by 15-25%.',
    market_position: 'competitive' as const,
    avg_competitor_rate: 8500,
    our_avg_rate: 7900,
    upcoming_events: [
      { name: 'Lake Tahoe Ski Season Opens', date: '2024-11-22', expected_demand: 'high' as const, suggested_premium: 25 },
      { name: 'Thanksgiving Weekend', date: '2024-11-28', expected_demand: 'high' as const, suggested_premium: 30 },
      { name: 'Reno Air Races', date: '2024-09-15', expected_demand: 'medium' as const, suggested_premium: 15 },
    ],
    best_days: ['Friday', 'Saturday', 'Sunday'],
  }

  const displayCompetitors = competitors.length > 0 ? competitors : [
    { competitor: 'Turo (Reno)', avg_daily_rate: 8900, vehicle_count: 145, change_from_last_week: 3 },
    { competitor: 'Turo (Tahoe)', avg_daily_rate: 12500, vehicle_count: 89, change_from_last_week: 5 },
    { competitor: 'Enterprise', avg_daily_rate: 9500, vehicle_count: 50, change_from_last_week: 0 },
    { competitor: 'Hertz', avg_daily_rate: 8700, vehicle_count: 35, change_from_last_week: -2 },
  ]

  const displayRecs = recommendations.length > 0 ? recommendations : [
    { vehicle_id: '1', vehicle_name: '2023 Subaru Outback', current_rate: 7500, recommended_rate: 8500, change_percent: 13, confidence: 87, reason: 'High demand for AWD vehicles' },
    { vehicle_id: '2', vehicle_name: '2022 Toyota Tacoma', current_rate: 9500, recommended_rate: 10500, change_percent: 10, confidence: 92, reason: 'Truck shortage in market' },
    { vehicle_id: '3', vehicle_name: '2024 Tesla Model Y', current_rate: 12000, recommended_rate: 11000, change_percent: -8, confidence: 78, reason: 'EV supply increased' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#CC0000] rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">The Briefing Room</h1>
            <p className="text-muted-foreground">Command&Control weekly market intelligence</p>
          </div>
        </div>
        {displayReport.market_position && getMarketPositionBadge(displayReport.market_position)}
      </div>

      {/* Market Summary */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle className="text-white">Weekly Market Report</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Week of {new Date(displayReport.week_of).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg mb-4">{displayReport.summary}</p>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Competitor Avg Rate</p>
              <p className="text-2xl font-bold">{formatCurrency(displayReport.avg_competitor_rate)}/day</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Your Avg Rate</p>
              <p className="text-2xl font-bold">{formatCurrency(displayReport.our_avg_rate)}/day</p>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Best Days</p>
              <div className="flex gap-2 flex-wrap">
                {displayReport.best_days.map((day) => (
                  <Badge key={day} className="bg-green-600">{day}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Competitor Comparison */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#CC0000]" />
              <CardTitle>Competitor Rates</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayCompetitors.map((comp) => (
              <div key={comp.competitor} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{comp.competitor}</p>
                  <p className="text-sm text-muted-foreground">{comp.vehicle_count} vehicles</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(comp.avg_daily_rate)}/day</p>
                  <div className="flex items-center gap-1 text-sm">
                    {comp.change_from_last_week > 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-green-600">+{comp.change_from_last_week}%</span>
                      </>
                    ) : comp.change_from_last_week < 0 ? (
                      <>
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        <span className="text-red-600">{comp.change_from_last_week}%</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">No change</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#CC0000]" />
              <CardTitle>Upcoming Events & Demand</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayReport.upcoming_events.map((event, i) => (
              <div key={i} className="p-3 rounded-lg border">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {getDemandBadge(event.expected_demand)}
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">
                    Suggested premium: <span className="font-medium text-green-600">+{event.suggested_premium}%</span>
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Dollar Pricing Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <CardTitle>Dollar Pricing Recommendations</CardTitle>
                <CardDescription>AI-powered rate adjustments based on market analysis</CardDescription>
              </div>
            </div>
            {displayRecs.length > 0 && (
              <Button onClick={applyAll} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Apply All ({displayRecs.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {displayRecs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>All prices are optimized!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayRecs.map((rec) => (
                <div 
                  key={rec.vehicle_id}
                  className="p-4 rounded-lg border bg-card flex flex-col md:flex-row md:items-center gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{rec.vehicle_name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.reason}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Current</p>
                      <p className="font-medium">{formatCurrency(rec.current_rate)}</p>
                    </div>

                    <div className="flex items-center">
                      {rec.change_percent > 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Recommended</p>
                      <p className={`font-bold ${rec.change_percent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(rec.recommended_rate)}
                      </p>
                    </div>

                    <div className="text-center min-w-[80px]">
                      <p className="text-sm text-muted-foreground">Confidence</p>
                      <Progress value={rec.confidence} className="h-2 mt-1" />
                      <p className="text-xs mt-1">{rec.confidence}%</p>
                    </div>

                    <Button
                      size="sm"
                      disabled={applyingPrice === rec.vehicle_id}
                      onClick={() => applyRecommendation(rec.vehicle_id, rec.recommended_rate)}
                    >
                      {applyingPrice === rec.vehicle_id ? 'Applying...' : 'Apply'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
