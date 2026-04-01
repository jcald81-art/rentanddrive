'use client'

import { 
  Brain,
  MessageSquare, 
  TrendingUp, 
  Activity, 
  ShieldCheck, 
  Camera, 
  AlertTriangle,
  Sparkles,
} from 'lucide-react'

// RAD capabilities - the unified AI brain
const RAD_CAPABILITIES = [
  {
    icon: MessageSquare,
    title: 'Smart Communications',
    description: 'Booking confirmations, check-in instructions, and dispute responses — all handled automatically.',
  },
  {
    icon: TrendingUp,
    title: 'Dynamic Pricing',
    description: 'Real-time market analysis sets optimal rates across your fleet, maximizing revenue.',
  },
  {
    icon: Activity,
    title: 'Fleet Health Monitoring',
    description: 'OBD2 telemetry predicts maintenance needs before a breakdown costs you a booking.',
  },
  {
    icon: ShieldCheck,
    title: 'Driver Verification',
    description: 'License OCR and face match verify every driver before they touch your vehicle.',
  },
  {
    icon: Camera,
    title: 'Photo Session Guidance',
    description: 'AI-guided mobile capture ensures consistent, professional vehicle photos every time.',
  },
  {
    icon: AlertTriangle,
    title: 'Recall Checks',
    description: 'VIN-based safety recall monitoring keeps your fleet compliant and renters safe.',
  },
]

export function AgentsSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        {/* Main RAD Feature */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          {/* RAD Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#CC0000] to-[#990000] mb-6 shadow-lg">
            <Brain className="w-10 h-10 text-white" />
          </div>
          
          <span className="text-xs font-medium tracking-[0.08em] uppercase text-[#CC0000] mb-3 block">
            Platform Intelligence
          </span>
          
          <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-5">
            Meet RAD
          </h2>
          
          <p className="text-muted-foreground text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed">
            One AI brain powers everything at RentAndDrive. From the moment a vehicle is listed to the final review, RAD handles communications, pricing, verification, and fleet health — so you can focus on growing your business.
          </p>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {RAD_CAPABILITIES.map((capability, index) => {
            const IconComponent = capability.icon
            return (
              <div
                key={index}
                className="group relative bg-card rounded-xl border border-border p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[#CC0000]/20"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-[#CC0000]/10 flex items-center justify-center mb-4 group-hover:bg-[#CC0000]/15 transition-colors">
                  <IconComponent className="w-6 h-6 text-[#CC0000]" />
                </div>

                {/* Title */}
                <h3 className="font-medium text-lg text-card-foreground mb-2">
                  {capability.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {capability.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-[#CC0000]" />
            <span>Powered by RAD — the intelligent core of RentAndDrive</span>
          </div>
        </div>
      </div>
    </section>
  )
}
