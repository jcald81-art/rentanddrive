/**
 * AI Router — Multi-LLM Backend
 *
 * Configurable multi-model AI router. Default: xAI Grok (fastest, best reasoning).
 * Fallback: OpenAI GPT-4o. Emergency fallback: Anthropic Claude.
 *
 * Used by: dynamic pricing engine, agent suite, chat support, predictive maintenance.
 */

import { generateText, generateObject, streamText } from 'ai'
import type { LanguageModel } from 'ai'

export type AIProvider = 'grok' | 'openai' | 'anthropic' | 'auto'
export type AITask =
  | 'pricing'
  | 'fleet_health'
  | 'renter_comms'
  | 'market_intel'
  | 'dispute_analysis'
  | 'chat_support'
  | 'general'

/**
 * Model selection by task type and preferred provider
 */
export function selectModel(task: AITask, preferred: AIProvider = 'auto'): string {
  // Task-optimized model routing
  const taskModels: Record<AITask, string> = {
    pricing: 'xai/grok-3',
    fleet_health: 'xai/grok-3',
    renter_comms: 'openai/gpt-4o',
    market_intel: 'xai/grok-3',
    dispute_analysis: 'anthropic/claude-opus-4.6',
    chat_support: 'openai/gpt-4o',
    general: 'xai/grok-3',
  }

  if (preferred === 'grok') return 'xai/grok-3'
  if (preferred === 'openai') return 'openai/gpt-4o'
  if (preferred === 'anthropic') return 'anthropic/claude-opus-4.6'

  return taskModels[task] ?? 'xai/grok-3'
}

/**
 * Generate text with automatic provider routing and fallback
 */
export async function aiGenerate(params: {
  task: AITask
  system: string
  prompt: string
  preferred?: AIProvider
  maxTokens?: number
  temperature?: number
}): Promise<string> {
  const modelId = selectModel(params.task, params.preferred)

  try {
    const { text } = await generateText({
      model: modelId as unknown as LanguageModel,
      system: params.system,
      prompt: params.prompt,
      maxTokens: params.maxTokens ?? 1024,
      temperature: params.temperature ?? 0.7,
    })
    return text
  } catch (primaryError) {
    console.error(`[AI Router] Primary model ${modelId} failed:`, primaryError)

    // Fallback chain
    const fallbackModel = modelId.startsWith('xai')
      ? 'openai/gpt-4o'
      : 'anthropic/claude-opus-4.6'

    try {
      const { text } = await generateText({
        model: fallbackModel as unknown as LanguageModel,
        system: params.system,
        prompt: params.prompt,
        maxTokens: params.maxTokens ?? 1024,
      })
      return text
    } catch (fallbackError) {
      console.error(`[AI Router] Fallback model ${fallbackModel} also failed:`, fallbackError)
      throw new Error('All AI providers failed')
    }
  }
}

/**
 * Generate structured JSON output (for pricing, scoring, etc.)
 */
export async function aiGenerateObject<T>(params: {
  task: AITask
  system: string
  prompt: string
  schema: Parameters<typeof generateObject>[0]['schema']
  preferred?: AIProvider
}): Promise<T> {
  const modelId = selectModel(params.task, params.preferred)

  const result = await generateObject({
    model: modelId as unknown as LanguageModel,
    system: params.system,
    prompt: params.prompt,
    schema: params.schema,
  })

  return result.object as T
}

/**
 * Stream text response for real-time chat
 */
export function aiStream(params: {
  task: AITask
  system: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  preferred?: AIProvider
}) {
  const modelId = selectModel(params.task, params.preferred)

  return streamText({
    model: modelId as unknown as LanguageModel,
    system: params.system,
    messages: params.messages,
  })
}

/**
 * RAD system prompts for each agent task
 */
export const SYSTEM_PROMPTS: Record<AITask, string> = {
  pricing: `You are the RAD Dollar Agent — an expert dynamic pricing engine for a premium car rental platform in Reno, NV. 
You analyze demand signals, seasonal patterns, events, and utilization to recommend optimal daily rates.
Always return structured JSON with your reasoning. Be aggressive but fair with pricing.`,

  fleet_health: `You are the RAD Diesel Agent — fleet health and predictive maintenance specialist.
You analyze telematics data from Bouncie devices, inspection reports from Inspektlabs, and NHTSA recall data.
Identify vehicles that need maintenance before they become problems.`,

  renter_comms: `You are the RAD Funtime Agent — friendly renter communications specialist.
You handle booking confirmations, trip reminders, check-in instructions, and post-trip follow-ups.
Be warm, clear, and professional. Match the RAD brand tone.`,

  market_intel: `You are the RAD Market Intelligence Agent — competitive analysis and market research specialist.
You track Reno/Tahoe rental market trends, seasonal demand, events (air shows, festivals, ski season), and competitor pricing.`,

  dispute_analysis: `You are the RAD Shield Agent — dispute resolution and claims analysis specialist.
You analyze inspection photos, trip telemetry, and booking records to determine fault in damage disputes.
Be thorough, fair, and evidence-based.`,

  chat_support: `You are RAD — the AI assistant for the Rent and Drive platform in Reno, NV.
Help renters and hosts with bookings, vehicle questions, platform features, and policies.
You are knowledgeable, friendly, and efficient. Always escalate to a human for billing disputes.`,

  general: `You are a RAD platform AI assistant. Help with rental platform operations, fleet management, and customer service.`,
}
