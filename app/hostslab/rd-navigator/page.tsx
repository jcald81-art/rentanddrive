'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MessageSquare,
  DollarSign,
  Shield,
  Radar,
  Activity,
  Gamepad2,
  Zap,
  Play,
  RefreshCw,
  Clock,
  TrendingUp,
  Bot,
} from 'lucide-react'

interface AgentData {
  name: string
  displayName: string
  customName: string | null
  status: 'active' | 'idle' | 'error' | 'running'
  actionsToday: number
  costToday: number
  lastAction: string
  lastActionTime: string
  currentTask: string | null
}

interface ActivityLog {
  id: string
  agent: string
  action: string
  details: string
  cost: number
  created_at: string
}

interface CostSummary {
  totalThisMonth: number
  costPerBooking: number
  breakdown: { agent: string; cost: number }[]
}

const AGENT_CONFIG: Record<string, { icon: React.ReactNode; color: string; description: string }> = {
  securelink: {
    icon: <MessageSquare className="h-6 w-6" />,
    color: 'bg-blue-500',
    description: 'Communications & Notifications',
  },
  dollar: {
    icon: <DollarSign className="h-6 w-6" />,
    color: 'bg-green-500',
    description: 'Dynamic Pricing Engine',
  },
  shield: {
    icon: <Shield className="h-6 w-6" />,
    color: 'bg-purple-500',
    description: 'Reputation Management',
  },
  commandcontrol: {
    icon: <Radar className="h-6 w-6" />,
    color: 'bg-amber-500',
    description: 'Market Intelligence',
  },
  pulse: {
    icon: <Activity className="h-6 w-6" />,
    color: 'bg-red-500',
    description: 'Fleet Health Monitor',
  },
  funtime: {
    icon: <Gamepad2 className="h-6 w-6" />,
    color: 'bg-pink-500',
    description: 'Gamification Engine',
  },
}

export default function RDNavigatorPage() {
  const [agents, setAgents] = useState<AgentData[]>([])
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([])
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [triggeringAgent, setTriggeringAgent] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = () => {
    Promise.all([
      fetch('/api/hostslab/agents').then(r => r.json()),
      fetch('/api/hostslab/agents/activity').then(r => r.json()),
      fetch('/api/hostslab/agents/costs').then(r => r.json()),
    ])
      .then(([agentsData, activityData, costsData]) => {
        if (agentsData.agents) setAgents(agentsData.agents)
        if (activityData.log) setActivityLog(activityData.log)
        if (costsData) setCostSummary(costsData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const triggerAgent = async (agentName: string) => {
    setTriggeringAgent(agentName)
    try {
      await fetch(`/api/hostslab/agents/${agentName}/trigger`, { method: 'POST' })
      // Refresh data after trigger
      setTimeout(fetchData, 2000)
    } catch (err) {
      console.error('Failed to trigger agent:', err)
    } finally {
      setTriggeringAgent(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatTime = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return then.toLocaleDateString()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 animate-pulse">Active</Badge>
      case 'running':
        return <Badge className="bg-blue-500 animate-pulse">Running</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Idle</Badge>
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    )
  }

  // Use default agents if none loaded
  const displayAgents = agents.length > 0 ? agents : [
    { name: 'securelink', displayName: 'SecureLink', customName: null, status: 'idle' as const, actionsToday: 0, costToday: 0, lastAction: 'Waiting for events', lastActionTime: '', currentTask: null },
    { name: 'dollar', displayName: 'Dollar', customName: null, status: 'idle' as const, actionsToday: 0, costToday: 0, lastAction: 'Waiting for scheduled run', lastActionTime: '', currentTask: null },
    { name: 'shield', displayName: 'Shield', customName: null, status: 'idle' as const, actionsToday: 0, costToday: 0, lastAction: 'Waiting for reviews', lastActionTime: '', currentTask: null },
    { name: 'commandcontrol', displayName: 'Command', customName: null, status: 'idle' as const, actionsToday: 0, costToday: 0, lastAction: 'Waiting for weekly scan', lastActionTime: '', currentTask: null },
    { name: 'pulse', displayName: 'Pulse', customName: null, status: 'idle' as const, actionsToday: 0, costToday: 0, lastAction: 'Monitoring fleet health', lastActionTime: '', currentTask: null },
    { name: 'funtime', displayName: 'Funtime', customName: null, status: 'idle' as const, actionsToday: 0, costToday: 0, lastAction: 'Processing XP awards', lastActionTime: '', currentTask: null },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#CC0000] rounded-lg">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">R&D Navigator</h1>
            <p className="text-muted-foreground">Mission control for your AI agents</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Cost Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(costSummary?.totalThisMonth || 0)}</p>
                <p className="text-sm text-muted-foreground">Total Cost This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(costSummary?.costPerBooking || 0)}</p>
                <p className="text-sm text-muted-foreground">Cost Per Booking</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {displayAgents.reduce((sum, a) => sum + a.actionsToday, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Actions Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayAgents.map((agent) => {
          const config = AGENT_CONFIG[agent.name] || { 
            icon: <Bot className="h-6 w-6" />, 
            color: 'bg-slate-500',
            description: 'AI Agent',
          }
          const isTriggering = triggeringAgent === agent.name

          return (
            <Card key={agent.name} className="relative overflow-hidden">
              {/* Status indicator strip */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                agent.status === 'active' || agent.status === 'running' ? 'bg-green-500' :
                agent.status === 'error' ? 'bg-red-500' : 'bg-slate-300'
              }`} />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${config.color} rounded-lg text-white`}>
                      {config.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {agent.customName || agent.displayName}
                      </CardTitle>
                      <CardDescription>{config.description}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(agent.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Current Task */}
                {agent.currentTask && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                    <span className="text-blue-600 font-medium">Working on: </span>
                    {agent.currentTask}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Actions Today</p>
                    <p className="text-xl font-semibold">{agent.actionsToday}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cost Today</p>
                    <p className="text-xl font-semibold">{formatCurrency(agent.costToday)}</p>
                  </div>
                </div>

                {/* Last Action */}
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Last Action</p>
                  <p className="text-sm font-medium">{agent.lastAction}</p>
                  {agent.lastActionTime && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatTime(agent.lastActionTime)}
                    </p>
                  )}
                </div>

                {/* Trigger Button */}
                <Button 
                  className="w-full"
                  variant="outline"
                  disabled={isTriggering || agent.status === 'running'}
                  onClick={() => triggerAgent(agent.name)}
                >
                  {isTriggering ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Manual Trigger
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Unified Activity Log</CardTitle>
          <CardDescription>Recent actions from all agents</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {activityLog.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activityLog.map((log) => {
                  const config = AGENT_CONFIG[log.agent] || { 
                    icon: <Bot className="h-4 w-4" />, 
                    color: 'bg-slate-500',
                  }
                  
                  return (
                    <div 
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className={`p-1.5 ${config.color} rounded text-white flex-shrink-0`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm capitalize">{log.agent}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(log.created_at)}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                      </div>
                      {log.cost > 0 && (
                        <Badge variant="outline" className="flex-shrink-0">
                          {formatCurrency(log.cost)}
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
