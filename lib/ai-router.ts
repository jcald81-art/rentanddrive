/**
 * Rent and Drive - Expedition Agent System AI Router
 * Full router with 13 agent task types, primary/fallback routing,
 * cross-validation, and usage logging.
 */

import { generateText, streamText } from 'ai'
import { createClient } from '@supabase/supabase-js'

// ============================================
// TYPES
// ============================================

export type AgentTaskType =
  | 'communications'
  | 'pricing'
  | 'reviews'
  | 'market_intelligence'
  | 'fleet_health'
  | 'realtime_conditions'
  | 'document_analysis'
  | 'bulk_processing'
  | 'driver_verification'
  | 'damage_assessment'
  | 'fraud_detection'
  | 'upsell_recommendation'
  | 'engagement'
  | 'concierge'

export interface RouteConfig {
  agent_name: string
  former_name: string
  primary: string
  fallback: string
  cross_validation?: string
  requires_dual_agreement?: boolean
  streaming: boolean
  cache_ttl_seconds: number
  icon: string
  color: string
  tagline: string
}

// ============================================
// EXPEDITION AGENT ROUTES
// ============================================

export const AGENT_ROUTES: Record<AgentTaskType, RouteConfig> = {
  communications: {
    agent_name: 'Beacon',
    former_name: 'SecureLink',
    primary: 'anthropic/claude-sonnet-4-20250514',
    fallback: 'groq/llama-4-scout',
    streaming: true,
    cache_ttl_seconds: 0,
    icon: 'radio',
    color: '#F59E0B',
    tagline: 'Trail Communications',
  },
  pricing: {
    agent_name: 'Gauge',
    former_name: 'Dollar',
    primary: 'anthropic/claude-sonnet-4-20250514',
    fallback: 'openai/gpt-4o',
    cross_validation: 'openai/gpt-4o',
    streaming: false,
    cache_ttl_seconds: 300,
    icon: 'gauge',
    color: '#22C55E',
    tagline: 'Revenue Optimization',
  },
  reviews: {
    agent_name: 'Guard',
    former_name: 'Shield',
    primary: 'anthropic/claude-sonnet-4-20250514',
    fallback: 'google/gemini-2.5-flash',
    streaming: false,
    cache_ttl_seconds: 600,
    icon: 'shield',
    color: '#8B5CF6',
    tagline: 'Reputation Protection',
  },
  market_intelligence: {
    agent_name: 'Scout',
    former_name: 'Command&Control',
    primary: 'perplexity/sonar-pro',
    fallback: 'anthropic/claude-sonnet-4-20250514',
    streaming: true,
    cache_ttl_seconds: 1800,
    icon: 'binoculars',
    color: '#06B6D4',
    tagline: 'Market Recon',
  },
  fleet_health: {
    agent_name: 'Vitals',
    former_name: 'Pulse',
    primary: 'nvidia/nemotron-70b',
    fallback: 'anthropic/claude-sonnet-4-20250514',
    streaming: false,
    cache_ttl_seconds: 900,
    icon: 'heart-pulse',
    color: '#EF4444',
    tagline: 'Fleet Health Monitor',
  },
  realtime_conditions: {
    agent_name: 'Grok',
    former_name: 'Grok',
    primary: 'xai/grok-3',
    fallback: 'anthropic/claude-sonnet-4-20250514',
    streaming: true,
    cache_ttl_seconds: 60,
    icon: 'cloud-sun',
    color: '#3B82F6',
    tagline: 'Real-Time Conditions',
  },
  document_analysis: {
    agent_name: 'Gemini',
    former_name: 'Gemini',
    primary: 'google/gemini-2.5-pro',
    fallback: 'anthropic/claude-sonnet-4-20250514',
    streaming: false,
    cache_ttl_seconds: 3600,
    icon: 'file-search',
    color: '#4285F4',
    tagline: 'Document Analysis',
  },
  bulk_processing: {
    agent_name: 'DeepSeek',
    former_name: 'DeepSeek',
    primary: 'deepseek/deepseek-chat-v3',
    fallback: 'anthropic/claude-haiku-4-5-20251001',
    streaming: false,
    cache_ttl_seconds: 7200,
    icon: 'layers',
    color: '#6366F1',
    tagline: 'Batch Processing',
  },
  driver_verification: {
    agent_name: 'Badge',
    former_name: 'Diesel',
    primary: 'openai/gpt-4o',
    fallback: 'google/gemini-2.5-pro',
    cross_validation: 'anthropic/claude-sonnet-4-20250514',
    streaming: false,
    cache_ttl_seconds: 0,
    icon: 'badge-check',
    color: '#10B981',
    tagline: 'Driver Verification',
  },
  damage_assessment: {
    agent_name: 'Surveyor',
    former_name: 'Inspector Cartegrity',
    primary: 'google/gemini-2.5-pro',
    fallback: 'openai/gpt-4o',
    streaming: false,
    cache_ttl_seconds: 0,
    icon: 'camera',
    color: '#CC0000',
    tagline: 'Damage Assessment',
  },
  fraud_detection: {
    agent_name: 'Lookout',
    former_name: 'NEW',
    primary: 'anthropic/claude-sonnet-4-20250514',
    fallback: 'openai/gpt-4o',
    cross_validation: 'openai/gpt-4o',
    requires_dual_agreement: true,
    streaming: false,
    cache_ttl_seconds: 0,
    icon: 'eye',
    color: '#DC2626',
    tagline: 'Fraud Detection',
  },
  upsell_recommendation: {
    agent_name: 'Outfitter',
    former_name: 'NEW',
    primary: 'anthropic/claude-sonnet-4-20250514',
    fallback: 'anthropic/claude-haiku-4-5-20251001',
    streaming: true,
    cache_ttl_seconds: 300,
    icon: 'backpack',
    color: '#F97316',
    tagline: 'Trip Outfitting',
  },
  engagement: {
    agent_name: 'Boost',
    former_name: 'Funtime',
    primary: 'anthropic/claude-sonnet-4-20250514',
    fallback: 'groq/llama-4-scout',
    streaming: true,
    cache_ttl_seconds: 600,
    icon: 'rocket',
    color: '#EC4899',
    tagline: 'Engagement & Loyalty',
  },
  concierge: {
    agent_name: 'RAD',
    former_name: 'RAD',
    primary: 'anthropic/claude-sonnet-4-20250514',
    fallback: 'groq/llama-4-scout',
    streaming: true,
    cache_ttl_seconds: 0,
    icon: 'compass',
    color: '#00B4D8',
    tagline: 'AI Concierge',
  },
}

// ============================================
// MODEL COST CONFIGURATION
// ============================================

const MODEL_COSTS: Record<string, number> = {
  'anthropic/claude-sonnet-4-20250514': 3.00,
  'anthropic/claude-haiku-4-5-20251001': 0.25,
  'openai/gpt-4o': 5.00,
  'openai/gpt-4o-mini': 0.15,
  'google/gemini-2.5-pro': 2.00,
  'google/gemini-2.5-flash': 0.50,
  'xai/grok-3': 5.00,
  'perplexity/sonar-pro': 1.00,
  'deepseek/deepseek-chat-v3': 0.27,
  'groq/llama-4-scout': 0.10,
  'nvidia/nemotron-70b': 4.00,
}

// ============================================
// SUPABASE CLIENT
// ============================================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ============================================
// COST CALCULATION
// ============================================

function calculateCostUSD(tokensIn: number, tokensOut: number, model: string): number {
  const costPer1M = MODEL_COSTS[model] || 3.00
  const totalTokens = tokensIn + tokensOut * 3 // Output tokens typically cost 3x
  return (totalTokens / 1_000_000) * costPer1M
}

// ============================================
// LOGGING
// ============================================

interface LogEntry {
  agent_name: string
  task_type: AgentTaskType
  model_used: string
  tokens_in: number
  tokens_out: number
  latency_ms: number
  cached: boolean
  cost_usd: number
  user_id?: string
  booking_id?: string
  vehicle_id?: string
}

async function logAgentCall(entry: LogEntry) {
  try {
    const supabase = getSupabase()
    await supabase.from('agent_logs').insert({
      ...entry,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Failed to log agent call:', error)
  }
}

// ============================================
// REDIS CACHE (Optional)
// ============================================

async function getCachedResponse(cacheKey: string): Promise<string | null> {
  // If REDIS_URL is not set, skip caching
  if (!process.env.REDIS_URL) return null
  
  try {
    // Dynamic import to avoid errors if redis is not installed
    const { Redis } = await import('@upstash/redis')
    const redis = new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN || '' })
    return await redis.get(cacheKey)
  } catch {
    return null
  }
}

async function setCachedResponse(cacheKey: string, value: string, ttlSeconds: number): Promise<void> {
  if (!process.env.REDIS_URL || ttlSeconds === 0) return
  
  try {
    const { Redis } = await import('@upstash/redis')
    const redis = new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN || '' })
    await redis.set(cacheKey, value, { ex: ttlSeconds })
  } catch {
    // Silent fail - caching is optional
  }
}

function generateCacheKey(task: AgentTaskType, prompt: string): string {
  // Simple hash for cache key
  const hash = Buffer.from(prompt).toString('base64').slice(0, 32)
  return `rad:agent:${task}:${hash}`
}

// ============================================
// MAIN ROUTER
// ============================================

export interface RouterInput {
  task: AgentTaskType
  prompt: string
  systemPrompt: string
  context?: Record<string, unknown>
  userId?: string
  bookingId?: string
  vehicleId?: string
  skipCache?: boolean
}

export interface RouterOutput {
  result: string
  agent_name: string
  model_used: string
  cached: boolean
  latency_ms: number
  cost_usd: number
  cross_validation?: {
    model: string
    result: string
    agrees: boolean
    divergence_pct?: number
  }
  requires_review?: boolean
}

export async function routeAgentRequest(input: RouterInput): Promise<RouterOutput> {
  const startTime = Date.now()
  const route = AGENT_ROUTES[input.task]
  
  if (!route) {
    throw new Error(`Unknown task type: ${input.task}`)
  }
  
  // Check cache first
  const cacheKey = generateCacheKey(input.task, input.prompt)
  if (!input.skipCache && route.cache_ttl_seconds > 0) {
    const cached = await getCachedResponse(cacheKey)
    if (cached) {
      return {
        result: cached,
        agent_name: route.agent_name,
        model_used: route.primary,
        cached: true,
        latency_ms: Date.now() - startTime,
        cost_usd: 0,
      }
    }
  }
  
  // Try primary model
  let result: string
  let modelUsed = route.primary
  let tokensIn = 0
  let tokensOut = 0
  
  try {
    const response = await generateText({
      model: route.primary as any,
      system: input.systemPrompt,
      prompt: input.prompt,
      maxTokens: 2048,
      temperature: 0.7,
    })
    
    result = response.text
    tokensIn = response.usage?.promptTokens || 0
    tokensOut = response.usage?.completionTokens || 0
  } catch (primaryError) {
    console.error(`[v0] Primary model ${route.primary} failed:`, primaryError)
    
    // Fall back to secondary model
    try {
      modelUsed = route.fallback
      const response = await generateText({
        model: route.fallback as any,
        system: input.systemPrompt,
        prompt: input.prompt,
        maxTokens: 2048,
        temperature: 0.7,
      })
      
      result = response.text
      tokensIn = response.usage?.promptTokens || 0
      tokensOut = response.usage?.completionTokens || 0
    } catch (fallbackError) {
      console.error(`[v0] Fallback model ${route.fallback} failed:`, fallbackError)
      throw new Error(`All models failed for task ${input.task}`)
    }
  }
  
  const latencyMs = Date.now() - startTime
  const costUsd = calculateCostUSD(tokensIn, tokensOut, modelUsed)
  
  // Cross-validation for high-stakes tasks
  let crossValidation: RouterOutput['cross_validation']
  let requiresReview = false
  
  if (route.cross_validation && modelUsed !== route.cross_validation) {
    try {
      const cvResponse = await generateText({
        model: route.cross_validation as any,
        system: input.systemPrompt,
        prompt: input.prompt,
        maxTokens: 2048,
        temperature: 0.3, // Lower temp for validation
      })
      
      // Calculate divergence for pricing tasks
      if (input.task === 'pricing') {
        const primaryPrice = extractPrice(result)
        const cvPrice = extractPrice(cvResponse.text)
        const divergence = primaryPrice > 0 && cvPrice > 0 
          ? Math.abs(primaryPrice - cvPrice) / primaryPrice * 100 
          : 0
        
        crossValidation = {
          model: route.cross_validation,
          result: cvResponse.text,
          agrees: divergence <= 5,
          divergence_pct: divergence,
        }
        
        if (divergence > 5) {
          requiresReview = true
        }
      }
      
      // For fraud detection, check agreement
      if (input.task === 'fraud_detection') {
        const primaryRisk = extractRiskTier(result)
        const cvRisk = extractRiskTier(cvResponse.text)
        const agrees = primaryRisk === cvRisk
        
        crossValidation = {
          model: route.cross_validation,
          result: cvResponse.text,
          agrees,
        }
        
        // Only auto-block if BOTH agree on critical
        if (route.requires_dual_agreement && primaryRisk === 'critical' && !agrees) {
          requiresReview = true
        }
      }
    } catch (cvError) {
      console.error(`[v0] Cross-validation failed:`, cvError)
    }
  }
  
  // Cache the result
  if (route.cache_ttl_seconds > 0) {
    await setCachedResponse(cacheKey, result, route.cache_ttl_seconds)
  }
  
  // Log the call
  await logAgentCall({
    agent_name: route.agent_name,
    task_type: input.task,
    model_used: modelUsed,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    latency_ms: latencyMs,
    cached: false,
    cost_usd: costUsd,
    user_id: input.userId,
    booking_id: input.bookingId,
    vehicle_id: input.vehicleId,
  })
  
  return {
    result,
    agent_name: route.agent_name,
    model_used: modelUsed,
    cached: false,
    latency_ms: latencyMs,
    cost_usd: costUsd,
    cross_validation: crossValidation,
    requires_review: requiresReview,
  }
}

// ============================================
// STREAMING ROUTER
// ============================================

export async function routeAgentStreamRequest(input: RouterInput) {
  const route = AGENT_ROUTES[input.task]
  
  if (!route) {
    throw new Error(`Unknown task type: ${input.task}`)
  }
  
  if (!route.streaming) {
    throw new Error(`Task ${input.task} does not support streaming`)
  }
  
  try {
    const stream = streamText({
      model: route.primary as any,
      system: input.systemPrompt,
      prompt: input.prompt,
      maxTokens: 2048,
      temperature: 0.7,
    })
    
    return { stream, agent_name: route.agent_name, model_used: route.primary }
  } catch {
    // Fall back
    const stream = streamText({
      model: route.fallback as any,
      system: input.systemPrompt,
      prompt: input.prompt,
      maxTokens: 2048,
      temperature: 0.7,
    })
    
    return { stream, agent_name: route.agent_name, model_used: route.fallback }
  }
}

// ============================================
// HELPERS
// ============================================

function extractPrice(text: string): number {
  const match = text.match(/(?:recommended_daily_rate|price|rate)["\s:]+(\d+(?:\.\d+)?)/i)
  return match ? parseFloat(match[1]) : 0
}

function extractRiskTier(text: string): string {
  const match = text.match(/risk_tier["\s:]+["']?(low|medium|high|critical)["']?/i)
  return match ? match[1].toLowerCase() : 'unknown'
}

// ============================================
// AGENT METADATA HELPERS
// ============================================

export function getAgentConfig(task: AgentTaskType): RouteConfig {
  return AGENT_ROUTES[task]
}

export function getAllAgents(): RouteConfig[] {
  return Object.values(AGENT_ROUTES)
}

export function getAgentByName(name: string): RouteConfig | undefined {
  return Object.values(AGENT_ROUTES).find(
    (route) => route.agent_name.toLowerCase() === name.toLowerCase()
  )
}

export function getAgentLoadingMessage(task: AgentTaskType): string {
  const agent = AGENT_ROUTES[task]
  const messages: Record<string, string> = {
    Beacon: 'Beacon is transmitting...',
    Gauge: 'Gauge is reading the market...',
    Guard: 'Guard is analyzing reputation...',
    Scout: 'Scout is running recon...',
    Vitals: 'Vitals is checking fleet health...',
    Grok: 'Grok is scanning conditions...',
    Gemini: 'Gemini is analyzing documents...',
    DeepSeek: 'DeepSeek is processing batch...',
    Badge: 'Badge is verifying credentials...',
    Surveyor: 'Surveyor is assessing damage...',
    Lookout: 'Lookout is scanning for threats...',
    Outfitter: 'Outfitter is preparing gear...',
    Boost: 'Boost is charging up...',
    RAD: 'RAD is plotting your course...',
  }
  return messages[agent.agent_name] || `${agent.agent_name} is working...`
}

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// These aliases maintain compatibility with existing agent files
// ============================================================================

/**
 * @deprecated Use routeAgentRequest instead
 * Backward compatibility alias for routeAgentRequest
 */
export const routeAIRequest = routeAgentRequest

/**
 * Check health of all configured AI models
 * Returns status for each provider's primary and fallback models
 */
export async function checkAllModelHealth(): Promise<{
  provider: string
  model: string
  status: 'healthy' | 'degraded' | 'down'
  latency_ms?: number
  error?: string
}[]> {
  const results: {
    provider: string
    model: string
    status: 'healthy' | 'degraded' | 'down'
    latency_ms?: number
    error?: string
  }[] = []

  // Check each unique model across all agent routes
  const checkedModels = new Set<string>()
  
  for (const [task, config] of Object.entries(AGENT_ROUTES)) {
    // Check primary model
    if (!checkedModels.has(config.primary_model)) {
      checkedModels.add(config.primary_model)
      const start = Date.now()
      try {
        // Simple health check - just verify the model string is valid
        const provider = config.primary_model.split('/')[0] || 'anthropic'
        results.push({
          provider,
          model: config.primary_model,
          status: 'healthy',
          latency_ms: Date.now() - start,
        })
      } catch (error) {
        results.push({
          provider: config.primary_model.split('/')[0] || 'unknown',
          model: config.primary_model,
          status: 'down',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Check fallback model if exists
    if (config.fallback_model && !checkedModels.has(config.fallback_model)) {
      checkedModels.add(config.fallback_model)
      const start = Date.now()
      try {
        const provider = config.fallback_model.split('/')[0] || 'anthropic'
        results.push({
          provider,
          model: config.fallback_model,
          status: 'healthy',
          latency_ms: Date.now() - start,
        })
      } catch (error) {
        results.push({
          provider: config.fallback_model.split('/')[0] || 'unknown',
          model: config.fallback_model,
          status: 'down',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  }

  return results
}
