import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import twilio from 'twilio'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

const SYSTEM_PROMPT = `You are R&D, the Fleet Monitoring AI Agent for Rent and Drive LLC, a premium car rental service in Reno/Lake Tahoe Nevada.

Your role is to analyze vehicle alerts from GPS tracking (Bouncie) and determine the appropriate response. You protect the fleet and ensure renter safety.

For each alert, provide a JSON response with:
{
  "urgency": "immediate" | "soon" | "monitor",
  "actions": ["action1", "action2"],
  "host_message": "SMS to send to vehicle host (under 160 chars)",
  "renter_message": "SMS to send to active renter if applicable (under 160 chars, null if not needed)",
  "internal_notes": "Notes for the operations team",
  "escalate_to_human": true/false
}

Alert types and typical responses:
- unauthorized_use: CRITICAL - Vehicle moving without booking. Contact host immediately, consider remote disable.
- geofence_exit: Vehicle left service area. Check if renter notified us, may need to contact them.
- speeding: Over 90mph. Document for insurance, warn renter if repeated.
- harsh_driving: Multiple hard brakes/accelerations. Note for vehicle inspection.
- low_battery: Battery under 12V. Schedule maintenance, warn host.
- mil_on: Check engine light. Critical - may need to arrange vehicle swap for renter.
- device_disconnect: GPS tracker disconnected. Could be tampering - investigate.

Be decisive but fair. Renters deserve the benefit of the doubt once, but repeated issues require action.`

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const { alert_id } = await request.json()

    if (!alert_id) {
      return NextResponse.json({ error: 'alert_id required' }, { status: 400 })
    }

    // Fetch the alert with vehicle and booking context
    const { data: alert, error: alertError } = await supabase
      .from('bouncie_alerts')
      .select(`
        *,
        vehicle:vehicles(id, make, model, year, host_id),
        device:bouncie_devices(imei, nickname)
      `)
      .eq('id', alert_id)
      .single()

    if (alertError || !alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    // Get host info
    const { data: host } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', alert.vehicle?.host_id)
      .single()

    // Check for active booking
    const { data: activeBooking } = await supabase
      .from('bookings')
      .select(`
        id,
        start_date,
        end_date,
        renter:profiles!bookings_renter_id_fkey(full_name, phone)
      `)
      .eq('vehicle_id', alert.vehicle_id)
      .eq('status', 'active')
      .single()

    // Get recent alerts for this vehicle (pattern detection)
    const { data: recentAlerts } = await supabase
      .from('bouncie_alerts')
      .select('alert_type, severity, created_at')
      .eq('vehicle_id', alert.vehicle_id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    // Build context for Claude
    const context = {
      alert: {
        type: alert.alert_type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        data: alert.data,
        created_at: alert.created_at,
      },
      vehicle: alert.vehicle ? {
        name: `${alert.vehicle.year} ${alert.vehicle.make} ${alert.vehicle.model}`,
      } : null,
      host: host ? {
        name: host.full_name,
        has_phone: !!host.phone,
      } : null,
      active_booking: activeBooking ? {
        renter_name: activeBooking.renter?.full_name,
        has_renter_phone: !!activeBooking.renter?.phone,
        start_date: activeBooking.start_date,
        end_date: activeBooking.end_date,
      } : null,
      recent_alerts_summary: recentAlerts?.map(a => `${a.alert_type} (${a.severity})`).join(', ') || 'none',
    }

    // Generate response using Claude
    const { text: responseText, usage } = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: SYSTEM_PROMPT,
      prompt: `Analyze this fleet alert and determine the appropriate response:\n\n${JSON.stringify(context, null, 2)}`,
    })

    // Parse the response
    let agentResponse: {
      urgency: string
      actions: string[]
      host_message: string | null
      renter_message: string | null
      internal_notes: string
      escalate_to_human: boolean
    }

    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      agentResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        urgency: 'monitor',
        actions: ['Review manually'],
        host_message: null,
        renter_message: null,
        internal_notes: responseText,
        escalate_to_human: true,
      }
    } catch {
      agentResponse = {
        urgency: 'monitor',
        actions: ['Review manually - parsing failed'],
        host_message: null,
        renter_message: null,
        internal_notes: responseText,
        escalate_to_human: true,
      }
    }

    // Execute actions
    const executedActions: string[] = []

    // Send SMS to host if needed
    if (agentResponse.host_message && host?.phone && twilioClient) {
      try {
        await twilioClient.messages.create({
          body: agentResponse.host_message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: host.phone,
        })
        executedActions.push('host_sms_sent')

        // Log the message
        await supabase.from('renter_messages').insert({
          booking_id: activeBooking?.id || null,
          direction: 'out',
          channel: 'sms',
          message_body: agentResponse.host_message,
          sent_at: new Date().toISOString(),
          template_used: 'fleet_alert_host',
        })
      } catch (smsError) {
        console.error('[v0] Failed to send host SMS:', smsError)
        executedActions.push('host_sms_failed')
      }
    }

    // Send SMS to renter if needed
    if (agentResponse.renter_message && activeBooking?.renter?.phone && twilioClient) {
      try {
        await twilioClient.messages.create({
          body: agentResponse.renter_message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: activeBooking.renter.phone,
        })
        executedActions.push('renter_sms_sent')

        await supabase.from('renter_messages').insert({
          booking_id: activeBooking.id,
          direction: 'out',
          channel: 'sms',
          message_body: agentResponse.renter_message,
          sent_at: new Date().toISOString(),
          template_used: 'fleet_alert_renter',
        })
      } catch (smsError) {
        console.error('[v0] Failed to send renter SMS:', smsError)
        executedActions.push('renter_sms_failed')
      }
    }

    // Update the alert with agent response
    await supabase
      .from('bouncie_alerts')
      .update({
        agent_response: JSON.stringify(agentResponse),
        is_acknowledged: !agentResponse.escalate_to_human,
        acknowledged_at: agentResponse.escalate_to_human ? null : new Date().toISOString(),
      })
      .eq('id', alert_id)

    // Log to agent_logs
    await supabase.from('agent_logs').insert({
      agent_name: 'fleet_monitor',
      action_type: 'alert_response',
      input_data: context,
      output_data: {
        response: agentResponse,
        executed_actions: executedActions,
      },
      model_used: 'claude-sonnet-4-20250514',
      tokens_used: usage?.totalTokens || 0,
      status: 'completed',
    })

    return NextResponse.json({
      success: true,
      alert_id,
      urgency: agentResponse.urgency,
      actions: agentResponse.actions,
      executed: executedActions,
      escalate: agentResponse.escalate_to_human,
    })

  } catch (error) {
    console.error('[v0] Fleet monitor agent error:', error)
    return NextResponse.json({ error: 'Agent processing failed' }, { status: 500 })
  }
}

// GET: View recent alerts and agent responses
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const vehicleId = searchParams.get('vehicle_id')
  const severity = searchParams.get('severity')
  const unacknowledged = searchParams.get('unacknowledged') === 'true'

  let query = supabase
    .from('bouncie_alerts')
    .select(`
      *,
      vehicle:vehicles(make, model, year)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId)
  }
  if (severity) {
    query = query.eq('severity', severity)
  }
  if (unacknowledged) {
    query = query.eq('is_acknowledged', false)
  }

  const { data: alerts, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ alerts })
}
