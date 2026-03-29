import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ host: null, alertCount: 0 })
    }

    // Get host profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, lab_level, lab_xp, role')
      .eq('id', user.id)
      .single()

    // Get active alerts count
    const { count: alertCount } = await supabase
      .from('fleet_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('host_id', user.id)
      .eq('is_acknowledged', false)

    return NextResponse.json({
      host: profile ? {
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        lab_level: profile.lab_level || 1,
        lab_xp: profile.lab_xp || 0,
        active_alerts: alertCount || 0,
        is_admin: profile.role === 'admin',
      } : null,
      alertCount: alertCount || 0,
    })
  } catch (error) {
    console.error('Error fetching host data:', error)
    return NextResponse.json({ host: null, alertCount: 0 })
  }
}
