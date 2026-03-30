'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, Clock, AlertTriangle, Bot, User, Shield, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, { color: string; icon: typeof Clock }> = {
  opened: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
  responding: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  ai_review: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Bot },
  mediated: { color: 'bg-[#FFD84D]/20 text-[#FFD84D] border-[#FFD84D]/30', icon: Bot },
  resolved: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
  escalated: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle },
}

interface TimelineEvent {
  id: string
  timestamp: string
  actor: 'renter' | 'host' | 'ai' | 'admin'
  action: string
  details?: string
}

interface DisputeData {
  id: string
  referenceNumber: string
  status: string
  type: string
  renterName: string
  hostName: string
  vehicle: string
  dates: string
  openedAt: string
  renterStatement: string
  hostStatement: string | null
  aiAnalysis: {
    summary: string
    platformData: string
    recommendation: string
    reasoning: string
    confidence: 'high' | 'medium' | 'low'
  } | null
  resolution: {
    action: string
    acceptedBy: string[]
  } | null
  timeline: TimelineEvent[]
}

export default function DisputeViewPage() {
  const params = useParams()
  const disputeId = params.disputeId as string

  const [dispute, setDispute] = useState<DisputeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedTimeline, setExpandedTimeline] = useState(false)

  useEffect(() => {
    // Mock dispute data
    setDispute({
      id: disputeId,
      referenceNumber: disputeId.startsWith('RAD') ? disputeId : `RAD-D-20260329-001`,
      status: 'mediated',
      type: 'cleanliness',
      renterName: 'Sarah K.',
      hostName: 'Mike R.',
      vehicle: '2023 Toyota RAV4',
      dates: 'Mar 25-28, 2026',
      openedAt: '2026-03-29T10:30:00Z',
      renterStatement: 'The vehicle was advertised as having all-season tires but had summer tires. This was dangerous for the mountain driving I needed.',
      hostStatement: 'The listing clearly shows photos of the current tires. The renter should have checked before booking.',
      aiAnalysis: {
        summary: 'Renter claims tires were not as described. Host states photos were accurate.',
        platformData: 'Listing photos show summer tires. No mention of all-season in description. Weather data shows snow conditions during rental dates.',
        recommendation: '$45 partial refund to renter',
        reasoning: 'While photos showed summer tires, the listing category was "Mountain Ready" which implies appropriate tires for conditions. Partial refund appropriate given the safety concern.',
        confidence: 'high',
      },
      resolution: null,
      timeline: [
        { id: '1', timestamp: '2026-03-29T10:30:00Z', actor: 'renter', action: 'Opened dispute', details: 'Type: Listing Accuracy' },
        { id: '2', timestamp: '2026-03-29T10:31:00Z', actor: 'admin', action: 'Notified host', details: '48-hour response timer started' },
        { id: '3', timestamp: '2026-03-29T14:22:00Z', actor: 'host', action: 'Submitted response' },
        { id: '4', timestamp: '2026-03-29T14:23:00Z', actor: 'ai', action: 'AI analysis triggered', details: 'Both parties responded' },
        { id: '5', timestamp: '2026-03-29T14:25:00Z', actor: 'ai', action: 'AI recommendation ready', details: 'Confidence: High' },
      ],
    })
    setIsLoading(false)
  }, [disputeId])

  const handleAccept = async () => {
    // Accept AI resolution
    await fetch('/api/dispute/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disputeId }),
    })
    // Refresh dispute data
  }

  const handleEscalate = async () => {
    // Escalate to human
    await fetch('/api/dispute/escalate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disputeId }),
    })
    // Refresh dispute data
  }

  if (isLoading || !dispute) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading dispute...</div>
      </div>
    )
  }

  const StatusIcon = STATUS_STYLES[dispute.status]?.icon || Clock

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge className={cn('px-3 py-1', STATUS_STYLES[dispute.status]?.color)}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {dispute.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold font-mono mb-2">{dispute.referenceNumber}</h1>
          <div className="text-muted-foreground text-sm space-y-1">
            <p>{dispute.renterName} vs {dispute.hostName}</p>
            <p>{dispute.vehicle} | {dispute.dates}</p>
            <p>Opened: {new Date(dispute.openedAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Statements */}
        <div className="space-y-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Renter Statement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{dispute.renterStatement}</p>
            </CardContent>
          </Card>

          {dispute.hostStatement ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Host Statement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{dispute.hostStatement}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Waiting for host response...</p>
                <p className="text-xs">47 hours remaining</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* AI Mediation Card */}
        {dispute.aiAnalysis && (
          <Card className="border-[#FFD84D]/30 bg-[#FFD84D]/5 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-[#FFD84D]" />
                DriveMediate AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Summary</h4>
                <p className="text-sm">{dispute.aiAnalysis.summary}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">What platform data shows</h4>
                <p className="text-sm">{dispute.aiAnalysis.platformData}</p>
              </div>

              <div className="bg-[#FFD84D]/10 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">Recommended Resolution</h4>
                <p className="font-semibold text-lg">{dispute.aiAnalysis.recommendation}</p>
                <p className="text-sm text-muted-foreground mt-2">{dispute.aiAnalysis.reasoning}</p>
                <Badge className="mt-2" variant="outline">
                  Confidence: {dispute.aiAnalysis.confidence}
                </Badge>
              </div>

              {!dispute.resolution && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    Do you accept this resolution?
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleAccept}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={handleEscalate}
                      variant="outline"
                      className="flex-1"
                    >
                      Reject — escalate to human review
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resolution Card */}
        {dispute.resolution && (
          <Card className="border-green-500/30 bg-green-500/5 mb-8">
            <CardContent className="py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Dispute Resolved</h3>
              <p className="text-muted-foreground">{dispute.resolution.action}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Both parties have accepted this resolution
              </p>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <button
              onClick={() => setExpandedTimeline(!expandedTimeline)}
              className="flex items-center justify-between w-full"
            >
              <CardTitle className="text-sm">Timeline</CardTitle>
              <ChevronDown className={cn(
                'h-4 w-4 transition-transform',
                expandedTimeline && 'rotate-180'
              )} />
            </button>
          </CardHeader>
          {expandedTimeline && (
            <CardContent>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-muted" />
                <div className="space-y-4">
                  {dispute.timeline.map((event) => (
                    <div key={event.id} className="flex gap-4 relative">
                      <div className={cn(
                        'h-6 w-6 rounded-full flex items-center justify-center z-10',
                        event.actor === 'ai' ? 'bg-[#FFD84D]/20' :
                        event.actor === 'admin' ? 'bg-blue-500/20' :
                        'bg-muted'
                      )}>
                        {event.actor === 'ai' ? (
                          <Bot className="h-3 w-3 text-[#FFD84D]" />
                        ) : event.actor === 'admin' ? (
                          <Shield className="h-3 w-3 text-blue-400" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">{event.action}</p>
                        {event.details && (
                          <p className="text-xs text-muted-foreground">{event.details}</p>
                        )}
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
