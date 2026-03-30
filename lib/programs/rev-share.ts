/**
 * RENT AND DRIVE REVENUE SHARE PROGRAM
 * 
 * INDUSTRY DISRUPTOR: Instead of just taking a cut, we SHARE revenue
 * 
 * Turo takes 15-35% of every booking.
 * Rent and Drive: The more you host, the lower your fee goes.
 * At Legend status, hosts keep up to 92% of their earnings.
 * 
 * This creates loyalty Turo can't match.
 */

export interface RevShareTier {
  name: string
  minTrips: number
  platformFee: number // percentage
  hostKeeps: number // percentage
  perks: string[]
}

export const REV_SHARE_TIERS: RevShareTier[] = [
  {
    name: 'Starter',
    minTrips: 0,
    platformFee: 20,
    hostKeeps: 80,
    perks: [
      'Standard support',
      'Basic analytics',
      'Eagle GPS monitoring',
    ],
  },
  {
    name: 'Pro',
    minTrips: 10,
    platformFee: 17,
    hostKeeps: 83,
    perks: [
      'Priority support',
      'Advanced analytics',
      'Dollar auto-pricing',
      'Shield review monitoring',
    ],
  },
  {
    name: 'Elite',
    minTrips: 50,
    platformFee: 14,
    hostKeeps: 86,
    perks: [
      'VIP support line',
      'Command & Control market intel',
      'Dedicated success manager',
      'Featured listings',
      'Early access to features',
    ],
  },
  {
    name: 'Legend',
    minTrips: 100,
    platformFee: 10,
    hostKeeps: 90,
    perks: [
      'White glove support',
      'All R&D agents unlocked',
      'Oracle predictions',
      'Co-marketing opportunities',
      'Revenue share on referrals',
      'Beta feature access',
      'Annual host summit invite',
    ],
  },
  {
    name: 'Founding Partner',
    minTrips: 250,
    platformFee: 8,
    hostKeeps: 92,
    perks: [
      'Everything in Legend',
      'Equity consideration program',
      'Strategic advisory input',
      'Custom integrations',
      'Unlimited vehicles',
      'White label options',
    ],
  },
]

export function getHostTier(completedTrips: number): RevShareTier {
  // Find highest tier the host qualifies for
  const qualifiedTiers = REV_SHARE_TIERS.filter(t => completedTrips >= t.minTrips)
  return qualifiedTiers[qualifiedTiers.length - 1] || REV_SHARE_TIERS[0]
}

export function calculateHostEarnings(tripTotal: number, completedTrips: number): {
  tier: RevShareTier
  hostEarnings: number
  platformFee: number
  comparisonToTuro: {
    turoFee: number
    savings: number
    savingsPercent: number
  }
} {
  const tier = getHostTier(completedTrips)
  const platformFee = tripTotal * (tier.platformFee / 100)
  const hostEarnings = tripTotal - platformFee
  
  // Turo typically takes 25% average
  const turoFee = tripTotal * 0.25
  const savings = turoFee - platformFee
  
  return {
    tier,
    hostEarnings,
    platformFee,
    comparisonToTuro: {
      turoFee,
      savings,
      savingsPercent: (savings / turoFee) * 100,
    },
  }
}

/**
 * REFERRAL REVENUE SHARE
 * Hosts at Elite+ can earn from referrals
 */
export interface ReferralProgram {
  tier: string
  referrerCut: number // percentage of platform fee from referred host's bookings
  duration: 'lifetime' | '1_year' | '6_months'
}

export const REFERRAL_PROGRAMS: Record<string, ReferralProgram> = {
  Elite: {
    tier: 'Elite',
    referrerCut: 10, // 10% of platform fee
    duration: '1_year',
  },
  Legend: {
    tier: 'Legend',
    referrerCut: 15,
    duration: 'lifetime',
  },
  'Founding Partner': {
    tier: 'Founding Partner',
    referrerCut: 20,
    duration: 'lifetime',
  },
}

/**
 * Calculate monthly projections to show hosts their potential
 */
export function projectMonthlyEarnings(params: {
  numberOfVehicles: number
  averageDailyRate: number
  averageUtilization: number // 0-100%
  completedTrips: number
}): {
  grossRevenue: number
  netToHost: number
  platformFees: number
  tier: RevShareTier
  yearlyProjection: number
  vsCompetitor: {
    competitorFees: number
    ourFees: number
    annualSavings: number
  }
} {
  const daysPerMonth = 30
  const bookedDays = daysPerMonth * (params.averageUtilization / 100) * params.numberOfVehicles
  const grossRevenue = bookedDays * params.averageDailyRate
  
  const tier = getHostTier(params.completedTrips)
  const platformFees = grossRevenue * (tier.platformFee / 100)
  const netToHost = grossRevenue - platformFees
  
  // Turo comparison (25% average)
  const competitorFees = grossRevenue * 0.25
  
  return {
    grossRevenue,
    netToHost,
    platformFees,
    tier,
    yearlyProjection: netToHost * 12,
    vsCompetitor: {
      competitorFees,
      ourFees: platformFees,
      annualSavings: (competitorFees - platformFees) * 12,
    },
  }
}
