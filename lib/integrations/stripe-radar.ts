/**
 * Stripe Radar Fraud Detection Integration
 * Handles fraud signals, risk assessment, and decision logging
 */

import { createClient } from '@/lib/supabase/server'
import { recordBlockchainEvent } from '@/lib/blockchain'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

export interface RadarOutcome {
  riskLevel: 'normal' | 'elevated' | 'highest'
  riskScore: number
  outcomeType: 'authorized' | 'manual_review' | 'issuer_declined' | 'blocked' | 'invalid'
  ruleIds: string[]
  fraudSignals: Record<string, unknown>
  blocked: boolean
}

export async function recordRadarEvent(
  paymentIntentId: string,
  bookingId: string | null,
  userId: string | null,
  charge: Stripe.Charge
): Promise<{ success: boolean; outcome?: RadarOutcome }> {
  const supabase = await createClient()

  try {
    const outcome = charge.outcome
    const fraudDetails = charge.fraud_details

    if (!outcome) {
      return { success: true }
    }

    const radarOutcome: RadarOutcome = {
      riskLevel: outcome.risk_level as RadarOutcome['riskLevel'] || 'normal',
      riskScore: outcome.risk_score || 0,
      outcomeType: outcome.type as RadarOutcome['outcomeType'] || 'authorized',
      ruleIds: outcome.rule ? [String(outcome.rule)] : [],
      fraudSignals: {
        stripeReport: fraudDetails?.stripe_report,
        userReport: fraudDetails?.user_report,
        sellerMessage: outcome.seller_message,
        reason: outcome.reason,
      },
      blocked: outcome.type === 'blocked',
    }

    // Store radar event
    await supabase.from('stripe_radar_events').insert({
      booking_id: bookingId,
      payment_intent_id: paymentIntentId,
      charge_id: charge.id,
      user_id: userId,
      risk_level: radarOutcome.riskLevel,
      risk_score: radarOutcome.riskScore,
      outcome_type: radarOutcome.outcomeType,
      radar_rule_ids: radarOutcome.ruleIds,
      fraud_signals: radarOutcome.fraudSignals,
      ip_address: charge.billing_details?.address?.postal_code ? 'redacted' : null,
      blocked: radarOutcome.blocked,
    })

    // Update user fraud risk level if elevated
    if (userId && (radarOutcome.riskLevel === 'elevated' || radarOutcome.riskLevel === 'highest')) {
      await supabase
        .from('profiles')
        .update({ fraud_risk_level: radarOutcome.riskLevel })
        .eq('id', userId)
    }

    // Record to blockchain if blocked or highest risk
    if (radarOutcome.blocked || radarOutcome.riskLevel === 'highest') {
      await recordBlockchainEvent({
        eventType: 'payment_fiat',
        bookingId: bookingId || undefined,
        eventData: {
          type: 'fraud_block',
          paymentIntentId,
          riskLevel: radarOutcome.riskLevel,
          riskScore: radarOutcome.riskScore,
          timestamp: new Date().toISOString(),
        },
      })
    }

    return { success: true, outcome: radarOutcome }
  } catch (error) {
    console.error('[v0] Radar event recording failed:', error)
    return { success: false }
  }
}

export async function checkUserFraudRisk(userId: string): Promise<{
  riskLevel: string
  recentBlocks: number
  canBook: boolean
  reason?: string
}> {
  const supabase = await createClient()

  // Get user's fraud risk level
  const { data: profile } = await supabase
    .from('profiles')
    .select('fraud_risk_level')
    .eq('id', userId)
    .single()

  // Count recent blocked transactions
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { count: recentBlocks } = await supabase
    .from('stripe_radar_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('blocked', true)
    .gte('created_at', thirtyDaysAgo)

  const riskLevel = profile?.fraud_risk_level || 'normal'
  const blockCount = recentBlocks || 0

  // Determine if user can book
  let canBook = true
  let reason: string | undefined

  if (blockCount >= 3) {
    canBook = false
    reason = 'Account flagged for review due to multiple blocked transactions'
  } else if (riskLevel === 'highest') {
    canBook = false
    reason = 'Account requires manual verification'
  }

  return { riskLevel, recentBlocks: blockCount, canBook, reason }
}

export async function getPaymentRiskInfo(paymentIntentId: string): Promise<RadarOutcome | null> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge'],
    })

    const charge = paymentIntent.latest_charge as Stripe.Charge | null

    if (!charge?.outcome) return null

    return {
      riskLevel: charge.outcome.risk_level as RadarOutcome['riskLevel'] || 'normal',
      riskScore: charge.outcome.risk_score || 0,
      outcomeType: charge.outcome.type as RadarOutcome['outcomeType'] || 'authorized',
      ruleIds: charge.outcome.rule ? [String(charge.outcome.rule)] : [],
      fraudSignals: {
        sellerMessage: charge.outcome.seller_message,
        reason: charge.outcome.reason,
      },
      blocked: charge.outcome.type === 'blocked',
    }
  } catch (error) {
    console.error('[v0] Failed to get payment risk info:', error)
    return null
  }
}

export async function addRadarRule(
  ruleType: 'block' | 'review' | 'allow',
  condition: string,
  description: string
): Promise<{ success: boolean; ruleId?: string; error?: string }> {
  // Note: Radar rules are typically managed via Stripe Dashboard
  // This is a placeholder for future API integration
  console.log(`[v0] Radar rule would be added: ${ruleType} when ${condition} - ${description}`)
  
  return { 
    success: false, 
    error: 'Radar rules must be configured in Stripe Dashboard' 
  }
}
