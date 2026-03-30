/**
 * Diesel - CarFidelity Vehicle Verification Agent
 * 
 * Personality: Direct, no-nonsense, trustworthy. Like a seasoned mechanic
 * who tells you exactly what he found with zero sugarcoating.
 * 
 * Responsibilities:
 * - VIN verification via CarFidelity
 * - Title status checks
 * - Accident history analysis
 * - Odometer verification
 * - Recall monitoring
 * - Market value assessment
 */

import { createClient } from '@/lib/supabase/server'

const DIESEL_PERSONALITY = {
  tone: 'direct',
  style: 'no-nonsense',
  traits: ['trustworthy', 'thorough', 'blunt'],
}

// Diesel's message templates - straight to the point
const DIESEL_MESSAGES = {
  clean_report: (vin: string, make: string, model: string) => 
    `Ran CarFidelity on ${make} ${model} (${vin}). Clean title, no accidents, odometer checks out. This one's good to go.`,
  
  salvage_title: (vin: string) =>
    `Problem. VIN ${vin} shows salvage title. Can't list this vehicle. No exceptions.`,
  
  odometer_rollback: (vin: string, lastMileage: number) =>
    `Red flag on ${vin}. Odometer rollback detected. Last reported: ${lastMileage.toLocaleString()} miles. Vehicle blocked.`,
  
  accidents_found: (vin: string, count: number) =>
    `Found ${count} accident${count > 1 ? 's' : ''} on VIN ${vin}. Not a deal-breaker, but renters should know. Report attached.`,
  
  recalls_found: (vin: string, count: number) =>
    `${count} open recall${count > 1 ? 's' : ''} on ${vin}. Get these fixed before listing. Safety first.`,
  
  theft_record: (vin: string) =>
    `Stop. VIN ${vin} flagged for theft record. Cannot proceed. Alerting admin.`,
  
  verification_complete: (make: string, model: string, year: number) =>
    `CarFidelity check complete for ${year} ${make} ${model}. Full report ready.`,
  
  api_error: () =>
    `Hit a snag with the verification service. Will retry. If this keeps happening, check the API keys.`,
}

interface VerificationResult {
  vin: string
  is_clean: boolean
  title_status: string
  accident_count: number
  odometer_rollback: boolean
  theft_record: boolean
  recall_count: number
  last_mileage: number | null
  market_value: { low: number; high: number } | null
  flags: string[]
  diesel_summary: string
}

export async function runCarFidelityCheck(
  vin: string,
  vehicleId?: string,
  userId?: string
): Promise<VerificationResult> {
  const supabase = await createClient()
  
  // Call the VIN check API
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/vin/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vin,
      full_report: true,
      vehicle_id: vehicleId,
      user_id: userId,
    }),
  })

  const data = await response.json()

  if (!data.valid || !data.report) {
    return {
      vin,
      is_clean: false,
      title_status: 'unknown',
      accident_count: 0,
      odometer_rollback: false,
      theft_record: false,
      recall_count: 0,
      last_mileage: null,
      market_value: null,
      flags: ['verification_failed'],
      diesel_summary: DIESEL_MESSAGES.api_error(),
    }
  }

  const report = data.report
  const flags: string[] = []
  let summary = ''

  // Analyze and generate Diesel's summary
  if (report.flags?.has_salvage_title) {
    flags.push('salvage_title')
    summary = DIESEL_MESSAGES.salvage_title(vin)
  } else if (report.flags?.has_odometer_rollback) {
    flags.push('odometer_rollback')
    summary = DIESEL_MESSAGES.odometer_rollback(vin, report.last_reported_mileage || 0)
  } else if (report.flags?.has_theft_record) {
    flags.push('theft_record')
    summary = DIESEL_MESSAGES.theft_record(vin)
  } else if (report.accident_count > 0) {
    flags.push('accidents')
    summary = DIESEL_MESSAGES.accidents_found(vin, report.accident_count)
  } else if (report.recall_count > 0) {
    flags.push('recalls')
    summary = DIESEL_MESSAGES.recalls_found(vin, report.recall_count)
  } else {
    summary = DIESEL_MESSAGES.clean_report(vin, report.make || 'Vehicle', report.model || '')
  }

  return {
    vin,
    is_clean: report.is_clean,
    title_status: report.title_status,
    accident_count: report.accident_count,
    odometer_rollback: report.odometer_rollback,
    theft_record: report.theft_record || false,
    recall_count: report.recall_count,
    last_mileage: report.last_reported_mileage,
    market_value: report.market_value ? { low: report.market_value.low, high: report.market_value.high } : null,
    flags,
    diesel_summary: summary,
  }
}

export async function getDieselStatus(userId: string) {
  const supabase = await createClient()

  const { data: agent } = await supabase
    .from('rd_agents')
    .select('*')
    .eq('user_id', userId)
    .eq('agent_type', 'verification')
    .single()

  if (!agent) {
    return {
      name: 'Diesel',
      status: 'inactive',
      actionsToday: 0,
      lastAction: 'Not configured',
    }
  }

  // Get today's action count
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('rd_agent_log')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', agent.id)
    .gte('created_at', today.toISOString())

  // Get last action
  const { data: lastLog } = await supabase
    .from('rd_agent_log')
    .select('action_summary, created_at')
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return {
    name: agent.custom_name || 'Diesel',
    status: agent.is_active ? 'active' : 'inactive',
    actionsToday: count || 0,
    lastAction: lastLog?.action_summary || 'Ready to run CarFidelity checks',
    lastActionTime: lastLog?.created_at || null,
  }
}

export async function logDieselAction(
  userId: string,
  action: string,
  summary: string,
  inputData: Record<string, unknown>,
  outputData: Record<string, unknown>,
  success: boolean = true,
  errorMessage?: string
) {
  const supabase = await createClient()

  // Get user's Diesel agent
  const { data: agent } = await supabase
    .from('rd_agents')
    .select('id')
    .eq('user_id', userId)
    .eq('agent_type', 'verification')
    .single()

  if (!agent) return

  await supabase.from('rd_agent_log').insert({
    agent_id: agent.id,
    user_id: userId,
    action_type: action,
    action_summary: summary,
    input_data: inputData,
    output_data: outputData,
    model_used: 'carfidelity-api',
    triggered_by: 'user_action',
    success,
    error_message: errorMessage,
  })

  // Update agent stats
  await supabase
    .from('rd_agents')
    .update({
      last_action_at: new Date().toISOString(),
      total_actions_count: agent.id ? supabase.rpc('increment_agent_actions', { agent_id: agent.id }) : 1,
    })
    .eq('id', agent.id)
}

// Generate Diesel's response for different scenarios
export function getDieselResponse(scenario: keyof typeof DIESEL_MESSAGES, ...args: (string | number)[]) {
  const messageFunc = DIESEL_MESSAGES[scenario]
  if (typeof messageFunc === 'function') {
    return (messageFunc as (...args: (string | number)[]) => string)(...args)
  }
  return messageFunc
}

export { DIESEL_PERSONALITY, DIESEL_MESSAGES }
