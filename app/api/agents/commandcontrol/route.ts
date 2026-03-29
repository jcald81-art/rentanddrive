import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CommandControlAgent } from '@/lib/agents/commandcontrol'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, data } = body

    const agent = new CommandControlAgent()
    let result

    switch (action) {
      case 'scan_market':
        result = await agent.scanMarket(data.region || 'reno')
        break
      case 'scan_events':
        result = await agent.scanUpcomingEvents()
        break
      case 'scan_competitors':
        result = await agent.scanCompetitorPricing(data.category)
        break
      case 'generate_report':
        result = await agent.generateMarketReport(data.hostId)
        break
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    // Log agent action
    await supabase.from('rd_agent_log').insert({
      agent_name: 'commandcontrol',
      action,
      input_data: data,
      output_data: result,
      status: result?.success ? 'success' : 'error',
      triggered_by: user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[CommandControl API Error]:', error)
    return NextResponse.json(
      { error: 'Failed to execute CommandControl action' },
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

    // Get recent market snapshots
    const { data: snapshots } = await supabase
      .from('competitor_snapshots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    // Get recent agent logs
    const { data: logs } = await supabase
      .from('rd_agent_log')
      .select('*')
      .eq('agent_name', 'commandcontrol')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      snapshots,
      logs,
    })
  } catch (error) {
    console.error('[CommandControl API Error]:', error)
    return NextResponse.json({ error: 'Failed to fetch CommandControl data' }, { status: 500 })
  }
}
