/**
 * Rent and Drive - Intent Classifier
 * Gateway classifier using Llama 4 Scout via Groq for fast, cheap intent routing.
 * Classifies incoming messages to route to the appropriate Expedition agent.
 */

import { generateText } from 'ai'
import { AgentTaskType } from './ai-router'

// ============================================
// CLASSIFIER SYSTEM PROMPT
// ============================================

const CLASSIFIER_PROMPT = `You are an intent router for a peer-to-peer car rental platform. Classify the incoming message into exactly one of these categories and return ONLY the category string, nothing else:

communications — booking messages, guest questions, check-in instructions, disputes, host-renter messaging
pricing — rate questions, dynamic pricing, revenue optimization, price recommendations, rate adjustments
reviews — review responses, reputation management, trust scores, feedback analysis
market_intelligence — competitor analysis, market trends, expansion research, Turo comparisons
fleet_health — vehicle maintenance, OBD2 alerts, repair scheduling, mileage tracking, engine codes
realtime_conditions — weather, road conditions, live traffic, chain controls, event impacts
document_analysis — contracts, insurance docs, uploaded files, registrations, titles
bulk_processing — batch jobs, exports, mass updates, data migrations, fleet-wide changes
driver_verification — license checks, identity verification, CarFidelity certification, age verification
damage_assessment — vehicle photos, damage reports, repair estimates, pre/post trip inspections
fraud_detection — suspicious bookings, account flags, risk scoring, payment anomalies
upsell_recommendation — add-ons, gear recommendations, upgrades, bundles, equipment
engagement — loyalty points, referrals, win-back campaigns, Mile Markers, badges, achievements
concierge — general questions, help requests, vehicle search, booking help, platform navigation

Message to classify:`

// ============================================
// VALID TASK TYPES
// ============================================

const VALID_TASKS: AgentTaskType[] = [
  'communications',
  'pricing',
  'reviews',
  'market_intelligence',
  'fleet_health',
  'realtime_conditions',
  'document_analysis',
  'bulk_processing',
  'driver_verification',
  'damage_assessment',
  'fraud_detection',
  'upsell_recommendation',
  'engagement',
  'concierge',
]

// ============================================
// KEYWORD-BASED FAST CLASSIFICATION
// ============================================

const KEYWORD_PATTERNS: Record<AgentTaskType, RegExp[]> = {
  communications: [
    /\b(message|email|text|send|reply|respond|contact|reach out|communicate)\b/i,
    /\b(check-?in|checkout|pickup|drop-?off|keys|instructions)\b/i,
    /\b(dispute|complaint|issue with)\b/i,
  ],
  pricing: [
    /\b(price|pricing|rate|cost|charge|fee|discount|surge)\b/i,
    /\b(how much|what.*cost|revenue|earnings|optimize)\b/i,
    /\b(weekly|daily|monthly) rate/i,
  ],
  reviews: [
    /\b(review|rating|star|feedback|reputation)\b/i,
    /\b(respond to.*review|bad review|good review)\b/i,
  ],
  market_intelligence: [
    /\b(market|competitor|turo|getaround|competition)\b/i,
    /\b(trend|analysis|research|expansion)\b/i,
  ],
  fleet_health: [
    /\b(maintenance|oil change|tire|brake|engine|obd|check engine)\b/i,
    /\b(mileage|service|repair|mechanic)\b/i,
    /\b(battery|fuel|alert|warning light)\b/i,
  ],
  realtime_conditions: [
    /\b(weather|rain|snow|storm|road condition|traffic)\b/i,
    /\b(chain control|road closure|accident|construction)\b/i,
  ],
  document_analysis: [
    /\b(document|upload|insurance|registration|title|contract)\b/i,
    /\b(pdf|scan|file|analyze.*document)\b/i,
  ],
  bulk_processing: [
    /\b(bulk|batch|mass|export|import|migrate)\b/i,
    /\b(all vehicles|entire fleet|every|fleet-?wide)\b/i,
  ],
  driver_verification: [
    /\b(license|verify|verification|identity|id check)\b/i,
    /\b(carfidelity|certified|approve.*driver)\b/i,
  ],
  damage_assessment: [
    /\b(damage|scratch|dent|broken|inspect|assessment)\b/i,
    /\b(pre-?trip|post-?trip|photo|repair estimate)\b/i,
  ],
  fraud_detection: [
    /\b(fraud|suspicious|scam|fake|risk|block)\b/i,
    /\b(charback|stolen|unauthorized)\b/i,
  ],
  upsell_recommendation: [
    /\b(add-?on|upgrade|gear|equipment|accessory)\b/i,
    /\b(ski rack|bike rack|chains|cargo|bundle)\b/i,
  ],
  engagement: [
    /\b(points|loyalty|rewards|referral|badge|achievement)\b/i,
    /\b(mile markers|tier|level up|streak)\b/i,
  ],
  concierge: [
    /\b(help|how do i|what is|find|search|book|rent)\b/i,
    /\b(available|vehicle|car|truck|suv)\b/i,
  ],
}

// ============================================
// FAST KEYWORD CLASSIFICATION
// ============================================

function classifyByKeywords(message: string): AgentTaskType | null {
  const lowered = message.toLowerCase()
  
  // Check each task type's patterns
  const matches: { task: AgentTaskType; score: number }[] = []
  
  for (const [task, patterns] of Object.entries(KEYWORD_PATTERNS)) {
    let score = 0
    for (const pattern of patterns) {
      if (pattern.test(lowered)) {
        score++
      }
    }
    if (score > 0) {
      matches.push({ task: task as AgentTaskType, score })
    }
  }
  
  if (matches.length === 0) return null
  
  // Sort by score and return highest
  matches.sort((a, b) => b.score - a.score)
  
  // Only return if clear winner (score > 1 or only one match)
  if (matches[0].score > 1 || matches.length === 1) {
    return matches[0].task
  }
  
  return null
}

// ============================================
// LLM CLASSIFICATION
// ============================================

async function classifyWithLLM(message: string): Promise<AgentTaskType> {
  try {
    const result = await generateText({
      model: 'groq/llama-4-scout' as any,
      system: CLASSIFIER_PROMPT,
      prompt: message,
      maxTokens: 50,
      temperature: 0,
    })
    
    const classified = result.text.trim().toLowerCase().replace(/[^a-z_]/g, '')
    
    if (VALID_TASKS.includes(classified as AgentTaskType)) {
      return classified as AgentTaskType
    }
    
    // Fallback to concierge if classification is invalid
    return 'concierge'
  } catch (error) {
    console.error('[v0] LLM classification failed:', error)
    return 'concierge'
  }
}

// ============================================
// MAIN CLASSIFIER FUNCTION
// ============================================

export interface ClassificationResult {
  task: AgentTaskType
  method: 'keyword' | 'llm'
  confidence: 'high' | 'medium' | 'low'
}

export async function classifyIntent(message: string): Promise<ClassificationResult> {
  // First, try fast keyword classification
  const keywordResult = classifyByKeywords(message)
  
  if (keywordResult) {
    return {
      task: keywordResult,
      method: 'keyword',
      confidence: 'high',
    }
  }
  
  // Fall back to LLM classification
  const llmResult = await classifyWithLLM(message)
  
  return {
    task: llmResult,
    method: 'llm',
    confidence: 'medium',
  }
}

// ============================================
// EXPORTS
// ============================================

export { VALID_TASKS }
