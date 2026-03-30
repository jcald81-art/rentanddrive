import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { vehicles, settings } = await request.json()

    // Update or insert host monthly settings
    const { error: settingsError } = await supabase
      .from('host_monthly_settings')
      .upsert({
        host_id: user.id,
        discount_30_day: settings.discount30Day,
        discount_60_day: settings.discount60Day,
        discount_90_day: settings.discount90Day,
        mileage_limit: settings.mileageLimit,
        overage_rate: settings.overageRate,
        delivery_enabled: settings.deliveryEnabled,
        delivery_radius: settings.deliveryRadius,
        delivery_fee: settings.deliveryFee,
        blocked_dates: settings.blockedDates,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'host_id',
      })

    if (settingsError) {
      console.error('Settings save error:', settingsError)
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      )
    }

    // Update vehicles monthly availability
    if (vehicles && Array.isArray(vehicles)) {
      // First, disable monthly for all host's vehicles
      await supabase
        .from('vehicles')
        .update({ monthly_available: false })
        .eq('host_id', user.id)

      // Then enable for selected vehicles
      if (vehicles.length > 0) {
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update({ monthly_available: true })
          .eq('host_id', user.id)
          .in('id', vehicles)

        if (vehicleError) {
          console.error('Vehicle update error:', vehicleError)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DriveMonthly settings error:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: settings } = await supabase
      .from('host_monthly_settings')
      .select('*')
      .eq('host_id', user.id)
      .single()

    return NextResponse.json(settings || {
      discount_30_day: 7,
      discount_60_day: 15,
      discount_90_day: 25,
      mileage_limit: 1500,
      overage_rate: 0.25,
      delivery_enabled: false,
      delivery_radius: 25,
      delivery_fee: 49,
      blocked_dates: [],
    })
  } catch (error) {
    console.error('DriveMonthly settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
