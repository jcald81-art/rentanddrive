export interface AgentConfig {
  id: string
  name: string
  role: string
  initials: string
  color: string
  textColor: string
  task_type: string
  description: string
  status: 'active' | 'staged'
  staged_reason?: string
}

export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  'rad-comms': {
    id: 'rad-comms',
    name: 'RAD Comms',
    role: 'Communications Lead',
    initials: 'RC',
    color: '#C4813A',
    textColor: '#1C1F1A',
    task_type: 'communications',
    description: 'Your main contact on RAD. Handles onboarding, notifications, and general questions.',
    status: 'staged',
    staged_reason: 'Communications agent — staged for Phase 2 multi-host platform launch. Handles automated booking messages, pre-trip instructions, and igloohome PIN delivery via Twilio/SendGrid.',
  },
  'rad-pricing': {
    id: 'rad-pricing',
    name: 'RAD Pricing',
    role: 'Pricing Analyst',
    initials: 'RP',
    color: '#2D4A2D',
    textColor: '#F5F2EC',
    task_type: 'pricing',
    description: 'Monitors market rates and optimizes your fleet pricing for maximum earnings.',
    status: 'staged',
    staged_reason: 'Dynamic pricing agent — staged for Phase 2. Activates when platform has 10+ active host listings. Claude primary, GPT-4o cross-validation. Auto-applies pricing within 5% model agreement.',
  },
  'rad-reputation': {
    id: 'rad-reputation',
    name: 'RAD Reputation',
    role: 'Trust & Safety',
    initials: 'RR',
    color: '#8B4513',
    textColor: '#F5F2EC',
    task_type: 'trust_safety',
    description: 'Screens renters, flags risks, and handles claims resolution.',
    status: 'staged',
    staged_reason: 'Reputation agent — staged for Phase 2. Monitors reviews, drafts host responses, flags rating anomalies. Activates after 50+ platform reviews collected.',
  },
  'rad-intel': {
    id: 'rad-intel',
    name: 'RAD Intel',
    role: 'Market Intel',
    initials: 'RI',
    color: '#4A7C59',
    textColor: '#F5F2EC',
    task_type: 'market_intel',
    description: 'Tracks competitor pricing and identifies market opportunities.',
    status: 'staged',
    staged_reason: 'Market intelligence agent — staged for Phase 3. Perplexity Sonar Pro primary. Competitive monitoring, Turo rate tracking, event-based demand signals.',
  },
  'rad-fleet': {
    id: 'rad-fleet',
    name: 'RAD Fleet',
    role: 'Fleet Health',
    initials: 'RF',
    color: '#1C3A5F',
    textColor: '#F5F2EC',
    task_type: 'fleet_health',
    description: 'Monitors vehicle maintenance schedules and fleet condition.',
    status: 'staged',
    staged_reason: 'Fleet health agent — staged for Phase 2. Bouncie OBD2 telemetry analysis, maintenance scheduling, vehicle health scoring. Activates when 3+ host vehicles on platform.',
  },
  'rad-rewards': {
    id: 'rad-rewards',
    name: 'RAD Rewards',
    role: 'Engagement & Loyalty',
    initials: 'RW',
    color: '#9B2335',
    textColor: '#F5F2EC',
    task_type: 'marketing',
    description: 'Optimizes your listing visibility and manages promotional campaigns.',
    status: 'staged',
    staged_reason: 'Engagement and loyalty agent — staged for Phase 3. Mile Markers program, referral engine, win-back sequences. Activates at 100+ registered renters.',
  },
  'rad-verify': {
    id: 'rad-verify',
    name: 'RAD Verify',
    role: 'Driver Verification',
    initials: 'RV',
    color: '#6B4C9A',
    textColor: '#F5F2EC',
    task_type: 'ratings',
    description: 'Tracks your host performance metrics and review responses.',
    status: 'staged',
    staged_reason: 'Verification agent — staged for Phase 2. GPT-4o Vision primary for license verification. Activates with direct booking platform launch at Month 6.',
  },
  'rad-carfidelity': {
    id: 'rad-carfidelity',
    name: 'RAD CarFidelity',
    role: 'Vehicle Inspection',
    initials: 'CF',
    color: '#2E5A88',
    textColor: '#F5F2EC',
    task_type: 'expansion',
    description: 'AI-powered vehicle inspection system for damage assessment and documentation.',
    status: 'staged',
    staged_reason: 'Damage assessment agent — staged for CarFidelity.ai spinoff launch Q1 2027. Triple-sensor inspection: visual + audio + OBD2 fusion scoring.',
  },
  'rad-secure': {
    id: 'rad-secure',
    name: 'RAD Secure',
    role: 'Fraud Detection',
    initials: 'RS',
    color: '#5A4A3A',
    textColor: '#F5F2EC',
    task_type: 'trip_monitor',
    description: 'Real-time trip tracking and incident detection.',
    status: 'staged',
    staged_reason: 'Fraud detection agent — staged for Phase 2. Dual-model agreement required before flagging. Activates at 50+ bookings.',
  },
  'rad-upsell': {
    id: 'rad-upsell',
    name: 'RAD Upsell',
    role: 'Add-ons & Gear',
    initials: 'RU',
    color: '#3A6B5A',
    textColor: '#F5F2EC',
    task_type: 'upsell_recommendation',
    description: 'Helps renters find the perfect vehicle and recommends add-ons.',
    status: 'staged',
    staged_reason: 'Upsell agent — staged for Phase 3. Ski rack, snow chains, gear add-ons. Activates with Tahoe seasonal pricing system.',
  },
  rad: {
    id: 'rad',
    name: 'RAD',
    role: 'Rent and Drive Concierge',
    initials: 'R',
    color: '#2D4A2D',
    textColor: '#F5F2EC',
    task_type: 'concierge',
    description: 'Primary intelligence interface. Orchestrates specialist agents for comprehensive answers.',
    status: 'active',
  },
}

// Legacy aliases for backward compatibility
export const LEGACY_AGENT_MAPPING: Record<string, string> = {
  'beacon': 'rad-comms',
  'securelink': 'rad-comms',
  'gauge': 'rad-pricing',
  'dollar': 'rad-pricing',
  'guard': 'rad-reputation',
  'shield': 'rad-reputation',
  'scout': 'rad-intel',
  'vitals': 'rad-fleet',
  'pulse': 'rad-fleet',
  'boost': 'rad-rewards',
  'funtime': 'rad-rewards',
  'badge': 'rad-verify',
  'diesel': 'rad-verify',
  'surveyor': 'rad-carfidelity',
  'cartegrity': 'rad-carfidelity',
  'lookout': 'rad-secure',
  'outfitter': 'rad-upsell',
}

export function getAgentConfig(agentId: string): AgentConfig | undefined {
  // Check for legacy name first
  const mappedId = LEGACY_AGENT_MAPPING[agentId.toLowerCase()] || agentId
  return AGENT_CONFIGS[mappedId]
}
