import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Smart Filtering Logic:
// - Major incident (road closure, accident with major delay): always notify if type enabled
// - Moderate (5-10 min jam): notify if threshold is "balanced" or "everything"
// - Minor (<5 min): notify only if threshold is "everything"
// - Construction: notify on first encounter, not on every location update
// - Same incident ID seen before: check repeatInterval before re-notifying
// - Tornado/flood from weather: never filtered by traffic preferences (handled separately)

// Track recently notified incidents per rental (in production, use Redis)
const recentNotifications = new Map<string, Map<string, number>>()

interface Incident {
  id: string
  type: string
  severity: 'minor' | 'moderate' | 'major' | 'closed'
  delayMinutes: number
}

interface Preferences {
  masterEnabled: boolean
  traffic: Record<string, boolean>
  threshold: 'major' | 'balanced' | 'everything'
  minimumDelayMinutes: number
  notificationMethod: { traffic: 'push' | 'app-only' | 'off' }
  quietHours: { enabled: boolean; startTime: string; endTime: string }
  repeatInterval: number
  snoozeUntil: string | null
  radius: { trafficMiles: number }
}

export async function POST(request: NextRequest) {
  try {
    const { rentalId, vehicleId, renterId, lat, lng, timestamp } = await request.json()

    if (!rentalId || !renterId || !lat || !lng) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Fetch renter's alert preferences
    const { data: prefData } = await supabase
      .from('renter_alert_preferences')
      .select('preferences')
      .eq('user_id', renterId)
      .single()

    const preferences: Preferences = prefData?.preferences || {
      masterEnabled: true,
      traffic: { accidents: true, roadClosures: true, construction: true, trafficJams: true },
      threshold: 'balanced',
      minimumDelayMinutes: 5,
      notificationMethod: { traffic: 'push' },
      quietHours: { enabled: false, startTime: '22:00', endTime: '07:00' },
      repeatInterval: 10,
      snoozeUntil: null,
      radius: { trafficMiles: 1 }
    }

    // 2. Check if alerts are master enabled
    if (!preferences.masterEnabled) {
      return NextResponse.json({ 
        message: 'Alerts disabled by user',
        newIncidents: [],
        notificationsSent: [],
        skippedReason: ['master_disabled']
      })
    }

    // 3. Check if currently in snooze period
    if (preferences.snoozeUntil && new Date(preferences.snoozeUntil) > new Date()) {
      return NextResponse.json({
        message: 'Alerts snoozed',
        newIncidents: [],
        notificationsSent: [],
        skippedReason: ['snoozed']
      })
    }

    // 4. Fetch traffic incidents
    const incidentsRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/traffic/incidents?lat=${lat}&lng=${lng}&radiusMiles=${preferences.radius.trafficMiles}`,
      { cache: 'no-store' }
    )
    const incidentsData = await incidentsRes.json()
    const incidents: Incident[] = incidentsData.incidents || []

    // 5. Get previously seen incidents for this rental
    if (!recentNotifications.has(rentalId)) {
      recentNotifications.set(rentalId, new Map())
    }
    const seenIncidents = recentNotifications.get(rentalId)!

    const newIncidents: Incident[] = []
    const notificationsSent: string[] = []
    const filtered: string[] = []
    const skippedReason: string[] = []

    // 6. Check quiet hours
    const inQuietHours = isInQuietHours(preferences.quietHours)

    // 7. Process each incident
    for (const incident of incidents) {
      // a. Check if incident type is enabled
      const typeKey = getTypeKey(incident.type)
      if (typeKey && !preferences.traffic[typeKey]) {
        filtered.push(`${incident.id}: type_disabled (${incident.type})`)
        continue
      }

      // b. Check if delay meets minimum threshold
      if (incident.delayMinutes < preferences.minimumDelayMinutes && incident.severity !== 'closed') {
        filtered.push(`${incident.id}: below_delay_threshold (${incident.delayMinutes} < ${preferences.minimumDelayMinutes})`)
        continue
      }

      // c. Check threshold setting
      if (!meetsThreshold(incident, preferences.threshold)) {
        filtered.push(`${incident.id}: below_severity_threshold`)
        continue
      }

      // d. Check repeat interval
      const lastNotified = seenIncidents.get(incident.id)
      if (lastNotified && Date.now() - lastNotified < preferences.repeatInterval * 60000) {
        filtered.push(`${incident.id}: repeat_interval (${preferences.repeatInterval}min)`)
        continue
      }

      // This is a new incident that should trigger notification
      newIncidents.push(incident)

      // e. Determine notification method based on quiet hours
      const notifyMethod = inQuietHours ? 'app-only' : preferences.notificationMethod.traffic

      if (notifyMethod !== 'off') {
        // Fire notification (stub - integrate with push/notification service)
        await sendNotification(renterId, incident, notifyMethod)
        notificationsSent.push(incident.id)
        seenIncidents.set(incident.id, Date.now())
      }
    }

    // 8. Check for resolved incidents (in production, compare against DB)
    const resolvedIncidents: string[] = []

    return NextResponse.json({
      newIncidents,
      resolvedIncidents,
      notificationsSent,
      filtered,
      skippedReason,
      checkedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Traffic monitor error:', error)
    return NextResponse.json({ error: 'Monitor failed' }, { status: 500 })
  }
}

function getTypeKey(type: string): string | null {
  const typeMap: Record<string, string> = {
    'Accident': 'accidents',
    'Road Closed': 'roadClosures',
    'Road Works': 'construction',
    'Jam': 'trafficJams',
    'Lane Closed': 'laneClosures',
    'Broken Down Vehicle': 'brokenDownVehicles'
  }
  return typeMap[type] || null
}

function meetsThreshold(incident: Incident, threshold: 'major' | 'balanced' | 'everything'): boolean {
  if (threshold === 'everything') return true
  if (threshold === 'balanced') return incident.severity !== 'minor' || incident.delayMinutes >= 5
  // major only
  return incident.severity === 'major' || incident.severity === 'closed' || incident.delayMinutes >= 15
}

function isInQuietHours(quietHours: { enabled: boolean; startTime: string; endTime: string }): boolean {
  if (!quietHours.enabled) return false

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const [startHour, startMin] = quietHours.startTime.split(':').map(Number)
  const [endHour, endMin] = quietHours.endTime.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

async function sendNotification(renterId: string, incident: Incident, method: string) {
  // Stub for notification service
  // In production: integrate with Firebase Cloud Messaging, OneSignal, or similar
  console.log(`[Traffic Notification] ${method} to ${renterId}: ${incident.type} - ${incident.severity}`)

  // Create in-app notification record
  // await supabase.from('notifications').insert({
  //   user_id: renterId,
  //   type: 'traffic_alert',
  //   title: `Traffic Alert: ${incident.type}`,
  //   message: `${incident.type} ahead - estimated delay ${incident.delayMinutes} min`,
  //   data: incident
  // })
}
