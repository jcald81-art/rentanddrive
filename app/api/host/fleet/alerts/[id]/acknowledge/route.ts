import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify alert belongs to host's vehicle
    const { data: alert } = await supabase
      .from('fleet_alerts')
      .select('id, vehicle_id, vehicles!inner(host_id)')
      .eq('id', id)
      .single()

    if (!alert || (alert.vehicles as any)?.host_id !== user.id) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    // Acknowledge the alert
    const { error } = await supabase
      .from('fleet_alerts')
      .update({
        is_acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user.id,
      })
      .eq('id', id)

    if (error) {
      console.error('Error acknowledging alert:', error)
      return NextResponse.json({ error: 'Failed to acknowledge alert' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Alert acknowledge error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
