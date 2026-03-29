import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DollarAgent } from '@/lib/agents/dollar'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, data } = body

    const agent = new DollarAgent()
    let result

    switch (action) {
      case 'analyze_vehicle':
        result = await agent.analyzeVehicle(data.vehicleId)
        break
      case 'optimize_fleet':
        result = await agent.optimizeFleetPricing(data.hostId)
        break
      case 'get_recommendation':
        result = await agent.getPriceRecommendation(data.vehicleId, data.startDate, data.endDate)
        break
      case 'apply_suggestion':
        result = await agent.applySuggestion(data.vehicleId, data.newPrice)
        break
      case 'scan_competitors':
        result = await agent.scanCompetitors(data.vehicleId)
        break
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    // Log agent action
    await supabase.from('rd_agent_log').insert({
      agent_name: 'dollar',
      action,
      input_data: data,
      output_data: result,
      status: result?.success ? 'success' : 'error',
      triggered_by: user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Dollar API Error]:', error)
    return NextResponse.json(
      { error: 'Failed to execute Dollar action' },
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
      // Get pricing history for specific vehicle
      const { data: history } = await supabase
        .from('pricing_history')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })
        .limit(30)

      return NextResponse.json({ history })
    }

    // Get overall Dollar agent stats
    const { data: logs } = await supabase
      .from('rd_agent_log')
      .select('*')
      .eq('agent_name', 'dollar')
      .order('created_at', { ascending: false })
      .limit(20)

    const { data: recentChanges } = await supabase
      .from('pricing_history')
      .select('*, vehicles(make, model, year)')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      logs,
      recentChanges,
    })
  } catch (error) {
    console.error('[Dollar API Error]:', error)
    return NextResponse.json({ error: 'Failed to fetch Dollar data' }, { status: 500 })
  }
}
