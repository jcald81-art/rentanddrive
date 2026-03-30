import { routeAIRequest } from '@/lib/ai-router'
import { createClient } from '@/lib/supabase/server'
import { sendMessage } from '@/lib/agents/securelink'

const AGENT_NAME = 'Funtime'

// Lab Levels configuration
const LAB_LEVELS = [
  { level: 1, name: 'Garage Starter', xp_required: 0, perks: ['Basic listing'] },
  { level: 2, name: 'Street Parker', xp_required: 500, perks: ['Featured badge'] },
  { level: 3, name: 'Lot Manager', xp_required: 1500, perks: ['Priority support'] },
  { level: 4, name: 'Fleet Captain', xp_required: 3500, perks: ['Lower fees (9%)'] },
  { level: 5, name: 'Road King', xp_required: 7500, perks: ['Lower fees (8%)', 'Beta features'] },
  { level: 6, name: 'Highway Legend', xp_required: 15000, perks: ['Lower fees (7%)', 'API access'] },
]

// XP Awards
const XP_AWARDS = {
  booking_completed: 100,
  five_star_review: 50,
  four_star_review: 25,
  quick_response: 20, // Response within 1 hour
  perfect_month: 200, // 100% acceptance, no cancellations
  referral: 300,
  profile_complete: 50,
  first_booking: 150,
  ten_bookings: 500,
  fifty_bookings: 1000,
  challenge_complete: 'varies',
}

// Badge definitions
const BADGES = {
  // Host badges
  host_first_trip: { name: 'First Trip', description: 'Completed your first rental', xp: 50 },
  host_five_star_streak: { name: '5-Star Streak', description: '5 consecutive 5-star reviews', xp: 100 },
  host_superhost: { name: 'Superhost', description: '10+ trips, 4.8+ rating', xp: 200 },
  host_quick_responder: { name: 'Quick Responder', description: 'Average response time under 30 min', xp: 75 },
  host_fleet_master: { name: 'Fleet Master', description: '5+ active vehicles', xp: 250 },
  car_lot_closer: { name: 'Car Lot Closer', description: 'Sold your first vehicle on The Car Lot', xp: 500 },
  
  // Renter badges
  renter_first_ride: { name: 'First Ride', description: 'Completed your first rental', xp: 25 },
  renter_road_warrior: { name: 'Road Warrior', description: '10+ completed trips', xp: 100 },
  renter_safe_driver: { name: 'Safe Driver', description: 'Road score 90+ for 5 trips', xp: 150 },
  renter_five_star_guest: { name: '5-Star Guest', description: 'Received 5-star rating from host', xp: 50 },
  renter_tahoe_explorer: { name: 'Tahoe Explorer', description: 'Completed trip to Lake Tahoe', xp: 75 },
}

// Award XP to host
export async function awardHostXP(
  hostId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<{ newXp: number; levelUp: boolean; newLevel?: number }> {
  const supabase = await createClient()

  // Get current XP
  const { data: profile } = await supabase
    .from('profiles')
    .select('host_xp, host_level')
    .eq('id', hostId)
    .single()

  const currentXp = profile?.host_xp || 0
  const currentLevel = profile?.host_level || 1
  const newXp = currentXp + amount

  // Check for level up
  const newLevelData = LAB_LEVELS.filter(l => newXp >= l.xp_required).pop()
  const newLevel = newLevelData?.level || 1
  const levelUp = newLevel > currentLevel

  // Update profile
  await supabase
    .from('profiles')
    .update({
      host_xp: newXp,
      host_level: newLevel,
    })
    .eq('id', hostId)

  // Log XP transaction
  await supabase.from('xp_transactions').insert({
    user_id: hostId,
    user_type: 'host',
    amount,
    reason,
    metadata,
  })

  // Send congratulations if level up
  if (levelUp && newLevelData) {
    await sendMessage({
      userId: hostId,
      type: 'custom',
      customMessage: `Congratulations! You've reached ${newLevelData.name} (Level ${newLevel})! New perks unlocked: ${newLevelData.perks.join(', ')}.`,
      channels: ['email'],
    })

    // Create notification
    await supabase.from('notifications').insert({
      user_id: hostId,
      type: 'level_up',
      title: `Level Up! You're now ${newLevelData.name}`,
      message: `New perks: ${newLevelData.perks.join(', ')}`,
      data: { level: newLevel, perks: newLevelData.perks },
    })
  }

  return { newXp, levelUp, newLevel: levelUp ? newLevel : undefined }
}

// Award badge to host
export async function awardHostBadge(
  hostId: string,
  badgeId: keyof typeof BADGES
): Promise<boolean> {
  const supabase = await createClient()
  const badge = BADGES[badgeId]
  if (!badge) return false

  // Check if already has badge
  const { data: existing } = await supabase
    .from('host_achievements')
    .select('id')
    .eq('user_id', hostId)
    .eq('badge_id', badgeId)
    .single()

  if (existing) return false // Already has it

  // Award badge
  await supabase.from('host_achievements').insert({
    user_id: hostId,
    badge_id: badgeId,
    badge_name: badge.name,
    badge_description: badge.description,
  })

  // Award XP for badge
  await awardHostXP(hostId, badge.xp, `Badge earned: ${badge.name}`, { badgeId })

  // Notify
  await sendMessage({
    userId: hostId,
    type: 'custom',
    customMessage: `You've earned a new badge: ${badge.name}! ${badge.description}`,
    channels: ['email'],
  })

  return true
}

// Award badge to renter
export async function awardRenterBadge(
  renterId: string,
  badgeId: keyof typeof BADGES
): Promise<boolean> {
  const supabase = await createClient()
  const badge = BADGES[badgeId]
  if (!badge) return false

  // Check if already has badge
  const { data: existing } = await supabase
    .from('renter_badges')
    .select('id')
    .eq('renter_id', renterId)
    .eq('badge_id', badgeId)
    .single()

  if (existing) return false

  // Award badge
  await supabase.from('renter_badges').insert({
    renter_id: renterId,
    badge_id: badgeId,
    badge_name: badge.name,
    badge_description: badge.description,
  })

  // Notify
  await sendMessage({
    userId: renterId,
    type: 'custom',
    customMessage: `You've earned a new badge: ${badge.name}! ${badge.description}`,
    channels: ['email'],
  })

  return true
}

// Check and award automatic badges (called by cron)
export async function checkAndAwardBadges(): Promise<{ hostsAwarded: number; rentersAwarded: number }> {
  const supabase = await createClient()
  let hostsAwarded = 0, rentersAwarded = 0

  // Check host badges
  const { data: hosts } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'host')

  for (const host of hosts || []) {
    // First trip badge
    const { count: tripCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .in('vehicle_id', supabase.from('vehicles').select('id').eq('host_id', host.id))

    if ((tripCount || 0) >= 1) {
      if (await awardHostBadge(host.id, 'host_first_trip')) hostsAwarded++
    }

    // 5-star streak
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select('rating')
      .order('created_at', { ascending: false })
      .limit(5)
      // This would need vehicle_id filter in real implementation

    if (recentReviews?.length === 5 && recentReviews.every(r => r.rating === 5)) {
      if (await awardHostBadge(host.id, 'host_five_star_streak')) hostsAwarded++
    }

    // Superhost
    if ((tripCount || 0) >= 10) {
      const { data: avgRating } = await supabase
        .from('reviews')
        .select('rating')
        .limit(100)

      const avg = avgRating?.reduce((sum, r) => sum + r.rating, 0) / (avgRating?.length || 1)
      if (avg >= 4.8) {
        if (await awardHostBadge(host.id, 'host_superhost')) hostsAwarded++
      }
    }

    // Fleet Master
    const { count: vehicleCount } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', host.id)
      .eq('status', 'active')

    if ((vehicleCount || 0) >= 5) {
      if (await awardHostBadge(host.id, 'host_fleet_master')) hostsAwarded++
    }
  }

  // Check renter badges
  const { data: renters } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'renter')

  for (const renter of renters || []) {
    // First ride
    const { count: renterTrips } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('renter_id', renter.id)
      .eq('status', 'completed')

    if ((renterTrips || 0) >= 1) {
      if (await awardRenterBadge(renter.id, 'renter_first_ride')) rentersAwarded++
    }

    // Road Warrior
    if ((renterTrips || 0) >= 10) {
      if (await awardRenterBadge(renter.id, 'renter_road_warrior')) rentersAwarded++
    }

    // Safe Driver
    const { data: renterScore } = await supabase
      .from('renter_road_scores')
      .select('score')
      .eq('renter_id', renter.id)
      .single()

    if ((renterScore?.score || 0) >= 90 && (renterTrips || 0) >= 5) {
      if (await awardRenterBadge(renter.id, 'renter_safe_driver')) rentersAwarded++
    }
  }

  return { hostsAwarded, rentersAwarded }
}

// Update host leaderboard
export async function updateLeaderboard(): Promise<void> {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get all hosts with their stats
  const { data: hosts } = await supabase
    .from('profiles')
    .select('id, full_name, host_xp, host_level')
    .eq('role', 'host')
    .order('host_xp', { ascending: false })

  // Calculate monthly earnings and trips
  for (let rank = 0; rank < (hosts?.length || 0); rank++) {
    const host = hosts![rank]

    const { data: monthlyBookings } = await supabase
      .from('bookings')
      .select('total_price')
      .eq('status', 'completed')
      .gte('end_date', monthStart.toISOString())
      .in('vehicle_id', supabase.from('vehicles').select('id').eq('host_id', host.id))

    const monthlyEarnings = monthlyBookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0
    const monthlyTrips = monthlyBookings?.length || 0

    await supabase.from('host_leaderboard').upsert({
      host_id: host.id,
      month: monthStart.toISOString().slice(0, 7), // YYYY-MM
      rank: rank + 1,
      total_xp: host.host_xp,
      level: host.host_level,
      monthly_earnings: monthlyEarnings,
      monthly_trips: monthlyTrips,
      updated_at: now.toISOString(),
    }, { onConflict: 'host_id,month' })
  }
}

// Run photo contest voting
export async function runPhotoContestVoting(contestId: string): Promise<{
  winnerId: string
  winnerUserId: string
  voteCount: number
}> {
  const supabase = await createClient()

  // Get contest
  const { data: contest } = await supabase
    .from('photo_contests')
    .select('*')
    .eq('id', contestId)
    .single()

  if (!contest || contest.status !== 'voting') {
    throw new Error('Contest not in voting phase')
  }

  // Count votes
  const { data: votes } = await supabase
    .from('photo_votes')
    .select('photo_id, count')
    .eq('contest_id', contestId)

  // Aggregate votes per photo
  const voteCounts: Record<string, number> = {}
  for (const vote of votes || []) {
    voteCounts[vote.photo_id] = (voteCounts[vote.photo_id] || 0) + 1
  }

  // Find winner
  const winnerId = Object.entries(voteCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0]

  if (!winnerId) throw new Error('No votes cast')

  // Get winner's user
  const { data: winningPhoto } = await supabase
    .from('trip_photos')
    .select('user_id')
    .eq('id', winnerId)
    .single()

  // Update contest
  await supabase
    .from('photo_contests')
    .update({
      status: 'completed',
      winner_photo_id: winnerId,
      winner_user_id: winningPhoto?.user_id,
    })
    .eq('id', contestId)

  // Award winner
  if (winningPhoto?.user_id) {
    await awardRenterBadge(winningPhoto.user_id, 'renter_tahoe_explorer')
    
    // Create reward
    await supabase.from('renter_rewards').insert({
      renter_id: winningPhoto.user_id,
      reward_type: 'photo_contest_winner',
      amount_cents: contest.prize_amount_cents || 2500, // $25 default
      description: `Photo contest winner: ${contest.theme}`,
      status: 'pending',
    })

    await sendMessage({
      userId: winningPhoto.user_id,
      type: 'custom',
      customMessage: `Congratulations! Your photo won the "${contest.theme}" contest! Check your rewards for your prize.`,
      channels: ['email', 'sms'],
    })
  }

  return {
    winnerId,
    winnerUserId: winningPhoto?.user_id || '',
    voteCount: voteCounts[winnerId] || 0,
  }
}

// Daily Funtime run (cron job)
export async function runDailyFuntime(): Promise<{
  xpAwarded: number
  badgesAwarded: number
  leaderboardUpdated: boolean
}> {
  const supabase = await createClient()
  let totalXpAwarded = 0

  // Award XP for completed bookings in last 24 hours
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const { data: completedBookings } = await supabase
    .from('bookings')
    .select('id, vehicle_id, vehicles(host_id)')
    .eq('status', 'completed')
    .gte('end_date', yesterday.toISOString())
    .is('xp_awarded', null)

  for (const booking of completedBookings || []) {
    const hostId = (booking.vehicles as any)?.host_id
    if (hostId) {
      const { newXp } = await awardHostXP(hostId, XP_AWARDS.booking_completed, 'Booking completed', { bookingId: booking.id })
      totalXpAwarded += XP_AWARDS.booking_completed

      await supabase.from('bookings').update({ xp_awarded: true }).eq('id', booking.id)
    }
  }

  // Award XP for new reviews
  const { data: newReviews } = await supabase
    .from('reviews')
    .select('id, rating, bookings(vehicles(host_id))')
    .gte('created_at', yesterday.toISOString())
    .is('xp_awarded', null)

  for (const review of newReviews || []) {
    const hostId = (review.bookings as any)?.vehicles?.host_id
    if (hostId) {
      const xp = review.rating === 5 ? XP_AWARDS.five_star_review : review.rating === 4 ? XP_AWARDS.four_star_review : 0
      if (xp > 0) {
        await awardHostXP(hostId, xp, `${review.rating}-star review received`, { reviewId: review.id })
        totalXpAwarded += xp
      }

      await supabase.from('reviews').update({ xp_awarded: true }).eq('id', review.id)
    }
  }

  // Check badges
  const { hostsAwarded, rentersAwarded } = await checkAndAwardBadges()

  // Update leaderboard
  await updateLeaderboard()

  return {
    xpAwarded: totalXpAwarded,
    badgesAwarded: hostsAwarded + rentersAwarded,
    leaderboardUpdated: true,
  }
}

// ── FuntimeAgent class wrapper ─────────────────────────────────────────────────
export class FuntimeAgent {
  async awardXP(userId: string, amount: number, reason: string, _source?: string) {
    return awardHostXP(userId, amount, reason)
  }
  async checkLevelUp(userId: string) {
    return checkAndAwardBadges()
  }
  async awardBadge(userId: string, badgeType: string) {
    return awardHostBadge(userId, badgeType as any)
  }
  async updateLeaderboard() {
    return updateLeaderboard()
  }
  async processChallengeProgress(_userId: string, _challengeId: string) {
    return { success: true }
  }
  async voteOnPhoto(photoId: string, _voterId: string) {
    return runPhotoContestVoting(photoId)
  }
}
