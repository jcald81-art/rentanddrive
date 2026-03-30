'use client'

import { useState, useEffect } from 'react'
import { Phone, Bot, UserCheck, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CallLog {
  id: string
  phoneNumber: string
  duration: number
  aiHandled: boolean
  transferred: boolean
  issueType: string
  resolution: 'resolved' | 'pending' | 'transferred'
  sentiment: 'positive' | 'neutral' | 'negative'
  timestamp: string
  transcript: string[]
}

export default function AdminVoicePage() {
  const [calls, setCalls] = useState<CallLog[]>([])
  const [expandedCall, setExpandedCall] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalToday: 24,
    totalWeek: 156,
    totalMonth: 612,
    aiResolutionRate: 82,
    avgDuration: 3.5,
    transferRate: 18,
    missedCalls: 2,
  })

  const [issueBreakdown] = useState([
    { type: 'Rental Questions', percentage: 35 },
    { type: 'Roadside', percentage: 20 },
    { type: 'Billing', percentage: 18 },
    { type: 'Booking Changes', percentage: 15 },
    { type: 'Disputes', percentage: 8 },
    { type: 'Other', percentage: 4 },
  ])

  useEffect(() => {
    // Mock call logs
    setCalls([
      {
        id: '1',
        phoneNumber: '775-***-1234',
        duration: 245,
        aiHandled: true,
        transferred: false,
        issueType: 'Rental Questions',
        resolution: 'resolved',
        sentiment: 'positive',
        timestamp: '2026-03-29T14:30:00Z',
        transcript: [
          'AI: Hi, thanks for calling rentanddrive! How can I help you today?',
          'Caller: Hi, I need to know what time I should return the car tomorrow.',
          'AI: I can see your rental of the 2023 Toyota RAV4 ends tomorrow at 2 PM. You have a 30-minute grace period, so anytime before 2:30 PM is fine.',
          'Caller: Perfect, thank you!',
          'AI: You\'re welcome! Have a great rest of your trip!',
        ],
      },
      {
        id: '2',
        phoneNumber: '530-***-5678',
        duration: 480,
        aiHandled: false,
        transferred: true,
        issueType: 'Billing',
        resolution: 'transferred',
        sentiment: 'negative',
        timestamp: '2026-03-29T13:15:00Z',
        transcript: [
          'AI: Hi, thanks for calling rentanddrive! What can I help you with?',
          'Caller: I was charged twice for my rental and I want a refund.',
          'AI: I\'m sorry to hear about the duplicate charge. Let me look into this for you. Can you confirm the last 4 digits of the card?',
          'Caller: This is ridiculous, I\'ve been dealing with this for a week!',
          'AI: I completely understand your frustration. Let me connect you with a member of our team who can resolve this immediately. Please hold.',
        ],
      },
      {
        id: '3',
        phoneNumber: '775-***-9012',
        duration: 120,
        aiHandled: true,
        transferred: false,
        issueType: 'Roadside',
        resolution: 'resolved',
        sentiment: 'neutral',
        timestamp: '2026-03-29T11:45:00Z',
        transcript: [
          'AI: Hi, I\'m here to help with your rental. What\'s going on?',
          'Caller: I got a flat tire near Tahoe City.',
          'AI: I\'m dispatching roadside assistance to your location now. Based on your GPS, you\'re on Highway 28 near Fanny Bridge. A service vehicle will be there in about 25 minutes. Stay safe!',
          'Caller: Thank you so much.',
        ],
      },
    ])
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Phone className="h-6 w-6" />
            DriveVoice Analytics
          </h1>
          <p className="text-muted-foreground">AI phone assistant performance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">Today</p>
              <p className="text-2xl font-bold font-mono">{stats.totalToday}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">This Week</p>
              <p className="text-2xl font-bold font-mono">{stats.totalWeek}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-1">This Month</p>
              <p className="text-2xl font-bold font-mono">{stats.totalMonth}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-1 text-green-400 mb-1">
                <Bot className="h-3 w-3" />
                <span className="text-xs">AI Resolution</span>
              </div>
              <p className="text-2xl font-bold font-mono text-green-400">{stats.aiResolutionRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-1 mb-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Avg Duration</span>
              </div>
              <p className="text-2xl font-bold font-mono">{stats.avgDuration}m</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-1 mb-1">
                <UserCheck className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Transfer Rate</span>
              </div>
              <p className="text-2xl font-bold font-mono">{stats.transferRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-1 text-red-400 mb-1">
                <AlertTriangle className="h-3 w-3" />
                <span className="text-xs">Missed</span>
              </div>
              <p className="text-2xl font-bold font-mono text-red-400">{stats.missedCalls}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Call Logs */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {calls.map((call) => (
                    <div
                      key={call.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-sm">{call.phoneNumber}</span>
                          <Badge className={cn(
                            'text-xs',
                            call.aiHandled ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          )}>
                            {call.aiHandled ? 'AI Handled' : 'Transferred'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{call.issueType}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-sm">{formatDuration(call.duration)}</span>
                          <Badge className={cn(
                            'text-xs',
                            call.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                            call.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          )}>
                            {call.sentiment}
                          </Badge>
                          {expandedCall === call.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </button>

                      {expandedCall === call.id && (
                        <div className="border-t p-4 bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-3">
                            {new Date(call.timestamp).toLocaleString()}
                          </p>
                          <div className="space-y-2">
                            {call.transcript.map((line, i) => (
                              <p
                                key={i}
                                className={cn(
                                  'text-sm p-2 rounded',
                                  line.startsWith('AI:') ? 'bg-[#FFD84D]/10 ml-4' : 'bg-muted mr-4'
                                )}
                              >
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Issue Breakdown */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Top Issue Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {issueBreakdown.map((issue) => (
                    <div key={issue.type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{issue.type}</span>
                        <span className="font-mono">{issue.percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#FFD84D] rounded-full"
                          style={{ width: `${issue.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Call Center Note */}
            <Card className="mt-4 border-dashed">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">
                  <strong>Call Center Integration</strong>
                  <br /><br />
                  Phase 1: AnswerConnect ($1.19/min)
                  <br />
                  Phase 2: TeleDirect (50+ calls/day)
                  <br />
                  Phase 3: Crescendo AI ($1/resolution)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
