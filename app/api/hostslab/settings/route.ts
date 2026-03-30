import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get notification preferences
    const { data: notifPrefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get R&D agents for renaming
    const { data: agents } = await supabase
      .from('rd_agents')
      .select('*')
      .eq('host_id', user.id)

    // Get Eagle devices
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, make, model, year, bouncie_imei, bouncie_device_id')
      .eq('host_id', user.id)

    // Get payout settings
    const { data: payoutSettings } = await supabase
      .from('host_payout_settings')
      .select('*')
      .eq('host_id', user.id)
      .single()

    // Get lab theme preferences
    const { data: themePrefs } = await supabase
      .from('lab_preferences')
      .select('*')
      .eq('host_id', user.id)
      .single()

    return NextResponse.json({
      profile,
      notificationPrefs: notifPrefs || {
        email_bookings: true,
        email_reviews: true,
        email_earnings: true,
        email_alerts: true,
        sms_bookings: true,
        sms_urgent: true,
        push_enabled: false,
      },
      agents: agents || [],
      eagleDevices: vehicles?.filter(v => v.bouncie_imei) || [],
      payoutSettings: payoutSettings || {
        payout_method: 'stripe',
        payout_schedule: 'weekly',
        minimum_payout_cents: 2500,
      },
      themePrefs: themePrefs || {
        theme: 'system',
        sidebar_collapsed: false,
        show_animations: true,
      },
    })
  } catch (error) {
    console.error('Lab controls error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
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
    const { type, data } = body

    switch (type) {
      case 'profile':
        await supabase
          .from('profiles')
          .update(data)
          .eq('id', user.id)
        break

      case 'notifications':
        await supabase
          .from('notification_preferences')
          .upsert({ user_id: user.id, ...data })
        break

      case 'agent':
        await supabase
          .from('rd_agents')
          .update({ custom_name: data.customName })
          .eq('host_id', user.id)
          .eq('agent_type', data.agentType)
        break

      case 'payout':
        await supabase
          .from('host_payout_settings')
          .upsert({ host_id: user.id, ...data })
        break

      case 'theme':
        await supabase
          .from('lab_preferences')
          .upsert({ host_id: user.id, ...data })
        break

      default:
        return NextResponse.json({ error: 'Invalid update type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
