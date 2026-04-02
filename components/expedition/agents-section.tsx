import { Bot, Shield, TrendingUp, MessageCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const agents = [
  {
    icon: MessageCircle,
    name: 'R&D Concierge',
    description: 'AI-powered assistant helps you find the perfect vehicle and answers questions instantly.',
    color: 'bg-[#CC0000]',
  },
  {
    icon: Shield,
    name: 'DriveShield',
    description: 'Smart protection that analyzes every booking for safety. Peace of mind, automated.',
    color: 'bg-emerald-600',
  },
  {
    icon: TrendingUp,
    name: 'SmartRate',
    description: 'Dynamic pricing that ensures hosts earn more and renters get fair deals.',
    color: 'bg-blue-600',
  },
  {
    icon: Bot,
    name: 'Fleet Monitor',
    description: 'Real-time vehicle tracking and maintenance alerts keep your ride in top shape.',
    color: 'bg-amber-600',
  },
]

export function AgentsSection() {
  return (
    <section className="bg-[#F5F3EF] py-20">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#CC0000]/20 bg-[#CC0000]/5 px-4 py-1.5">
            <Bot className="h-4 w-4 text-[#CC0000]" />
            <span className="text-sm font-medium text-[#CC0000]">AI-Powered Platform</span>
          </div>
          <h2 className="text-3xl font-bold text-[#0D0D0D] md:text-4xl">
            Meet Our AI Agents
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Advanced AI working behind the scenes to make your rental experience seamless, safe, and smart.
          </p>
        </div>

        {/* Agents Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {agents.map((agent) => (
            <Card key={agent.name} className="border-0 shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${agent.color}`}>
                  <agent.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 font-semibold text-[#0D0D0D]">{agent.name}</h3>
                <p className="text-sm text-muted-foreground">{agent.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
