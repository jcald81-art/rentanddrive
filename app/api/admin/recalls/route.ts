import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select(`
        id,
        make,
        model,
        year,
        vin,
        is_approved,
        host_id,
        last_recall_check,
        recall_severity,
        has_open_recalls,
        host:profiles!vehicles_host_id_fkey (
          full_name
        ),
        recalls:nhtsa_recalls (
          id,
          nhtsa_campaign_id,
          component,
          summary,
          consequence,
          remedy,
          severity,
          is_open,
          recall_date
        )
      `)
      .eq('has_open_recalls', true)
      .order('recall_severity', { ascending: true })

    if (error) {
      console.error('[Admin Recalls API] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const formattedVehicles = vehicles?.map(v => {
      const host = (Array.isArray(v.host) ? v.host[0] : v.host) as { full_name: string } | null
      return {
        ...v,
        host_name: host?.full_name || 'Unknown',
      }
    }) || []

    return NextResponse.json({ vehicles: formattedVehicles })

  } catch (error) {
    console.error('[Admin Recalls API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
