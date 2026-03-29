import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    // Get or create host agents
    let { data: agents } = await supabase
      .from('rd_agents')
      .select('*')
      .eq('host_id', user.id)

    // If no agents exist, create them
    if (!agents || agents.length === 0) {
      const defaultAgents = [
        { host_id: user.id, agent_type: 'securelink', custom_name: null, is_active: true },
        { host_id: user.id, agent_type: 'dollar', custom_name: null, is_active: true },
        { host_id: user.id, agent_type: 'shield', custom_name: null, is_active: true },
        { host_id: user.id, agent_type: 'commandcontrol', custom_name: null, is_active: true },
        { host_id: user.id, agent_type: 'pulse', custom_name: null, is_active: true },
        { host_id: user.id, agent_type: 'funtime', custom_name: null, is_active: true },
      ]
      
      const { data: newAgents } = await supabase
        .from('rd_agents')
        .insert(defaultAgents)
        .select()
      
      agents = newAgents
    }

    // Get agent logs for today
    const { data: todayLogs } = await supabase
      .from('rd_agent_log')
      .select('*')
      .eq('host_id', user.id)
      .gte('created_at', startOfDay)
      .order('created_at', { ascending: false })

    // Get agent logs for this month (for costs)
    const { data: monthLogs } = await supabase
      .from('rd_agent_log')
      .select('agent_type, cost_cents, tokens_used')
      .eq('host_id', user.id)
      .gte('created_at', startOfMonth)

    // Calculate stats per agent
    const agentStats = agents?.map(agent => {
      const agentTodayLogs = todayLogs?.filter(l => l.agent_type === agent.agent_type) || []
      const agentMonthLogs = monthLogs?.filter(l => l.agent_type === agent.agent_type) || []
      
      const actionsToday = agentTodayLogs.length
      const costToday = agentTodayLogs.reduce((sum, l) => sum + (l.cost_cents || 0), 0)
      const costThisMonth = agentMonthLogs.reduce((sum, l) => sum + (l.cost_cents || 0), 0)
      const lastAction = agentTodayLogs[0]

      return {
        ...agent,
        actionsToday,
        costToday,
        costThisMonth,
        lastAction: lastAction ? {
          description: lastAction.action_description,
          timestamp: lastAction.created_at,
          model: lastAction.model_used,
        } : null,
      }
    }) || []

    // Total costs
    const totalCostThisMonth = monthLogs?.reduce((sum, l) => sum + (l.cost_cents || 0), 0) || 0

    // Get booking count for cost per booking ratio
    const { count: bookingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', user.id)
      .gte('created_at', startOfMonth)

    return NextResponse.json({
      agents: agentStats,
      recentActivity: todayLogs?.slice(0, 20) || [],
      stats: {
        totalCostThisMonth,
        bookingsThisMonth: bookingCount || 0,
        costPerBooking: bookingCount ? Math.round(totalCostThisMonth / bookingCount) : 0,
      },
    })
  } catch (error) {
    console.error('RD Navigator error:', error)
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { agentType, customName, isActive } = body

    const updates: Record<string, unknown> = {}
    if (customName !== undefined) updates.custom_name = customName
    if (isActive !== undefined) updates.is_active = isActive

    const { data, error } = await supabase
      .from('rd_agents')
      .update(updates)
      .eq('host_id', user.id)
      .eq('agent_type', agentType)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ agent: data })
  } catch (error) {
    console.error('Update agent error:', error)
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
  }
}
