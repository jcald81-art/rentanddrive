/**
 * RAD Concierge Orchestration System
 * 
 * Handles multi-agent coordination where RAD Concierge is the entry point
 * and can engage specialist agents to synthesize comprehensive responses.
 */

import type { AgentTaskType } from './agents/agent-configs'

// ============================================
// ORCHESTRATION RULES - Intent → Agent Routing
// ============================================

export interface OrchestrationRule {
  keywords: string[]
  agents: AgentTaskType[]
  rad_handoff: string
}

export const ORCHESTRATION_RULES: OrchestrationRule[] = [
  {
    keywords: ['earn', 'income', 'rate', 'price', 'pricing', 'revenue', 'how much', 'daily rate'],
    agents: ['pricing'],
    rad_handoff: "Let me have RAD Pricing run those numbers for you."
  },
  {
    keywords: ['market', 'competitor', 'demand', 'popular', 'busy', 'season', 'turo'],
    agents: ['market_intelligence'],
    rad_handoff: "RAD Intel is scanning the current market — one moment."
  },
  {
    keywords: ['health', 'maintenance', 'oil', 'engine', 'check engine', 'miles', 'service', 'repair'],
    agents: ['fleet_health'],
    rad_handoff: "Pulling the RAD Fleet report on that vehicle now."
  },
  {
    keywords: ['review', 'rating', 'star', 'feedback', 'reputation', 'response'],
    agents: ['reviews'],
    rad_handoff: "RAD Reputation handles this — analyzing the situation."
  },
  {
    keywords: ['license', 'verify', 'identity', 'approved', 'verification', 'rejected'],
    agents: ['driver_verification'],
    rad_handoff: "Routing to RAD Verify — our verification specialist."
  },
  {
    keywords: ['suspicious', 'fraud', 'stolen', 'security', 'payment declined', 'flagged'],
    agents: ['fraud_detection'],
    rad_handoff: "I'm flagging this for RAD Secure — our security agent."
  },
  {
    keywords: ['gear', 'chains', 'rack', 'add-on', 'equip', 'what do I need', 'bring'],
    agents: ['upsell_recommendation'],
    rad_handoff: "RAD Upsell knows exactly what that trip needs."
  },
  {
    keywords: ['damage', 'scratch', 'dent', 'photo', 'inspection', 'condition'],
    agents: ['damage_assessment'],
    rad_handoff: "Pulling the RAD CarFidelity inspection report."
  },
  {
    keywords: ['points', 'rewards', 'tier', 'milestone', 'referral', 'mile markers'],
    agents: ['engagement'],
    rad_handoff: "Checking your Mile Markers status with RAD Rewards."
  },
  {
    keywords: ['message', 'text', 'email', 'contact host', 'write', 'dispute', 'communicate'],
    agents: ['communications'],
    rad_handoff: "Let me have RAD Comms draft that for you."
  },
  // Complex multi-agent scenarios
  {
    keywords: ['list my car', 'become a host', 'should I list', 'host earnings'],
    agents: ['pricing', 'market_intelligence'],
    rad_handoff: "Good question — let me check both earnings potential and current market conditions."
  },
  {
    keywords: ['best vehicle', 'recommend', 'which car', 'what should I rent'],
    agents: ['upsell_recommendation', 'market_intelligence'],
    rad_handoff: "Let me find the right vehicle for that trip."
  },
  {
    keywords: ['road conditions', 'weather', 'chains required', 'snow'],
    agents: ['realtime_conditions'],
    rad_handoff: "Checking current conditions with Grok — one moment."
  },
]

// ============================================
// INTENT DETECTION
// ============================================

export interface DetectedIntent {
  shouldOrchestrate: boolean
  agents: AgentTaskType[]
  handoffMessage: string
}

export function detectIntent(message: string): DetectedIntent {
  const lowercaseMessage = message.toLowerCase()
  
  // Check each rule for keyword matches
  for (const rule of ORCHESTRATION_RULES) {
    const matchCount = rule.keywords.filter(keyword => 
      lowercaseMessage.includes(keyword.toLowerCase())
    ).length
    
    // Require at least one keyword match
    if (matchCount > 0) {
      return {
        shouldOrchestrate: true,
        agents: rule.agents,
        handoffMessage: rule.rad_handoff
      }
    }
  }
  
  // No specialist needed - RAD handles directly
  return {
    shouldOrchestrate: false,
    agents: [],
    handoffMessage: ''
  }
}

// ============================================
// MULTI-AGENT ORCHESTRATION
// ============================================

export interface AgentResult {
  agent: AgentTaskType
  result: string
  success: boolean
}

export interface OrchestrationResult {
  agentResults: AgentResult[]
  synthesizedResponse: string
  consultedAgents: AgentTaskType[]
}

/**
 * Orchestrates multiple specialist agents and synthesizes their outputs
 * into a single cohesive RAD Concierge response.
 */
export async function orchestrateAgents(
  message: string,
  requiredAgents: AgentTaskType[],
  context: Record<string, unknown>
): Promise<OrchestrationResult> {
  
  // Fire all required agents in parallel
  const agentPromises = requiredAgents.map(async (agentType): Promise<AgentResult> => {
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: agentType,
          message,
          context,
          stream: false,
          max_tokens: 300,
        })
      })
      
      if (!response.ok) {
        throw new Error(`Agent ${agentType} returned ${response.status}`)
      }
      
      const data = await response.json()
      return {
        agent: agentType,
        result: data.result || data.message || '',
        success: true
      }
    } catch (error) {
      console.error(`[v0] Agent ${agentType} failed:`, error)
      return {
        agent: agentType,
        result: `Unable to reach ${agentType} agent.`,
        success: false
      }
    }
  })
  
  const agentResults = await Promise.all(agentPromises)
  
  // Build synthesis context
  const successfulResults = agentResults.filter(r => r.success)
  
  if (successfulResults.length === 0) {
    return {
      agentResults,
      synthesizedResponse: "I'm having trouble reaching my specialist team right now. Let me help you directly — what specific information do you need?",
      consultedAgents: requiredAgents
    }
  }
  
  // Create synthesis prompt for RAD to combine agent outputs
  const agentOutputs = successfulResults
    .map(r => `${getAgentDisplayName(r.agent)}: ${r.result}`)
    .join('\n\n')
  
  // Return the synthesis context - actual synthesis happens in the API route
  return {
    agentResults,
    synthesizedResponse: agentOutputs,
    consultedAgents: requiredAgents
  }
}

// ============================================
// AGENT DISPLAY NAMES
// ============================================

export function getAgentDisplayName(task: AgentTaskType): string {
  const displayNames: Record<AgentTaskType, string> = {
    communications: 'RAD Comms',
    pricing: 'RAD Pricing',
    reviews: 'RAD Reputation',
    market_intelligence: 'RAD Intel',
    fleet_health: 'RAD Fleet',
    realtime_conditions: 'Grok',
    document_analysis: 'Gemini',
    bulk_processing: 'DeepSeek',
    driver_verification: 'RAD Verify',
    damage_assessment: 'RAD CarFidelity',
    fraud_detection: 'RAD Secure',
    upsell_recommendation: 'RAD Upsell',
    engagement: 'RAD Rewards',
    concierge: 'RAD',
  }
  return displayNames[task] || task
}

export function getAgentConsultingMessage(agents: AgentTaskType[]): string {
  if (agents.length === 0) return ''
  if (agents.length === 1) {
    return `Consulting ${getAgentDisplayName(agents[0])}...`
  }
  const names = agents.map(getAgentDisplayName)
  return `Consulting ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}...`
}
