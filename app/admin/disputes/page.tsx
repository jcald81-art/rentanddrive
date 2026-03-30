'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bot, Clock, AlertTriangle, CheckCircle2, Filter, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface Dispute {
  id: string
  referenceNumber: string
  type: string
  parties: string
  openedAt: string
  status: string
  amountAtStake: number
  aiRecommendation: string
}

const STATUS_COLORS: Record<string, string> = {
  opened: 'bg-blue-500/20 text-blue-400',
  responding: 'bg-yellow-500/20 text-yellow-400',
  ai_review: 'bg-purple-500/20 text-purple-400',
  mediated: 'bg-[#FFD84D]/20 text-[#FFD84D]',
  resolved: 'bg-green-500/20 text-green-400',
  escalated: 'bg-red-500/20 text-red-400',
}

export default function AdminDisputesPage() {
  const [filter, setFilter] = useState('all')
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [stats, setStats] = useState({
    open: 3,
    aiReview: 7,
    escalated: 2,
    avgResolutionTime: 18,
    aiResolutionRate: 84,
    avgSatisfaction: 4.1,
  })

  useEffect(() => {
    // Mock disputes data
    setDisputes([
      {
        id: '1',
        referenceNumber: 'RAD-D-20260329-001',
        type: 'cleanliness',
        parties: 'Sarah K. vs Mike R.',
        openedAt: '2026-03-29T10:30:00Z',
        status: 'mediated',
        amountAtStake: 45,
        aiRecommendation: '$45 partial refund',
      },
      {
        id: '2',
        referenceNumber: 'RAD-D-20260328-042',
        type: 'late_return',
        parties: 'John D. vs Lisa M.',
        openedAt: '2026-03-28T14:00:00Z',
        status: 'escalated',
        amountAtStake: 150,
        aiRecommendation: '$75 late fee + apology',
      },
      {
        id: '3',
        referenceNumber: 'RAD-D-20260327-023',
        type: 'mileage',
        parties: 'Alex P. vs Chris B.',
        openedAt: '2026-03-27T09:15:00Z',
        status: 'resolved',
        amountAtStake: 200,
        aiRecommendation: 'Split overage 50/50',
      },
    ])
  }, [])

  const filteredDisputes = disputes.filter(d => {
    if (filter === 'all') return true
    if (filter === 'needs_human') return d.status === 'escalated'
    if (filter === 'high_value') return d.amountAtStake >= 100
    if (filter === 'overdue') return d.status === 'opened' // Simplified
    return true
  })

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">DriveMediate Admin</h1>
          <p className="text-muted-foreground">Dispute management dashboard</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Open</span>
              </div>
              <p className="text-2xl font-bold font-mono">{stats.open}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-purple-400 mb-1">
                <Bot className="h-4 w-4" />
                <span className="text-xs">AI Review</span>
              </div>
              <p className="text-2xl font-bold font-mono">{stats.aiReview}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-red-400 mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs">Escalated</span>
              </div>
              <p className="text-2xl font-bold font-mono">{stats.escalated}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Avg Resolution</p>
              <p className="text-2xl font-bold font-mono">{stats.avgResolutionTime}h</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">AI Resolved</p>
              <p className="text-2xl font-bold font-mono text-green-400">{stats.aiResolutionRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Satisfaction</p>
              <p className="text-2xl font-bold font-mono">★{stats.avgSatisfaction}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4 mb-6">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter disputes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Disputes</SelectItem>
              <SelectItem value="needs_human">Needs Human</SelectItem>
              <SelectItem value="high_value">High Value ($100+)</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Disputes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Dispute Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Parties</th>
                    <th className="pb-3 font-medium">Opened</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">AI Recommendation</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDisputes.map((dispute) => (
                    <tr key={dispute.id} className="border-b last:border-0">
                      <td className="py-4">
                        <span className="font-mono text-sm">{dispute.referenceNumber}</span>
                      </td>
                      <td className="py-4">
                        <span className="capitalize text-sm">{dispute.type.replace('_', ' ')}</span>
                      </td>
                      <td className="py-4 text-sm">{dispute.parties}</td>
                      <td className="py-4">
                        <span className="font-mono text-sm text-muted-foreground">
                          {new Date(dispute.openedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4">
                        <Badge className={cn('text-xs', STATUS_COLORS[dispute.status])}>
                          {dispute.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <span className="font-mono text-sm">${dispute.amountAtStake}</span>
                      </td>
                      <td className="py-4 text-sm max-w-48 truncate">
                        {dispute.aiRecommendation}
                      </td>
                      <td className="py-4">
                        <Link href={`/dispute/${dispute.referenceNumber}`}>
                          <Button size="sm" variant="outline" className="gap-1">
                            Review
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
