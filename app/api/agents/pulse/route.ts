import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PulseAgent } from '@/lib/agents/pulse'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, data } = body

    const agent = new PulseAgent()
    let result

    switch (action) {
      case 'analyze_vehicle':
        result = await agent.analyzeVehicleHealth(data.vehicleId)
        break
      case 'analyze_fleet':
        result = await agent.analyzeFleetHealth(data.hostId)
        break
      case 'predict_maintenance':
        result = await agent.predictMaintenance(data.vehicleId)
        break
      case 'get_efficiency':
        result = await agent.getEfficiencyReport(data.vehicleId)
        break
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    // Log agent action
    await supabase.from('rd_agent_log').insert({
      agent_name: 'pulse',
      action,
      input_data: data,
      output_data: result,
      status: result?.success ? 'success' : 'error',
      triggered_by: user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Pulse API Error]:', error)
    return NextResponse.json(
      { error: 'Failed to execute Pulse action' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')

    if (vehicleId) {
      // Get telemetry for specific vehicle
      const { data: telemetry } = await supabase
        .from('fleet_telemetry')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('recorded_at', { ascending: false })
        .limit(100)

      return NextResponse.json({ telemetry })
    }

    // Get fleet health overview
    const { data: alerts } = await supabase
      .from('fleet_alerts')
      .select('*, vehicles(make, model, year, license_plate)')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(20)

    const { data: logs } = await supabase
      .from('rd_agent_log')
      .select('*')
      .eq('agent_name', 'pulse')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      alerts,
      logs,
    })
  } catch (error) {
    console.error('[Pulse API Error]:', error)
    return NextResponse.json({ error: 'Failed to fetch Pulse data' }, { status: 500 })
  }
}
