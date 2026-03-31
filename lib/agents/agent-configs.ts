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
  beacon: {
    id: 'beacon',
    name: 'Beacon',
    role: 'Communications Lead',
    initials: 'BC',
    color: '#C4813A',
    textColor: '#1C1F1A',
    task_type: 'communications',
    description: 'Your main contact on RAD. Handles onboarding, notifications, and general questions.',
  },
  gauge: {
    id: 'gauge',
    name: 'Gauge',
    role: 'Pricing Analyst',
    initials: 'GA',
    color: '#2D4A2D',
    textColor: '#F5F2EC',
    task_type: 'pricing',
    description: 'Monitors market rates and optimizes your fleet pricing for maximum earnings.',
  },
  guard: {
    id: 'guard',
    name: 'Guard',
    role: 'Trust & Safety',
    initials: 'GU',
    color: '#8B4513',
    textColor: '#F5F2EC',
    task_type: 'trust_safety',
    description: 'Screens renters, flags risks, and handles claims resolution.',
  },
  scout: {
    id: 'scout',
    name: 'Scout',
    role: 'Market Intel',
    initials: 'SC',
    color: '#4A7C59',
    textColor: '#F5F2EC',
    task_type: 'market_intel',
    description: 'Tracks competitor pricing and identifies market opportunities.',
  },
  vitals: {
    id: 'vitals',
    name: 'Vitals',
    role: 'Fleet Health',
    initials: 'VT',
    color: '#1C3A5F',
    textColor: '#F5F2EC',
    task_type: 'fleet_health',
    description: 'Monitors vehicle maintenance schedules and fleet condition.',
  },
  boost: {
    id: 'boost',
    name: 'Boost',
    role: 'Visibility & Ads',
    initials: 'BO',
    color: '#9B2335',
    textColor: '#F5F2EC',
    task_type: 'marketing',
    description: 'Optimizes your listing visibility and manages promotional campaigns.',
  },
  badge: {
    id: 'badge',
    name: 'Badge',
    role: 'Host Ratings',
    initials: 'BA',
    color: '#6B4C9A',
    textColor: '#F5F2EC',
    task_type: 'ratings',
    description: 'Tracks your host performance metrics and review responses.',
  },
  surveyor: {
    id: 'surveyor',
    name: 'Surveyor',
    role: 'Expansion Planner',
    initials: 'SU',
    color: '#2E5A88',
    textColor: '#F5F2EC',
    task_type: 'expansion',
    description: 'Identifies fleet expansion opportunities and market trends.',
  },
  lookout: {
    id: 'lookout',
    name: 'Lookout',
    role: 'Trip Monitor',
    initials: 'LO',
    color: '#5A4A3A',
    textColor: '#F5F2EC',
    task_type: 'trip_monitor',
    description: 'Real-time trip tracking and incident detection.',
  },
  outfitter: {
    id: 'outfitter',
    name: 'Outfitter',
    role: 'Vehicle Matcher',
    initials: 'OF',
    color: '#3A6B5A',
    textColor: '#F5F2EC',
    task_type: 'upsell_recommendation',
    description: 'Helps renters find the perfect vehicle and recommends add-ons.',
  },
  rad: {
    id: 'rad',
    name: 'RAD',
    role: 'Your Rent and Drive guide',
    initials: 'R',
    color: '#2D4A2D',
    textColor: '#F5F2EC',
    task_type: 'concierge',
    description: 'Your main guide on RAD. Knows the roads, the vehicles, and the markets.',
  },
}
