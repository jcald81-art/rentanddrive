export interface AgentConfig {
  id: string
  name: string
  role: string
  initials: string
  color: string
  textColor: string
  task_type: string
  description: string
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
