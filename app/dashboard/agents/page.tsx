'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bot, 
  MessageSquare, 
  DollarSign, 
  Star, 
  TrendingUp, 
  Car,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Cpu,
  Zap,
  Power,
  PowerOff,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface ModelStatus {
  id: string
  model_name: string
  provider: string
  model_id: string
  is_available: boolean
  is_manually_disabled: boolean
  last_checked: string | null
  last_success: string | null
  avg_response_ms: number
  error_count: number
  consecutive_failures: number
  total_requests: number
  total_tokens_used: number
  total_cost_cents: number
  cost_today_cents: number
}

interface AgentLog {
  id: string
  agent_name: string
  action_type: string
  input_data: any
  output_data: any
  model_used: string
  tokens_used: number
  cost_cents: number
  status: string
  created_at: string
}

interface AgentStats {
  name: string
  icon: React.ReactNode
  description: string
  endpoint: string
  lastRun: string | null
  totalRuns: number
  successRate: number
  totalCost: number
}

export default function AgentsDashboard() {
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [stats, setStats] = useState<AgentStats[]>([])
  const [models, setModels] = useState<ModelStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [runningAgent, setRunningAgent] = useState<string | null>(null)

  const agents = [
    {
      name: 'communications',
      icon: <MessageSquare className="h-5 w-5" />,
      description: 'Automated renter SMS messaging for bookings',
      endpoint: '/api/agents/communications',
    },
    {
      name: 'pricing',
      icon: <DollarSign className="h-5 w-5" />,
      description: 'Dynamic rate optimization based on market data',
      endpoint: '/api/agents/pricing',
    },
    {
      name: 'reviews',
      icon: <Star className="h-5 w-5" />,
      description: 'Review sentiment analysis and response suggestions',
      endpoint: '/api/agents/reviews',
    },
    {
      name: 'market-intelligence',
      icon: <TrendingUp className="h-5 w-5" />,
      description: 'Competitor tracking and demand forecasting',
      endpoint: '/api/agents/market-intelligence',
    },
    {
      name: 'fleet-monitor',
      icon: <Car className="h-5 w-5" />,
      description: 'GPS tracking and proactive maintenance alerts',
      endpoint: '/api/agents/fleet-monitor',
    },
    {
      name: 'concierge',
      icon: <Bot className="h-5 w-5" />,
      description: 'Customer-facing AI chat assistant',
      endpoint: '/api/agents/concierge',
    },
  ]

  useEffect(() => {
    fetchLogs()
    fetchModels()
  }, [])

  async function fetchLogs() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/agent-logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        calculateStats(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    }
    setLoading(false)
  }

  async function fetchModels() {
    try {
      const response = await fetch('/api/admin/model-status')
      if (response.ok) {
        const data = await response.json()
        setModels(data.models || [])
      }
    } catch (error) {
      console.error('Failed to fetch model status:', error)
    }
  }

  async function toggleModel(modelName: string, disabled: boolean) {
    try {
      await fetch('/api/admin/model-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_name: modelName, disabled }),
      })
      fetchModels()
    } catch (error) {
      console.error('Failed to toggle model:', error)
    }
  }

  function calculateStats(logs: AgentLog[]) {
    const statsMap: Record<string, AgentStats> = {}
    
    for (const agent of agents) {
      const agentLogs = logs.filter(l => l.agent_name === agent.name)
      const successLogs = agentLogs.filter(l => l.status === 'success')
      const totalCost = agentLogs.reduce((sum, l) => sum + (l.cost_cents || 0), 0)
      
      statsMap[agent.name] = {
        ...agent,
        lastRun: agentLogs[0]?.created_at || null,
        totalRuns: agentLogs.length,
        successRate: agentLogs.length > 0 ? (successLogs.length / agentLogs.length) * 100 : 0,
        totalCost: totalCost / 100,
      }
    }

    setStats(Object.values(statsMap))
  }

  async function triggerAgent(agentName: string) {
    setRunningAgent(agentName)
    try {
      const agent = agents.find(a => a.name === agentName)
      if (!agent) return

      // For market intelligence and pricing, we need to POST with data
      if (agentName === 'market-intelligence') {
        await fetch(agent.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysis_type: 'manual_trigger' }),
        })
      } else if (agentName === 'pricing') {
        // Trigger for all vehicles
        await fetch(agent.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicle_id: 'all' }),
        })
      }

      // Refresh logs after trigger
      setTimeout(fetchLogs, 2000)
    } catch (error) {
      console.error('Failed to trigger agent:', error)
    }
    setRunningAgent(null)
  }

  const totalCost = logs.reduce((sum, l) => sum + (l.cost_cents || 0), 0) / 100
  const totalTokens = logs.reduce((sum, l) => sum + (l.tokens_used || 0), 0)
  const successRate = logs.length > 0 
    ? (logs.filter(l => l.status === 'success').length / logs.length * 100).toFixed(1) 
    : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">R&D Agent Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage AI agents for Rent and Drive</p>
        </div>
        <Button onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">Successful completions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Claude API usage</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">API costs</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((agent) => (
              <Card key={agent.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {agent.icon}
                      <CardTitle className="capitalize">{agent.name.replace('-', ' ')}</CardTitle>
                    </div>
                    <Badge variant={agent.successRate > 90 ? 'default' : agent.successRate > 50 ? 'secondary' : 'destructive'}>
                      {agent.successRate.toFixed(0)}% success
                    </Badge>
                  </div>
                  <CardDescription>{agent.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Runs</p>
                      <p className="font-medium">{agent.totalRuns}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">API Cost</p>
                      <p className="font-medium">${agent.totalCost.toFixed(2)}</p>
                    </div>
                  </div>
                  {agent.lastRun && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Last run: {new Date(agent.lastRun).toLocaleString()}
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => triggerAgent(agent.name)}
                    disabled={runningAgent === agent.name || agent.name === 'concierge'}
                  >
                    {runningAgent === agent.name ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      'Trigger Manually'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    AI Model Router Status
                  </CardTitle>
                  <CardDescription>
                    8 models configured for intelligent task routing with automatic failover
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchModels}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {models.map((model) => {
                  const isOnline = model.is_available && !model.is_manually_disabled
                  const costToday = (model.cost_today_cents / 100).toFixed(2)
                  
                  return (
                    <div 
                      key={model.id}
                      className={`p-4 border rounded-lg ${
                        isOnline ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isOnline ? (
                            <Power className="h-4 w-4 text-green-600" />
                          ) : (
                            <PowerOff className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-semibold capitalize">{model.model_name}</span>
                        </div>
                        <Switch
                          checked={!model.is_manually_disabled}
                          onCheckedChange={(checked) => toggleModel(model.model_name, !checked)}
                        />
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-3">{model.provider}</p>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Response</span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {model.avg_response_ms}ms
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Today</span>
                          <span>${costToday}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total</span>
                          <span>{model.total_requests.toLocaleString()} calls</span>
                        </div>
                        {model.consecutive_failures > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Failures</span>
                            <span>{model.consecutive_failures} consecutive</span>
                          </div>
                        )}
                      </div>
                      
                      {model.last_checked && (
                        <p className="text-xs text-muted-foreground mt-3">
                          Checked: {new Date(model.last_checked).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {models.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No model status data available. Run the health check cron job first.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Last 50 agent operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {logs.slice(0, 50).map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {log.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : log.status === 'error' ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium capitalize">{log.agent_name.replace('-', ' ')}</p>
                        <p className="text-sm text-muted-foreground">{log.action_type}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p>{log.tokens_used?.toLocaleString() || 0} tokens</p>
                      <p className="text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No agent activity logged yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
