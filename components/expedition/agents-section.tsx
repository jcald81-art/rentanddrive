'use client'

import { 
  Radio, 
  Gauge, 
  ShieldCheck, 
  Binoculars, 
  Activity, 
  Rocket, 
  BadgeCheck, 
  Camera, 
  Eye, 
  Backpack 
} from 'lucide-react'

// Expedition Agent Configuration - Full 10-Agent Roster
const EXPEDITION_AGENTS = [
  {
    id: 'beacon',
    name: 'Beacon',
    role: 'Communications',
    description: 'Drafts and sends every message — booking confirmations, check-in instructions, dispute responses, and post-trip follow-ups. Speaks like a trail guide: clear, direct, always moving the trip forward.',
    color: '#185FA5',
    icon: Radio,
  },
  {
    id: 'gauge',
    name: 'Gauge',
    role: 'Dynamic Pricing',
    description: 'Reads the market in real-time and sets optimal rates across your fleet. Cross-validated with a second AI model — every price recommendation is double-checked before it applies.',
    color: '#C4813A',
    icon: Gauge,
  },
  {
    id: 'guard',
    name: 'Guard',
    role: 'Reputation & Reviews',
    description: 'Protects your trust score. Scores every incoming review for authenticity, drafts responses, flags bad-faith claims, and detects coordinated review attacks before they land.',
    color: '#3B6D11',
    icon: ShieldCheck,
  },
  {
    id: 'scout',
    name: 'Scout',
    role: 'Market Intelligence',
    description: 'Runs recon ahead of the market. Tracks competitor pricing, monitors Turo and Getaround in your markets, surfaces demand spikes, and flags expansion opportunities in real-time.',
    color: '#534AB7',
    icon: Binoculars,
  },
  {
    id: 'vitals',
    name: 'Vitals',
    role: 'Fleet Health',
    description: 'Monitors every vehicle via OBD2 telemetry from Eagle Eye. Predicts maintenance needs, scores vehicle health 0-100, and alerts you before a breakdown costs you a booking.',
    color: '#0F6E56',
    icon: Activity,
  },
  {
    id: 'boost',
    name: 'Boost',
    role: 'Engagement & Loyalty',
    description: 'Runs the Mile Markers loyalty program, referral campaigns, and win-back sequences. North star metric: getting the same renter back in your vehicle.',
    color: '#993C1D',
    icon: Rocket,
  },
  {
    id: 'badge',
    name: 'Badge',
    role: 'Driver Verification & CarFidelity',
    description: 'The trust gateway. Verifies every driver license via OCR and face match before a renter touches your vehicle. Also powers CarFidelity Certified — the vehicle verification badge that commands premium pricing.',
    color: '#993556',
    icon: BadgeCheck,
  },
  {
    id: 'surveyor',
    name: 'Surveyor',
    role: 'Damage Assessment',
    description: 'Analyzes pre-trip and post-trip photos to detect damage, assess severity, and generate timestamped PDF reports. Every assessment is dispute-ready documentation.',
    color: '#5F5E5A',
    icon: Camera,
  },
  {
    id: 'lookout',
    name: 'Lookout',
    role: 'Fraud Detection',
    description: 'Scans every booking, account, and payment for fraud signals. Requires agreement from two independent AI models before any account action — protects legitimate users as hard as it blocks bad actors.',
    color: '#A32D2D',
    icon: Eye,
  },
  {
    id: 'outfitter',
    name: 'Outfitter',
    role: 'Upsell & Add-ons',
    description: 'Recommends the right gear at booking confirmation. Snow chains for a Tahoe trip, cargo liner for Moab, bike rack for Bozeman. Trip-specific, never generic.',
    color: '#BA7517',
    icon: Backpack,
  },
]

export function AgentsSection() {
  return (
    <section className="py-20 md:py-28 bg-[var(--color-bg-parchment)]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] mb-3 block">
            R&D Intelligence
          </span>
          <h2 className="font-serif text-4xl md:text-5xl text-[var(--color-text-primary)] mb-4">
            10 agents. One fleet.
          </h2>
          <p className="text-[var(--color-text-secondary)] font-light text-base max-w-2xl mx-auto">
            Every booking, every vehicle, every renter — monitored, priced, verified, and protected by the Expedition agent suite.
          </p>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {EXPEDITION_AGENTS.map((agent) => {
            const IconComponent = agent.icon
            return (
              <div
                key={agent.id}
                className="group relative bg-card rounded-xl border border-border p-5 transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                style={{
                  borderTopWidth: '3px',
                  borderTopColor: agent.color,
                }}
              >
                {/* Icon */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${agent.color}15` }}
                >
                  <IconComponent 
                    className="w-5 h-5" 
                    style={{ color: agent.color }} 
                  />
                </div>

                {/* Agent Name */}
                <h3 className="font-medium text-base text-card-foreground mb-1">
                  {agent.name}
                </h3>

                {/* Role Label */}
                <span 
                  className="text-[11px] uppercase tracking-[0.08em] font-medium mb-3 block"
                  style={{ color: agent.color }}
                >
                  {agent.role}
                </span>

                {/* Description */}
                <p className="text-[13px] font-light text-muted-foreground leading-relaxed">
                  {agent.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
