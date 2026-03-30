import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runCarFidelityCheck, logDieselAction, getDieselStatus } from '@/lib/agents/diesel'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, vin, vehicle_id } = body

    switch (action) {
      case 'run_carfidelity': {
        if (!vin) {
          return NextResponse.json({ error: 'VIN required' }, { status: 400 })
        }

        const result = await runCarFidelityCheck(vin, vehicle_id, user.id)

        // Log the action
        await logDieselAction(
          user.id,
          'carfidelity_check',
          result.diesel_summary,
          { vin, vehicle_id },
          result,
          result.is_clean || result.flags.length === 0
        )

        return NextResponse.json({
          success: true,
          result,
          message: result.diesel_summary,
        })
      }

      case 'get_status': {
        const status = await getDieselStatus(user.id)
        return NextResponse.json(status)
      }

      case 'get_reports': {
        // Get user's recent CarFidelity reports
        const { data: reports } = await supabase
          .from('vin_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)

        return NextResponse.json({ reports: reports || [] })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Diesel Error]:', error)
    return NextResponse.json(
      { error: 'Diesel encountered an error. Check the logs.' },
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

    const status = await getDieselStatus(user.id)
    return NextResponse.json(status)
  } catch (error) {
    console.error('[Diesel Status Error]:', error)
    return NextResponse.json(
      { error: 'Failed to get Diesel status' },
      { status: 500 }
    )
  }
}
