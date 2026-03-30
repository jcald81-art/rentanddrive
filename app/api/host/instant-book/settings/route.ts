import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch host settings
    const { data: settings } = await supabase
      .from('host_settings')
      .select('*')
      .eq('host_id', user.id)
      .single()

    // Fetch vehicle-specific overrides
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, make, model, year, instant_book_enabled, instant_book_threshold')
      .eq('host_id', user.id)

    return NextResponse.json({
      enabled: settings?.instant_book_enabled ?? true,
      threshold: settings?.instant_book_threshold ?? 55,
      criteria: settings?.instant_book_criteria ?? {
        idVerified: true,
        noIncidents: true,
        completedRental: true,
        accountAge: true,
        rating: true,
        profilePhoto: false,
      },
      vehicles: vehicles || [],
    })
  } catch (error) {
    console.error('[Instant Book Settings GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { enabled, threshold, criteria, vehicleOverrides } = await request.json()

    // Upsert host settings
    const { error: settingsError } = await supabase
      .from('host_settings')
      .upsert({
        host_id: user.id,
        instant_book_enabled: enabled,
        instant_book_threshold: threshold,
        instant_book_criteria: criteria,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'host_id',
      })

    if (settingsError) {
      console.error('[Instant Book Settings] Settings error:', settingsError)
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    // Update vehicle-specific overrides
    if (vehicleOverrides && typeof vehicleOverrides === 'object') {
      for (const [vehicleId, overrideThreshold] of Object.entries(vehicleOverrides)) {
        await supabase
          .from('vehicles')
          .update({
            instant_book_threshold: overrideThreshold as number,
            updated_at: new Date().toISOString(),
          })
          .eq('id', vehicleId)
          .eq('host_id', user.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Instant Book Settings POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
