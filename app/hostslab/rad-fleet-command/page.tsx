'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Eye, Activity, DollarSign, Shield, MessageSquare, Camera,
  Radar, TrendingUp, AlertTriangle, CheckCircle, Clock, Zap,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Pause, Play,
  RefreshCw, Settings, Bot, Cpu, Database, Globe
} from 'lucide-react'

// Agent configuration with Expedition theming
const EXPEDITION_AGENTS = [
  {
    id: 'dollar',
    name: 'Dollar',
    fullName: 'Dollar - The Trailblazer',
    role: 'Dynamic Pricing',
    description: 'Optimizes your rates based on market conditions, events, and demand',
    icon: DollarSign,
    color: '#10B981',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    primaryModel: 'Claude 3.5 Sonnet',
    fallbackModel: 'GPT-4o',
    taskType: 'pricing',
    metrics: { optimizations: 47, avgIncrease: '+18%', lastRun: '2 min ago' }
  },
  {
    id: 'shield',
    name: 'Shield',
    fullName: 'Shield - The Guardian',
    role: 'Reputation Management',
    description: 'Monitors reviews, crafts responses, and protects your reputation',
    icon: Shield,
    color: '#3B82F6',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    primaryModel: 'Claude 3.5 Sonnet',
    fallbackModel: 'Gemini 1.5 Pro',
    taskType: 'reviews',
    metrics: { reviewsHandled: 23, avgRating: 4.8, responseRate: '98%' }
  },
  {
    id: 'securelink',
    name: 'SecureLink',
    fullName: 'SecureLink - The Diplomat',
    role: 'Guest Communications',
    description: 'Automates guest messages while keeping your info private',
    icon: MessageSquare,
    color: '#F59E0B',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    primaryModel: 'Llama 3.1 70B (Groq)',
    fallbackModel: 'Claude 3.5 Sonnet',
    taskType: 'communications',
    metrics: { messagesSent: 156, avgResponseTime: '< 2 min', satisfaction: '96%' }
  },
  {
    id: 'fleet',
    name: 'RAD Fleet',
    fullName: 'RAD Fleet Command',
    role: 'Fleet Tracking',
    description: 'GPS tracking, geofencing, and real-time vehicle monitoring',
    icon: Radar,
    color: '#8B5CF6',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-500/30',
    primaryModel: 'Bouncie API + Rules Engine',
    fallbackModel: 'Local Processing',
    taskType: 'tracking',
    metrics: { vehiclesTracked: 6, alertsToday: 3, geofences: 12 }
  },
  {
    id: 'cartegrity',
    name: 'Inspector Cartegrity',
    fullName: 'Inspector Cartegrity - The Cartographer',
    role: 'Vehicle Inspections',
    description: 'AI damage detection and inspection reports via carfidelity.ai',
    icon: Camera,
    color: '#CC0000',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    primaryModel: 'Gemini 2.0 Flash',
    fallbackModel: 'Claude 3.5 Sonnet',
    taskType: 'document_analysis',
    metrics: { inspections: 89, damageDetected: 7, accuracy: '99.2%' }
  }
]

// System health metrics
const SYSTEM_METRICS = {
  totalRequests: 1247,
  avgLatency: 342,
  successRate: 99.7,
  tokensUsed: 847293,
  costToday: 12.47,
  activeAgents: 5
}

export default function RADFleetCommandPage() {
  const [loading, setLoading] = useState(true)
  const [agentStates, setAgentStates] = useState<Record<string, boolean>>({
    dollar: true,
    shield: true,
    securelink: true,
    fleet: true,
    cartegrity: true
  })
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 800)
  }, [])

  const toggleAgent = (agentId: string) => {
    setAgentStates(prev => ({ ...prev, [agentId]: !prev[agentId] }))
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center">
            <Eye className="h-8 w-8 text-[#CC0000]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              RAD Fleet Command
              <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                All Systems Nominal
              </Badge>
            </h1>
            <p className="text-muted-foreground">RAD Agent Command Center - Monitor and control your AI crew</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Activity className="h-4 w-4" />
              Requests Today
            </div>
            <p className="text-2xl font-bold">{SYSTEM_METRICS.totalRequests.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Zap className="h-4 w-4" />
              Avg Latency
            </div>
            <p className="text-2xl font-bold">{SYSTEM_METRICS.avgLatency}ms</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              Success Rate
            </div>
            <p className="text-2xl font-bold">{SYSTEM_METRICS.successRate}%</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Database className="h-4 w-4" />
              Tokens Used
            </div>
            <p className="text-2xl font-bold">{(SYSTEM_METRICS.tokensUsed / 1000).toFixed(0)}K</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Cost Today
            </div>
            <p className="text-2xl font-bold">${SYSTEM_METRICS.costToday}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Bot className="h-4 w-4" />
              Active Agents
            </div>
            <p className="text-2xl font-bold">{Object.values(agentStates).filter(Boolean).length}/5</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="agents">Agent Control</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="routing">AI Routing</TabsTrigger>
        </TabsList>

        {/* Agent Control Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {EXPEDITION_AGENTS.map(agent => {
              const Icon = agent.icon
              const isActive = agentStates[agent.id]
              
              return (
                <Card 
                  key={agent.id}
                  className={`${agent.bgColor} ${agent.borderColor} border transition-all cursor-pointer hover:scale-[1.02] ${!isActive ? 'opacity-50' : ''}`}
                  onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-12 w-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${agent.color}20` }}
                        >
                          <Icon className="h-6 w-6" style={{ color: agent.color }} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          <CardDescription>{agent.role}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <Switch 
                          checked={isActive}
                          onCheckedChange={() => toggleAgent(agent.id)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{agent.description}</p>
                    
                    {/* Model Info */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Cpu className="h-3 w-3" />
                      <span>{agent.primaryModel}</span>
                      <span className="text-slate-600">|</span>
                      <span>Fallback: {agent.fallbackModel}</span>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(agent.metrics).map(([key, value]) => (
                        <div key={key} className="bg-black/20 rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="font-semibold text-sm">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Status Bar */}
                    <div className="mt-4 flex items-center justify-between">
                      <Badge 
                        variant={isActive ? 'default' : 'secondary'}
                        className={isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : ''}
                      >
                        {isActive ? 'Active' : 'Paused'}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Last active: {agent.metrics.lastRun || 'Now'}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Master Controls */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Master Controls</CardTitle>
              <CardDescription>Quick actions for all agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  onClick={() => setAgentStates({ dollar: true, shield: true, securelink: true, fleet: true, cartegrity: true })}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Activate All
                </Button>
                <Button 
                  variant="outline"
                  className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  onClick={() => setAgentStates({ dollar: false, shield: false, securelink: false, fleet: false, cartegrity: false })}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause All
                </Button>
                <Button variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline">
                  <Globe className="h-4 w-4 mr-2" />
                  View API Docs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Real-time agent activity feed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { agent: 'Dollar', action: 'Updated pricing for Toyota 4Runner', time: '2 min ago', type: 'success' },
                  { agent: 'Shield', action: 'Generated response for 5-star review', time: '5 min ago', type: 'success' },
                  { agent: 'SecureLink', action: 'Sent check-in instructions to guest', time: '8 min ago', type: 'success' },
                  { agent: 'RAD Fleet', action: 'Geofence alert: Vehicle left Reno area', time: '12 min ago', type: 'warning' },
                  { agent: 'Inspector Cartegrity', action: 'Completed pre-trip inspection #CFI-2024-089', time: '15 min ago', type: 'success' },
                  { agent: 'Dollar', action: 'Surge pricing activated for Hot August Nights', time: '23 min ago', type: 'info' },
                  { agent: 'Shield', action: 'Flagged negative review for manual review', time: '31 min ago', type: 'warning' },
                  { agent: 'SecureLink', action: 'Booking confirmation sent', time: '45 min ago', type: 'success' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors">
                    <div className={`h-2 w-2 rounded-full ${
                      item.type === 'success' ? 'bg-emerald-400' : 
                      item.type === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold text-white">{item.agent}</span>
                        <span className="text-muted-foreground"> - {item.action}</span>
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
                <CardDescription>Success rates by agent (last 7 days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {EXPEDITION_AGENTS.map(agent => (
                    <div key={agent.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{agent.name}</span>
                        <span className="text-emerald-400">99.{Math.floor(Math.random() * 9)}%</span>
                      </div>
                      <Progress value={99 + Math.random()} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Token usage by agent (today)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { agent: 'Dollar', cost: 4.23, tokens: 312000, trend: 'up' },
                    { agent: 'Shield', cost: 3.12, tokens: 234000, trend: 'down' },
                    { agent: 'SecureLink', cost: 2.89, tokens: 189000, trend: 'up' },
                    { agent: 'Inspector Cartegrity', cost: 1.78, tokens: 89000, trend: 'stable' },
                    { agent: 'RAD Fleet', cost: 0.45, tokens: 23000, trend: 'stable' },
                  ].map(item => (
                    <div key={item.agent} className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                      <span className="font-medium">{item.agent}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{(item.tokens / 1000).toFixed(0)}K tokens</span>
                        <span className="font-semibold">${item.cost}</span>
                        {item.trend === 'up' ? (
                          <ArrowUpRight className="h-4 w-4 text-red-400" />
                        ) : item.trend === 'down' ? (
                          <ArrowDownRight className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Routing Tab */}
        <TabsContent value="routing">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle>AI Model Routing Configuration</CardTitle>
              <CardDescription>How agents select and route to AI providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {EXPEDITION_AGENTS.map(agent => {
                  const Icon = agent.icon
                  return (
                    <div key={agent.id} className="p-4 rounded-lg bg-black/20 border border-slate-700">
                      <div className="flex items-center gap-3 mb-4">
                        <Icon className="h-5 w-5" style={{ color: agent.color }} />
                        <span className="font-semibold">{agent.fullName}</span>
                        <Badge variant="outline" className="ml-auto">{agent.taskType}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Primary Model</p>
                          <p className="font-medium text-emerald-400">{agent.primaryModel}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Fallback Model</p>
                          <p className="font-medium text-amber-400">{agent.fallbackModel}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Failover Trigger</p>
                          <p className="font-medium">Timeout &gt; 30s or Error Rate &gt; 5%</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
