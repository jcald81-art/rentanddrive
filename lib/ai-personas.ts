/**
 * AI Persona System - Complete AI Agent Registry
 * CLIENT-SAFE FILE - NO SERVER IMPORTS
 * 
 * Includes:
 * - RAD: Renter-facing chill assistant
 * - R&D: Beta tester technical assistant
 * - Dollar: Dynamic pricing AI for hosts
 * - Eagle: GPS fleet tracking system
 * - Shield: Reputation management AI
 * - SecureLink: Guest communications automation
 * - Inspector Cartegrity: Vehicle inspection AI (carfidelity.ai mobile app)
 */

// Main conversational personas
export type AIPersona = 'R&D' | 'RAD'

// Host AI Agents (non-conversational, service-based)
export type HostAIAgent = 'Dollar' | 'Eagle' | 'Shield' | 'SecureLink' | 'InspectorCartegrity'

export const PERSONAS: Record<AIPersona, {
  name: string
  tagline: string
  emoji: string
  color: string
  bgGradient: string
  tone: string
  greeting: string
  quickReplies: string[]
  features: string[]
  isBeta: boolean
}> = {
  'R&D': {
    name: 'R&D',
    tagline: 'Rent & Drive Intelligence',
    emoji: '🔬',
    color: '#D62828',
    bgGradient: 'from-[#D62828] to-[#A31D1D]',
    tone: 'professional',
    greeting: "Hello! I'm R&D, your advanced AI assistant. I have access to beta features and cutting-edge analytics. How can I help optimize your experience today?",
    quickReplies: [
      'Show beta features',
      'Analyze my fleet',
      'Market insights',
      'Pricing optimization'
    ],
    features: [
      'Beta feature access',
      'Advanced analytics',
      'Predictive pricing',
      'Market intelligence'
    ],
    isBeta: true
  },
  'RAD': {
    name: 'RAD',
    tagline: 'Ride And Drive, Dude!',
    emoji: '🏄',
    color: '#00B4D8',
    bgGradient: 'from-[#00B4D8] to-[#0077B6]',
    tone: 'casual',
    greeting: "Hey dude! RAD here - your chill AI buddy. Just cruisin' and ready to help you make some sweet rides happen. What's up?",
    quickReplies: [
      'Find me a ride',
      'Check my bookings',
      'How do I earn more?',
      'Talk to support'
    ],
    features: [
      'Stable features',
      'Smooth experience',
      'Reliable service',
      'Good vibes only'
    ],
    isBeta: false
  }
}

// Host AI Agents - Service-based agents for fleet management
export const HOST_AI_AGENTS: Record<HostAIAgent, {
  name: string
  fullName: string
  tagline: string
  description: string
  color: string
  icon: string
  capabilities: string[]
  status: 'active' | 'beta' | 'coming-soon'
}> = {
  'Dollar': {
    name: 'Dollar',
    fullName: 'Dollar Agent',
    tagline: 'Dynamic Pricing AI',
    description: 'AI-optimized dynamic pricing that adjusts rates based on demand, competition, events, and market conditions to maximize your earnings.',
    color: '#22C55E',
    icon: 'dollar-sign',
    capabilities: [
      'Real-time rate optimization',
      'Competitor price monitoring',
      'Event-based surge pricing',
      'Seasonal adjustments',
      'Minimum price protection'
    ],
    status: 'active'
  },
  'Eagle': {
    name: 'Eagle',
    fullName: 'Eagle System',
    tagline: 'GPS Fleet Tracking',
    description: 'Real-time GPS tracking for your entire fleet. Monitor vehicle locations, trip routes, and get instant alerts for unauthorized movement.',
    color: '#3B82F6',
    icon: 'map-pin',
    capabilities: [
      'Real-time vehicle tracking',
      'Geofence alerts',
      'Trip history & routes',
      'Mileage monitoring',
      'Theft prevention alerts'
    ],
    status: 'active'
  },
  'Shield': {
    name: 'Shield',
    fullName: 'Shield AI',
    tagline: 'Reputation Management',
    description: 'Protect and enhance your host reputation. Shield monitors reviews, suggests improvements, and helps maintain 5-star status.',
    color: '#8B5CF6',
    icon: 'shield',
    capabilities: [
      'Review sentiment analysis',
      'Response suggestions',
      'Rating optimization tips',
      'Guest satisfaction tracking',
      'Reputation score monitoring'
    ],
    status: 'active'
  },
  'SecureLink': {
    name: 'SecureLink',
    fullName: 'SecureLink',
    tagline: 'Guest Communications',
    description: 'Automated guest communications that handle booking confirmations, check-in instructions, and follow-ups while keeping your personal info private.',
    color: '#F59E0B',
    icon: 'message-square',
    capabilities: [
      'Automated booking messages',
      'Check-in/out instructions',
      'Smart response suggestions',
      'Privacy-protected messaging',
      'Multi-language support'
    ],
    status: 'active'
  },
  'InspectorCartegrity': {
    name: 'Inspector Cartegrity',
    fullName: 'Inspector Cartegrity AI',
    tagline: 'Vehicle Inspection AI',
    description: 'AI-powered vehicle inspection system via carfidelity.ai mobile app. Detects damage, documents condition, and generates detailed reports for dispute resolution.',
    color: '#CC0000',
    icon: 'camera',
    capabilities: [
      'AI damage detection',
      'Photo-based inspections',
      'Pre & post-trip reports',
      'Dispute documentation',
      'Mobile app integration'
    ],
    status: 'active'
  }
}

export function getDefaultPersona(): AIPersona {
  return 'RAD'
}

export function getPersonaConfig(persona: AIPersona) {
  return PERSONAS[persona] || PERSONAS['RAD']
}

export function getHostAgent(agent: HostAIAgent) {
  return HOST_AI_AGENTS[agent] || null
}

export function getAllHostAgents() {
  return Object.values(HOST_AI_AGENTS)
}

export function hasFeatureAccess(persona: AIPersona, feature: string): boolean {
  if (persona === 'R&D') return true
  const betaFeatures = ['smartrate', 'drivecoach', 'market-scan', 'ai-pricing']
  return !betaFeatures.includes(feature)
}
