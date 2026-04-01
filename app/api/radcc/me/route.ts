import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get host profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, stripe_onboarding_complete')
      .eq('id', user.id)
      .single()

    // Get host's vehicles count
    const { count: vehicleCount } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', user.id)

    // Get unread alerts count
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id')
      .eq('host_id', user.id)

    const vehicleIds = vehicles?.map(v => v.id) || []

    let alertCount = 0
    if (vehicleIds.length > 0) {
      const { count } = await supabase
        .from('fleet_alerts')
        .select('id', { count: 'exact', head: true })
        .in('vehicle_id', vehicleIds)
        .eq('is_resolved', false)
      alertCount = count || 0
    }

    return NextResponse.json({
      host: {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || 'Host',
        avatar_url: profile?.avatar_url,
        role: profile?.role || 'host',
        stripe_onboarding_complete: profile?.stripe_onboarding_complete || false,
        vehicle_count: vehicleCount || 0,
      },
      alertCount,
    })
  } catch (error) {
    console.error('RADCC /me error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
