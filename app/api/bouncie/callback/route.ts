import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Bouncie OAuth callback handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('[Bouncie Callback] OAuth error:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/eagle?error=${encodeURIComponent(error)}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/eagle?error=missing_code`
      )
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.bouncie.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.BOUNCIE_CLIENT_ID!,
        client_secret: process.env.BOUNCIE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/bouncie/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('[Bouncie Callback] Token exchange failed:', errorText)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/eagle?error=token_exchange_failed`
      )
    }

    const tokens = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokens

    // Store tokens securely
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?redirect=/dashboard/admin/eagle`
      )
    }

    // Save to platform_settings
    await supabase.from('platform_settings').upsert({
      key: 'bouncie_access_token',
      value: access_token,
      updated_by: user.id,
    }, { onConflict: 'key' })

    await supabase.from('platform_settings').upsert({
      key: 'bouncie_refresh_token',
      value: refresh_token,
      updated_by: user.id,
    }, { onConflict: 'key' })

    await supabase.from('platform_settings').upsert({
      key: 'bouncie_token_expires_at',
      value: new Date(Date.now() + expires_in * 1000).toISOString(),
      updated_by: user.id,
    }, { onConflict: 'key' })

    // Sync vehicles from Bouncie
    try {
      const vehiclesResponse = await fetch('https://api.bouncie.com/v1/vehicles', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      })

      if (vehiclesResponse.ok) {
        const vehicles = await vehiclesResponse.json()
        
        for (const vehicle of vehicles) {
          // Create or update bouncie_devices
          await supabase.from('bouncie_devices').upsert({
            imei: vehicle.imei,
            nickname: vehicle.nickName || `${vehicle.make} ${vehicle.model}`,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            vin: vehicle.vin,
            is_active: true,
            last_seen_at: new Date().toISOString(),
          }, { onConflict: 'imei' })
        }

        console.log(`[Bouncie Callback] Synced ${vehicles.length} vehicles`)
      }
    } catch (syncError) {
      console.error('[Bouncie Callback] Vehicle sync failed:', syncError)
    }

    // Log the connection
    await supabase.from('platform_events').insert({
      event_type: 'bouncie_connected',
      event_data: { user_id: user.id, synced_at: new Date().toISOString() },
    })

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/eagle?success=connected`
    )
  } catch (error) {
    console.error('[Bouncie Callback] Error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/eagle?error=internal_error`
    )
  }
}
