import { generateText, streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createClient } from '@supabase/supabase-js'

// Task types for routing
export type TaskType = 
  | 'communications'
  | 'pricing'
  | 'reviews'
  | 'market_intelligence'
  | 'fleet_health'
  | 'realtime_conditions'
  | 'document_analysis'
  | 'bulk_processing'
  | 'concierge'

// Model configuration
interface ModelConfig {
  name: string
  provider: string
  modelId: string
  costPer1MTokens: number
  timeout: number
  envKey: string
}

const MODELS: Record<string, ModelConfig> = {
  claude: {
    name: 'claude',
    provider: 'anthropic',
    modelId: 'claude-sonnet-4-20250514',
    costPer1MTokens: 3.00,
    timeout: 30000,
    envKey: 'ANTHROPIC_API_KEY',
  },
  'gpt-4o': {
    name: 'gpt-4o',
    provider: 'openai',
    modelId: 'gpt-4o',
    costPer1MTokens: 5.00,
    timeout: 30000,
    envKey: 'OPENAI_API_KEY',
  },
  grok: {
    name: 'grok',
    provider: 'xai',
    modelId: 'grok-2',
    costPer1MTokens: 5.00,
    timeout: 15000,
    envKey: 'GROK_API_KEY',
  },
  gemini: {
    name: 'gemini',
    provider: 'google',
    modelId: 'gemini-1.5-pro',
    costPer1MTokens: 2.00,
    timeout: 30000,
    envKey: 'GEMINI_API_KEY',
  },
  perplexity: {
    name: 'perplexity',
    provider: 'perplexity',
    modelId: 'llama-3.1-sonar-large-128k-online',
    costPer1MTokens: 1.00,
    timeout: 30000,
    envKey: 'PERPLEXITY_API_KEY',
  },
  deepseek: {
    name: 'deepseek',
    provider: 'deepseek',
    modelId: 'deepseek-chat',
    costPer1MTokens: 0.27,
    timeout: 30000,
    envKey: 'DEEPSEEK_API_KEY',
  },
  llama: {
    name: 'llama',
    provider: 'groq',
    modelId: 'llama-3.3-70b-versatile',
    costPer1MTokens: 0.27,
    timeout: 10000,
    envKey: 'GROQ_API_KEY',
  },
  nemotron: {
    name: 'nemotron',
    provider: 'nvidia',
    modelId: 'nvidia/llama-3.1-nemotron-70b-instruct',
    costPer1MTokens: 4.00,
    timeout: 30000,
    envKey: 'NVIDIA_API_KEY',
  },
}

// Task type to primary/fallback model mapping
const TASK_ROUTING: Record<TaskType, { primary: string; fallback: string; crossValidation?: string }> = {
  communications: { primary: 'claude', fallback: 'llama' },
  pricing: { primary: 'claude', fallback: 'gpt-4o', crossValidation: 'gpt-4o' },
  reviews: { primary: 'claude', fallback: 'gemini' },
  market_intelligence: { primary: 'perplexity', fallback: 'claude' },
  fleet_health: { primary: 'nemotron', fallback: 'claude' },
  realtime_conditions: { primary: 'grok', fallback: 'claude' },
  document_analysis: { primary: 'gemini', fallback: 'claude' },
  bulk_processing: { primary: 'deepseek', fallback: 'claude' },
  concierge: { primary: 'claude', fallback: 'llama' },
}

// Supabase client for logging and status
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Get model provider instance
function getModelProvider(modelName: string) {
  const config = MODELS[modelName]
  if (!config) throw new Error(`Unknown model: ${modelName}`)

  const apiKey = process.env[config.envKey]
  if (!apiKey) return null

  switch (config.provider) {
    case 'anthropic':
      return createAnthropic({ apiKey })(config.modelId)
    case 'openai':
      return createOpenAI({ apiKey })(config.modelId)
    case 'google':
      return createGoogleGenerativeAI({ apiKey })(config.modelId)
    case 'xai':
      // xAI uses OpenAI-compatible API
      return createOpenAI({ 
        apiKey, 
        baseURL: 'https://api.x.ai/v1' 
      })(config.modelId)
    case 'perplexity':
      return createOpenAI({ 
        apiKey, 
        baseURL: 'https://api.perplexity.ai' 
      })(config.modelId)
    case 'deepseek':
      return createOpenAI({ 
        apiKey, 
        baseURL: 'https://api.deepseek.com' 
      })(config.modelId)
    case 'groq':
      return createOpenAI({ 
        apiKey, 
        baseURL: 'https://api.groq.com/openai/v1' 
      })(config.modelId)
    case 'nvidia':
      return createOpenAI({ 
        apiKey, 
        baseURL: 'https://integrate.api.nvidia.com/v1' 
      })(config.modelId)
    default:
      return null
  }
}

// Check if model is available
async function isModelAvailable(modelName: string): Promise<boolean> {
  const config = MODELS[modelName]
  if (!config) return false
  
  // Check if API key exists
  if (!process.env[config.envKey]) return false

  // Check model_status table
  const supabase = getSupabase()
  const { data } = await supabase
    .from('model_status')
    .select('is_available, is_manually_disabled, consecutive_failures')
    .eq('model_name', modelName)
    .single()

  if (!data) return true // Default to available if no status record
  if (data.is_manually_disabled) return false
  if (data.consecutive_failures >= 3) return false
  
  return data.is_available
}

// Calculate cost in cents
function calculateCost(tokens: number, modelName: string): number {
  const config = MODELS[modelName]
  if (!config) return 0
  return Math.ceil((tokens / 1_000_000) * config.costPer1MTokens * 100)
}

// Log model usage to agent_logs and update model_status
async function logModelUsage(
  agentName: string,
  actionType: string,
  modelUsed: string,
  tokensUsed: number,
  costCents: number,
  status: 'success' | 'error',
  responseMs: number,
  inputData?: Record<string, unknown>,
  outputData?: Record<string, unknown>,
  errorMessage?: string
) {
  const supabase = getSupabase()

  // Log to agent_logs
  await supabase.from('agent_logs').insert({
    agent_name: agentName,
    action_type: actionType,
    model_used: modelUsed,
    tokens_used: tokensUsed,
    cost_cents: costCents,
    status,
    input_data: inputData || {},
    output_data: outputData || { error: errorMessage },
  })

  // Update model_status
  const now = new Date().toISOString()
  
  if (status === 'success') {
    await supabase.rpc('update_model_success', {
      p_model_name: modelUsed,
      p_tokens: tokensUsed,
      p_cost_cents: costCents,
      p_response_ms: responseMs,
    }).catch(() => {
      // Fallback if RPC doesn't exist
      supabase
        .from('model_status')
        .update({
          last_checked: now,
          last_success: now,
          consecutive_failures: 0,
          error_count: 0,
          is_available: true,
          total_requests: supabase.rpc('increment', { x: 1 }),
          total_tokens_used: supabase.rpc('increment', { x: tokensUsed }),
          total_cost_cents: supabase.rpc('increment', { x: costCents }),
          cost_today_cents: supabase.rpc('increment', { x: costCents }),
          updated_at: now,
        })
        .eq('model_name', modelUsed)
    })
  } else {
    await supabase
      .from('model_status')
      .update({
        last_checked: now,
        consecutive_failures: supabase.rpc('increment', { x: 1 }),
        error_count: supabase.rpc('increment', { x: 1 }),
        is_available: false,
        updated_at: now,
      })
      .eq('model_name', modelUsed)
      .catch(() => {})
  }
}

// Main router interface
export interface RouterOptions {
  taskType: TaskType
  agentName: string
  actionType: string
  system: string
  prompt: string
  maxTokens?: number
  temperature?: number
  forceModel?: string // Override routing
  enableCrossValidation?: boolean
}

export interface RouterResult {
  text: string
  modelUsed: string
  tokensUsed: number
  costCents: number
  responseMs: number
  crossValidation?: {
    text: string
    modelUsed: string
    agreement: boolean
  }
}

// Main router function
export async function routeAIRequest(options: RouterOptions): Promise<RouterResult> {
  const {
    taskType,
    agentName,
    actionType,
    system,
    prompt,
    maxTokens = 1024,
    temperature = 0.7,
    forceModel,
    enableCrossValidation = false,
  } = options

  const routing = TASK_ROUTING[taskType]
  const startTime = Date.now()
  
  // Determine which models to try
  const modelsToTry = forceModel 
    ? [forceModel] 
    : [routing.primary, routing.fallback, 'claude'] // Always have Claude as final fallback
  
  let lastError: Error | null = null

  for (const modelName of modelsToTry) {
    // Skip if already tried or not available
    if (!(await isModelAvailable(modelName))) {
      continue
    }

    const model = getModelProvider(modelName)
    if (!model) continue

    const config = MODELS[modelName]
    
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeout)

      const result = await generateText({
        model,
        system,
        prompt,
        maxTokens,
        temperature,
        abortSignal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseMs = Date.now() - startTime
      const tokensUsed = result.usage?.totalTokens || 0
      const costCents = calculateCost(tokensUsed, modelName)

      // Log success
      await logModelUsage(
        agentName,
        actionType,
        modelName,
        tokensUsed,
        costCents,
        'success',
        responseMs,
        { taskType, promptLength: prompt.length },
        { textLength: result.text.length }
      )

      // Cross-validation for high-value decisions
      let crossValidation: RouterResult['crossValidation']
      if (enableCrossValidation && routing.crossValidation && modelName !== routing.crossValidation) {
        try {
          const cvModel = getModelProvider(routing.crossValidation)
          if (cvModel && await isModelAvailable(routing.crossValidation)) {
            const cvResult = await generateText({
              model: cvModel,
              system: `${system}\n\nPrevious analysis concluded: "${result.text.slice(0, 500)}..."\n\nDo you agree with this analysis? Provide your own assessment.`,
              prompt,
              maxTokens: 512,
              temperature: 0.3,
            })

            const agreement = cvResult.text.toLowerCase().includes('agree') || 
                             cvResult.text.toLowerCase().includes('concur') ||
                             cvResult.text.toLowerCase().includes('correct')

            crossValidation = {
              text: cvResult.text,
              modelUsed: routing.crossValidation,
              agreement,
            }

            // Log cross-validation
            await logModelUsage(
              agentName,
              `${actionType}_crossvalidation`,
              routing.crossValidation,
              cvResult.usage?.totalTokens || 0,
              calculateCost(cvResult.usage?.totalTokens || 0, routing.crossValidation),
              'success',
              Date.now() - startTime - responseMs
            )
          }
        } catch {
          // Cross-validation is optional, don't fail if it errors
        }
      }

      return {
        text: result.text,
        modelUsed: modelName,
        tokensUsed,
        costCents,
        responseMs,
        crossValidation,
      }
    } catch (error) {
      lastError = error as Error
      const responseMs = Date.now() - startTime

      // Log failure
      await logModelUsage(
        agentName,
        actionType,
        modelName,
        0,
        0,
        'error',
        responseMs,
        { taskType, promptLength: prompt.length },
        undefined,
        (error as Error).message
      )

      // Continue to next model
      continue
    }
  }

  throw lastError || new Error('All models failed')
}

// Streaming version of router
export async function routeAIStreamRequest(options: RouterOptions) {
  const {
    taskType,
    system,
    prompt,
    maxTokens = 1024,
    temperature = 0.7,
    forceModel,
  } = options

  const routing = TASK_ROUTING[taskType]
  
  // Determine which model to use
  const modelsToTry = forceModel 
    ? [forceModel] 
    : [routing.primary, routing.fallback, 'claude']
  
  for (const modelName of modelsToTry) {
    if (!(await isModelAvailable(modelName))) continue
    
    const model = getModelProvider(modelName)
    if (!model) continue

    try {
      const result = streamText({
        model,
        system,
        prompt,
        maxTokens,
        temperature,
      })

      return { stream: result, modelUsed: modelName }
    } catch {
      continue
    }
  }

  // Final fallback to Claude via AI Gateway
  return {
    stream: streamText({
      model: 'anthropic/claude-sonnet-4-6' as any,
      system,
      prompt,
      maxTokens,
      temperature,
    }),
    modelUsed: 'claude-gateway',
  }
}

// Health check function for cron job
export async function checkAllModelHealth(): Promise<Record<string, { available: boolean; responseMs: number; error?: string }>> {
  const results: Record<string, { available: boolean; responseMs: number; error?: string }> = {}
  const supabase = getSupabase()
  const now = new Date().toISOString()

  for (const [modelName, config] of Object.entries(MODELS)) {
    const startTime = Date.now()
    
    // Check if API key exists
    if (!process.env[config.envKey]) {
      results[modelName] = { available: false, responseMs: 0, error: 'No API key' }
      continue
    }

    try {
      const model = getModelProvider(modelName)
      if (!model) {
        results[modelName] = { available: false, responseMs: 0, error: 'Provider init failed' }
        continue
      }

      // Simple health check prompt
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      await generateText({
        model,
        prompt: 'Reply with "OK" only.',
        maxTokens: 10,
        abortSignal: controller.signal,
      })

      clearTimeout(timeoutId)
      const responseMs = Date.now() - startTime

      results[modelName] = { available: true, responseMs }

      // Update model_status
      await supabase
        .from('model_status')
        .update({
          is_available: true,
          consecutive_failures: 0,
          last_checked: now,
          last_success: now,
          avg_response_ms: responseMs,
          updated_at: now,
        })
        .eq('model_name', modelName)

    } catch (error) {
      const responseMs = Date.now() - startTime
      results[modelName] = { 
        available: false, 
        responseMs, 
        error: (error as Error).message 
      }

      // Update model_status with failure
      const { data: current } = await supabase
        .from('model_status')
        .select('consecutive_failures, error_count')
        .eq('model_name', modelName)
        .single()

      const newConsecutiveFailures = (current?.consecutive_failures || 0) + 1

      await supabase
        .from('model_status')
        .update({
          is_available: newConsecutiveFailures < 3,
          consecutive_failures: newConsecutiveFailures,
          error_count: (current?.error_count || 0) + 1,
          last_checked: now,
          updated_at: now,
        })
        .eq('model_name', modelName)
    }
  }

  return results
}

// Get model status for dashboard
export async function getModelStatuses() {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('model_status')
    .select('*')
    .order('model_name')

  if (error) throw error
  return data
}

// Toggle model availability (admin function)
export async function toggleModelAvailability(modelName: string, disabled: boolean) {
  const supabase = getSupabase()
  
  await supabase
    .from('model_status')
    .update({ 
      is_manually_disabled: disabled,
      updated_at: new Date().toISOString(),
    })
    .eq('model_name', modelName)
}
