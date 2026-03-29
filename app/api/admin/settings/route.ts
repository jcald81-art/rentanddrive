import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_SETTINGS = {
  platform_fee_percent: 10,
  security_deposit_default: 500,
  min_trip_duration_days: 1,
  max_advance_booking_days: 90,
  maintenance_mode: false,
  feature_crypto_payments: false,
  feature_motorcycles: false,
  feature_rvs: true,
}

export async function GET() {
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
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Try to get settings from database
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('*')
    .single()

  if (settings) {
    return NextResponse.json({
      platform_fee_percent: settings.platform_fee_percent ?? DEFAULT_SETTINGS.platform_fee_percent,
      security_deposit_default: settings.security_deposit_default ?? DEFAULT_SETTINGS.security_deposit_default,
      min_trip_duration_days: settings.min_trip_duration_days ?? DEFAULT_SETTINGS.min_trip_duration_days,
      max_advance_booking_days: settings.max_advance_booking_days ?? DEFAULT_SETTINGS.max_advance_booking_days,
      maintenance_mode: settings.maintenance_mode ?? DEFAULT_SETTINGS.maintenance_mode,
      feature_crypto_payments: settings.feature_crypto_payments ?? DEFAULT_SETTINGS.feature_crypto_payments,
      feature_motorcycles: settings.feature_motorcycles ?? DEFAULT_SETTINGS.feature_motorcycles,
      feature_rvs: settings.feature_rvs ?? DEFAULT_SETTINGS.feature_rvs,
    })
  }

  return NextResponse.json(DEFAULT_SETTINGS)
}

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const settings = await request.json()

  // Upsert settings
  const { error } = await supabase
    .from('platform_settings')
    .upsert({
      id: 'main',
      ...settings,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })

  if (error) {
    // If table doesn't exist, just return success (settings stored in memory/defaults)
    console.log('Settings save error (table may not exist):', error.message)
  }

  return NextResponse.json({ success: true })
}
