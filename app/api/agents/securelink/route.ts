import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SecureLinkAgent } from '@/lib/agents/securelink'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, data } = body

    const agent = new SecureLinkAgent()
    let result

    switch (action) {
      case 'send_booking_confirmation':
        result = await agent.sendBookingConfirmation(data.bookingId)
        break
      case 'send_reminder':
        result = await agent.sendReminder(data.bookingId, data.type)
        break
      case 'send_review_request':
        result = await agent.sendReviewRequest(data.bookingId)
        break
      case 'send_urgent_alert':
        result = await agent.sendUrgentAlert(data.userId, data.message, data.priority)
        break
      case 'send_custom':
        result = await agent.sendCustomMessage(data.userId, data.subject, data.body, data.channels)
        break
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    // Log agent action
    await supabase.from('rd_agent_log').insert({
      agent_name: 'securelink',
      action,
      input_data: data,
      output_data: result,
      status: result?.success ? 'success' : 'error',
      triggered_by: user.id,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[SecureLink API Error]:', error)
    return NextResponse.json(
      { error: 'Failed to execute SecureLink action' },
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

    // Get recent SecureLink activity
    const { data: logs } = await supabase
      .from('rd_agent_log')
      .select('*')
      .eq('agent_name', 'securelink')
      .order('created_at', { ascending: false })
      .limit(50)

    // Get message stats
    const { data: stats } = await supabase
      .from('rd_agent_log')
      .select('status')
      .eq('agent_name', 'securelink')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const successCount = stats?.filter(s => s.status === 'success').length || 0
    const errorCount = stats?.filter(s => s.status === 'error').length || 0

    return NextResponse.json({
      logs,
      stats: {
        last24h: {
          total: (stats?.length || 0),
          success: successCount,
          errors: errorCount,
          rate: stats?.length ? (successCount / stats.length * 100).toFixed(1) : '0',
        }
      }
    })
  } catch (error) {
    console.error('[SecureLink API Error]:', error)
    return NextResponse.json({ error: 'Failed to fetch SecureLink data' }, { status: 500 })
  }
}
