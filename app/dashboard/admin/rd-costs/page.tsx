'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bot,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Zap,
  MessageSquare,
  Shield,
  Navigation,
  Sparkles,
  Trophy,
  Download,
  Calendar,
  BarChart3,
} from 'lucide-react'

interface CostStats {
  total_this_month: number
  total_last_month: number
  budget_limit: number
  projected_monthly: number
  cost_per_booking: number
  total_api_calls: number
}

interface ModelCost {
  model: string
  provider: string
  agent: string
  calls: number
  input_tokens: number
  output_tokens: number
  cost: number
}

interface DailyCost {
  date: string
  total: number
  by_agent: Record<string, number>
}

interface AgentCost {
  agent: string
  icon: React.ElementType
  color: string
  total_cost: number
  total_calls: number
  avg_cost_per_call: number
  primary_model: string
}

const AGENT_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  SecureLink: { icon: MessageSquare, color: 'text-blue-500' },
  Dollar: { icon: DollarSign, color: 'text-green-500' },
  Shield: { icon: Shield, color: 'text-purple-500' },
  'Command&Control': { icon: Navigation, color: 'text-amber-500' },
  Pulse: { icon: Zap, color: 'text-red-500' },
  Funtime: { icon: Trophy, color: 'text-pink-500' },
}

export default function RDCostsPage() {
  const [stats, setStats] = useState<CostStats | null>(null)
  const [modelCosts, setModelCosts] = useState<ModelCost[]>([])
  const [dailyCosts, setDailyCosts] = useState<DailyCost[]>([])
  const [agentCosts, setAgentCosts] = useState<AgentCost[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    fetchData()
  }, [period])

  async function fetchData() {
    setLoading(true)
    try {
      const [statsRes, modelsRes, dailyRes, agentsRes] = await Promise.all([
        fetch(`/api/admin/rd-costs/stats?period=${period}`),
        fetch(`/api/admin/rd-costs/by-model?period=${period}`),
        fetch(`/api/admin/rd-costs/daily?period=${period}`),
        fetch(`/api/admin/rd-costs/by-agent?period=${period}`),
      ])
      
      if (statsRes.ok) setStats(await statsRes.json())
      if (modelsRes.ok) setModelCosts((await modelsRes.json()).models || [])
      if (dailyRes.ok) setDailyCosts((await dailyRes.json()).daily || [])
      if (agentsRes.ok) {
        const data = await agentsRes.json()
        setAgentCosts((data.agents || []).map((a: AgentCost) => ({
          ...a,
          icon: AGENT_CONFIG[a.agent]?.icon || Bot,
          color: AGENT_CONFIG[a.agent]?.color || 'text-gray-500',
        })))
      }
    } catch (error) {
      console.error('Failed to fetch R&D costs:', error)
    }
    setLoading(false)
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('en-US').format(num)

  const budgetUsed = stats ? (stats.total_this_month / stats.budget_limit) * 100 : 0
  const monthOverMonth = stats && stats.total_last_month > 0
    ? ((stats.total_this_month - stats.total_last_month) / stats.total_last_month) * 100
    : 0

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
            <Bot className="h-8 w-8 text-[#CC0000]" />
            R&D Agent Costs
          </h1>
          <p className="text-muted-foreground">AI model usage and cost tracking</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-[#CC0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.total_this_month || 0)}</div>
            <div className="flex items-center gap-1 text-xs">
              {monthOverMonth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-500" />
              )}
              <span className={monthOverMonth >= 0 ? 'text-red-500' : 'text-green-500'}>
                {Math.abs(monthOverMonth).toFixed(1)}% vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={budgetUsed > 80 ? 'border-amber-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetUsed.toFixed(1)}%</div>
            <Progress value={Math.min(budgetUsed, 100)} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              of {formatCurrency(stats?.budget_limit || 0)} limit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Per Booking</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.cost_per_booking || 0)}</div>
            <p className="text-xs text-muted-foreground">AI cost per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats?.total_api_calls || 0)}</div>
            <p className="text-xs text-muted-foreground">Total this period</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Cost Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily AI Spend</CardTitle>
          <CardDescription>Cost breakdown over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-end gap-1">
            {dailyCosts.map((day, index) => {
              const maxCost = Math.max(...dailyCosts.map(d => d.total), 1)
              const height = (day.total / maxCost) * 100
              return (
                <div
                  key={index}
                  className="flex-1 bg-[#CC0000]/20 hover:bg-[#CC0000]/40 transition-colors rounded-t relative group cursor-pointer"
                  style={{ height: `${Math.max(height, 2)}%` }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {formatCurrency(day.total)}
                    <br />
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for detailed breakdown */}
      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents">By Agent</TabsTrigger>
          <TabsTrigger value="models">By Model</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agentCosts.map((agent) => {
              const Icon = agent.icon
              return (
                <Card key={agent.agent}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${agent.color}`} />
                      {agent.agent}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(agent.total_cost)}</div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>API Calls:</span>
                        <span>{formatNumber(agent.total_calls)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg/Call:</span>
                        <span>{formatCurrency(agent.avg_cost_per_call)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Model:</span>
                        <Badge variant="outline" className="text-xs">{agent.primary_model}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="models" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Usage Breakdown</CardTitle>
              <CardDescription>Cost and usage by AI model</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Input Tokens</TableHead>
                    <TableHead className="text-right">Output Tokens</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelCosts.map((model, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{model.model}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{model.provider}</Badge>
                      </TableCell>
                      <TableCell>{model.agent}</TableCell>
                      <TableCell className="text-right">{formatNumber(model.calls)}</TableCell>
                      <TableCell className="text-right">{formatNumber(model.input_tokens)}</TableCell>
                      <TableCell className="text-right">{formatNumber(model.output_tokens)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(model.cost)}</TableCell>
                    </TableRow>
                  ))}
                  {modelCosts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No usage data yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cost Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Optimization</CardTitle>
          <CardDescription>Recommendations to reduce AI spend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border bg-muted/30">
              <h4 className="font-medium mb-2">Use Smaller Models</h4>
              <p className="text-sm text-muted-foreground">
                Switch routine tasks to GPT-4o-mini or Gemini Flash for 10x cost savings.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <h4 className="font-medium mb-2">Cache Responses</h4>
              <p className="text-sm text-muted-foreground">
                Enable response caching for repeated queries like pricing lookups.
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30">
              <h4 className="font-medium mb-2">Batch Processing</h4>
              <p className="text-sm text-muted-foreground">
                Combine multiple operations into single API calls where possible.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
