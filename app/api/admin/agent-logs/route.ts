import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  // Verify user is authenticated and is admin
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const agent = searchParams.get('agent')
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabase
    .from('agent_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (agent) {
    query = query.eq('agent_name', agent)
  }

  const { data: logs, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }

  // Get summary stats
  const { data: stats } = await supabase
    .from('agent_logs')
    .select('agent_name, status, tokens_used, cost_cents')

  const summary = {
    total_calls: stats?.length || 0,
    total_tokens: stats?.reduce((sum, l) => sum + (l.tokens_used || 0), 0) || 0,
    total_cost_cents: stats?.reduce((sum, l) => sum + (l.cost_cents || 0), 0) || 0,
    success_count: stats?.filter(l => l.status === 'success').length || 0,
    error_count: stats?.filter(l => l.status === 'error').length || 0,
  }

  return NextResponse.json({ logs, summary })
}
