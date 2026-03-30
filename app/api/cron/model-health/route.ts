import { NextResponse } from 'next/server'
import { checkAllModelHealth } from '@/lib/ai-router'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Runs every 6 hours to check AI model health
// Vercel cron: 0 */6 * * *
export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await checkAllModelHealth()
    
    // Count available vs unavailable
    const available = Object.values(results).filter(r => r.available).length
    const total = Object.keys(results).length
    
    // Log summary to agent_logs
    await supabase.from('agent_logs').insert({
      agent_name: 'model_health_check',
      action_type: 'health_check',
      input_data: { timestamp: new Date().toISOString() },
      output_data: { 
        results,
        summary: `${available}/${total} models available`
      },
      status: 'success',
    })

    // Reset daily costs at midnight UTC
    const now = new Date()
    if (now.getUTCHours() === 0) {
      await supabase
        .from('model_status')
        .update({ 
          cost_today_cents: 0,
          cost_reset_at: now.toISOString(),
        })
        .neq('id', '00000000-0000-0000-0000-000000000000') // Update all
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary: `${available}/${total} models available`,
      results,
    })
  } catch (error) {
    console.error('Model health check failed:', error)
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
    }, { status: 500 })
  }
}
