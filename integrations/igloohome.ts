/**
 * igloohome Integration — Smart Lockbox Access
 *
 * Generates time-limited PINs for contactless key handoff.
 * Each RAD vehicle has an igloohome lockbox attached to it or at the pickup location.
 *
 * Docs: https://developers.igloohome.co
 */

const IGLOO_API = 'https://api.igloohome.co/v1'

export interface IglooDevice {
  deviceId: string
  type: string
  name: string
  batteryLevel: number
  lastSeen: string
}

export interface IglooPIN {
  pin: string
  deviceId: string
  type: 'disposable' | 'recurring' | 'permanent'
  startTime: number // Unix timestamp
  endTime: number   // Unix timestamp
  accessLogId?: string
}

function iglooHeaders() {
  return {
    Authorization: `Bearer ${process.env.IGLOO_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

/**
 * List all igloohome devices linked to the RAD account
 */
export async function listDevices(): Promise<IglooDevice[]> {
  const res = await fetch(`${IGLOO_API}/devices`, {
    headers: iglooHeaders(),
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`igloohome API error: ${res.status}`)
  const data = await res.json()
  return data.devices ?? []
}

/**
 * Generate a time-limited PIN for a booking
 * PIN is valid from startTime to endTime
 */
export async function generateBookingPIN(params: {
  deviceId: string
  bookingId: string
  startTime: Date
  endTime: Date
}): Promise<IglooPIN> {
  const start = Math.floor(params.startTime.getTime() / 1000)
  const end = Math.floor(params.endTime.getTime() / 1000)

  const res = await fetch(`${IGLOO_API}/devices/${params.deviceId}/algopins`, {
    method: 'POST',
    headers: iglooHeaders(),
    body: JSON.stringify({
      type: 'disposable',
      startTime: start,
      endTime: end,
      tag: `booking_${params.bookingId}`,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to generate igloohome PIN: ${err}`)
  }

  const data = await res.json()
  return {
    pin: data.pin,
    deviceId: params.deviceId,
    type: 'disposable',
    startTime: start,
    endTime: end,
    accessLogId: data.accessLogId,
  }
}

/**
 * Generate a maintenance PIN (permanent for RAD staff)
 */
export async function generateMaintenancePIN(deviceId: string): Promise<IglooPIN> {
  const res = await fetch(`${IGLOO_API}/devices/${deviceId}/algopins`, {
    method: 'POST',
    headers: iglooHeaders(),
    body: JSON.stringify({
      type: 'permanent',
      tag: 'maintenance_staff',
    }),
  })

  if (!res.ok) throw new Error('Failed to generate maintenance PIN')
  const data = await res.json()
  return {
    pin: data.pin,
    deviceId,
    type: 'permanent',
    startTime: 0,
    endTime: 0,
  }
}

/**
 * Revoke all PINs for a booking (call on booking cancellation)
 */
export async function revokeBookingPINs(deviceId: string, bookingId: string): Promise<void> {
  // igloohome disposable PINs expire automatically — but we can delete by tag
  await fetch(`${IGLOO_API}/devices/${deviceId}/algopins?tag=booking_${bookingId}`, {
    method: 'DELETE',
    headers: iglooHeaders(),
  })
}

/**
 * Get access log for a device (shows who accessed when)
 */
export async function getAccessLog(deviceId: string): Promise<Array<{
  timestamp: string
  pin: string
  type: string
}>> {
  const res = await fetch(`${IGLOO_API}/devices/${deviceId}/access-log`, {
    headers: iglooHeaders(),
    next: { revalidate: 60 },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.logs ?? []
}
