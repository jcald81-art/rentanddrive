/**
 * Unified Agent API Endpoint
 * POST /api/agent
 * 
 * Flow:
 * 1. Authenticate request (Supabase JWT)
 * 2. Run intent classifier if task not explicitly provided
 * 3. Look up system prompt from AGENT_PROMPTS
 * 4. Route to primary model via ai-router
 * 5. On failure, route to fallback
 * 6. Cross-validate if required
 * 7. Log to agent_logs table
 * 8. Return result (streaming or JSON)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  routeAgentRequest, 
  routeAgentStreamRequest,
  AgentTaskType, 
  AGENT_ROUTES,
  getAgentLoadingMessage 
} from '@/lib/ai-router'
import { getAgentPrompt } from '@/lib/agent-prompts'
import { classifyIntent } from '@/lib/intent-classifier'

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

interface AgentRequest {
  task?: AgentTaskType
  message: string
  context?: Record<string, unknown>
  stream?: boolean
  bookingId?: string
  vehicleId?: string
}

// ============================================
// AUTHENTICATION
// ============================================

async function authenticateRequest(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { user: null, error: 'Unauthorized' }
  }
  
  return { user, error: null }
}

// ============================================
// POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const { user, error: authError } = await authenticateRequest(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 2. Parse request body
    const body: AgentRequest = await request.json()
    
    if (!body.message || body.message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    
    // 3. Classify intent if task not provided
    let task = body.task
    let classificationMethod: 'explicit' | 'keyword' | 'llm' = 'explicit'
    
    if (!task) {
      const classification = await classifyIntent(body.message)
      task = classification.task
      classificationMethod = classification.method
    }
    
    // Validate task type
    if (!AGENT_ROUTES[task]) {
      return NextResponse.json({ error: `Invalid task type: ${task}` }, { status: 400 })
    }
    
    // 4. Get system prompt
    const systemPrompt = getAgentPrompt(task)
    const route = AGENT_ROUTES[task]
    
    // 5. Build context string
    let contextString = ''
    if (body.context) {
      contextString = `\n\nContext:\n${JSON.stringify(body.context, null, 2)}`
    }
    
    const fullPrompt = body.message + contextString
    
    // 6. Handle streaming requests
    if (body.stream && route.streaming) {
      const { stream, agent_name, model_used } = await routeAgentStreamRequest({
        task,
        prompt: fullPrompt,
        systemPrompt,
        userId: user.id,
        bookingId: body.bookingId,
        vehicleId: body.vehicleId,
      })
      
      // Return streaming response with metadata headers
      const response = stream.toDataStreamResponse()
      response.headers.set('X-Agent-Name', agent_name)
      response.headers.set('X-Model-Used', model_used)
      response.headers.set('X-Task-Type', task)
      response.headers.set('X-Classification-Method', classificationMethod)
      
      return response
    }
    
    // 7. Non-streaming request
    const result = await routeAgentRequest({
      task,
      prompt: fullPrompt,
      systemPrompt,
      userId: user.id,
      bookingId: body.bookingId,
      vehicleId: body.vehicleId,
    })
    
    // 8. Return JSON response
    return NextResponse.json({
      success: true,
      data: {
        result: result.result,
        agent_name: result.agent_name,
        model_used: result.model_used,
        task_type: task,
        classification_method: classificationMethod,
        cached: result.cached,
        latency_ms: result.latency_ms,
        cost_usd: result.cost_usd,
        cross_validation: result.cross_validation,
        requires_review: result.requires_review,
      },
    })
    
  } catch (error) {
    console.error('[v0] Agent API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    )
  }
}

// ============================================
// GET HANDLER - Agent Info
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const task = searchParams.get('task') as AgentTaskType | null
  
  if (task) {
    // Return info for specific agent
    const route = AGENT_ROUTES[task]
    if (!route) {
      return NextResponse.json({ error: 'Invalid task type' }, { status: 400 })
    }
    
    return NextResponse.json({
      task,
      agent_name: route.agent_name,
      former_name: route.former_name,
      tagline: route.tagline,
      icon: route.icon,
      color: route.color,
      streaming: route.streaming,
      loading_message: getAgentLoadingMessage(task),
    })
  }
  
  // Return all agents
  const agents = Object.entries(AGENT_ROUTES).map(([task, route]) => ({
    task,
    agent_name: route.agent_name,
    former_name: route.former_name,
    tagline: route.tagline,
    icon: route.icon,
    color: route.color,
    streaming: route.streaming,
    loading_message: getAgentLoadingMessage(task as AgentTaskType),
  }))
  
  return NextResponse.json({ agents })
}
