'use client'

import { AGENT_CONFIGS, AgentConfig } from '@/lib/agents/agent-configs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Radio, 
  Gauge, 
  Shield, 
  Binoculars, 
  HeartPulse, 
  Rocket, 
  BadgeCheck, 
  Camera, 
  Eye, 
  Backpack,
  Compass
} from 'lucide-react'

// Map agent IDs to icons
const AGENT_ICONS: Record<string, React.ElementType> = {
  'rad-comms': Radio,
  'rad-pricing': Gauge,
  'rad-reputation': Shield,
  'rad-intel': Binoculars,
  'rad-fleet': HeartPulse,
  'rad-rewards': Rocket,
  'rad-verify': BadgeCheck,
  'rad-inspektlabs': Camera,
  'rad-secure': Eye,
  'rad-upsell': Backpack,
  'rad': Compass,
}

export default function HostAIAgentsPage() {
  const agents = Object.values(AGENT_CONFIGS) as AgentConfig[]
  const activeAgent = agents.find(a => a.status === 'active')
  const stagedAgents = agents.filter(a => a.status === 'staged')

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">AI Agents</h1>
          <p className="text-muted-foreground mt-2">
            Your AI-powered team that handles everything from communications to pricing optimization.
          </p>
        </div>

        {/* Active Agent - RAD */}
        {activeAgent && (
          <div className="mb-12">
            <Card className="border-2 border-[#2D4A2D] bg-gradient-to-br from-[#2D4A2D]/10 to-transparent">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: activeAgent.color }}
                    >
                      {(() => {
                        const Icon = AGENT_ICONS[activeAgent.id] || Compass
                        return <Icon className="h-8 w-8" style={{ color: activeAgent.textColor }} />
                      })()}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-2xl">{activeAgent.name}</CardTitle>
                        <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                          Active
                        </Badge>
                      </div>
                      <CardDescription className="text-base mt-1">{activeAgent.role}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {activeAgent.description}
                </p>
                <div className="mt-4 p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-foreground font-medium">
                    RAD is your primary AI concierge at launch. It handles all inquiries, coordinates responses, 
                    and will seamlessly delegate to specialist agents as they activate during platform scaling.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Staged Agents Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">Coming to RAD</h2>
            <p className="text-sm text-muted-foreground mt-1">
              These specialized agents activate as the platform scales. RAD handles everything at launch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stagedAgents.map((agent) => {
              const Icon = AGENT_ICONS[agent.id] || Compass
              return (
                <Card 
                  key={agent.id} 
                  className="opacity-60 cursor-default border-muted"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: agent.color }}
                        >
                          <Icon className="h-5 w-5" style={{ color: agent.textColor }} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{agent.name}</CardTitle>
                          <CardDescription className="text-xs">{agent.role}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground/30">
                        Coming Soon
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {agent.staged_reason}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
