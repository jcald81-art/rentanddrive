/**
 * AI Persona System - R&D vs RAD
 * CLIENT-SAFE FILE - NO SERVER IMPORTS
 */

export type AIPersona = 'R&D' | 'RAD'

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

export function getDefaultPersona(): AIPersona {
  return 'RAD'
}

export function getPersonaConfig(persona: AIPersona) {
  return PERSONAS[persona] || PERSONAS['RAD']
}

export function hasFeatureAccess(persona: AIPersona, feature: string): boolean {
  if (persona === 'R&D') return true
  const betaFeatures = ['smartrate', 'drivecoach', 'market-scan', 'ai-pricing']
  return !betaFeatures.includes(feature)
}
