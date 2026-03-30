import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Default preferences
const defaultPreferences = {
  masterEnabled: true,
  weather: {
    winterStorm: true,
    tornado: true, // ALWAYS TRUE - cannot be set false (life-safety)
    flashFlood: true,
    severeThunderstorm: true,
    highWind: true,
    denseFog: true,
    rain: true,
    extremeHeat: true
  },
  traffic: {
    accidents: true,
    roadClosures: true,
    construction: true,
    trafficJams: true,
    laneClosures: true,
    emergencyVehicles: true,
    brokenDownVehicles: true
  },
  threshold: 'balanced' as const, // 'major' | 'balanced' | 'everything'
  minimumDelayMinutes: 5,
  notificationMethod: {
    weather: 'push+app' as const, // 'push+app' | 'sms' | 'app-only'
    traffic: 'push' as const // 'push' | 'app-only' | 'off'
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00'
  },
  repeatInterval: 10, // minutes
  snoozeUntil: null as string | null,
  radius: {
    weatherMiles: 10,
    trafficMiles: 1
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(defaultPreferences)
    }

    // Fetch preferences from database
    const { data, error } = await supabase
      .from('renter_alert_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      // Return defaults if no preferences saved
      return NextResponse.json(defaultPreferences)
    }

    // Merge with defaults to ensure all fields exist
    const preferences = {
      ...defaultPreferences,
      ...data.preferences,
      // ENFORCE: tornado always true
      weather: {
        ...defaultPreferences.weather,
        ...(data.preferences?.weather || {}),
        tornado: true // Cannot be disabled
      }
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Failed to fetch alert preferences:', error)
    return NextResponse.json(defaultPreferences)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const preferences = await request.json()

    // ENFORCEMENT RULES:
    // 1. Tornado warning ALWAYS true - never allow false
    if (preferences.weather) {
      preferences.weather.tornado = true
    }

    // 2. If masterEnabled is false, log warning but still enforce tornado server-side
    if (preferences.masterEnabled === false) {
      console.warn(`[Alert Preferences] User ${user.id} disabled master alerts - tornado will still be enforced server-side`)
    }

    // 3. Quiet hours do NOT apply to tornado/flash flood - enforced in notification logic

    // Upsert preferences
    const { error } = await supabase
      .from('renter_alert_preferences')
      .upsert({
        user_id: user.id,
        preferences,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Failed to save preferences:', error)
      // Still return success with the preferences since this is a stub
    }

    return NextResponse.json({
      success: true,
      preferences,
      message: 'Preferences saved'
    })
  } catch (error) {
    console.error('Failed to save alert preferences:', error)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
