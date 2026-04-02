import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUrl, getVehicleData, preconditionVehicle, setSentryMode } from '@/lib/integrations/tesla-fleet'

// GET: Get Tesla auth URL or vehicle data
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    const action = searchParams.get('action')

    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID required' }, { status: 400 })
    }

    // Verify ownership
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('host_id')
      .eq('id', vehicleId)
      .single()

    if (!vehicle || vehicle.host_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this vehicle' }, { status: 403 })
    }

    if (action === 'auth') {
      const authUrl = await getAuthUrl(vehicleId, user.id)
      return NextResponse.json({ authUrl })
    }

    // Get vehicle data
    const data = await getVehicleData(vehicleId)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[v0] Tesla GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Control Tesla (precondition, sentry)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { vehicleId, action, enable } = body

    if (!vehicleId || !action) {
      return NextResponse.json({ error: 'Vehicle ID and action required' }, { status: 400 })
    }

    // Verify ownership
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('host_id')
      .eq('id', vehicleId)
      .single()

    if (!vehicle || vehicle.host_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this vehicle' }, { status: 403 })
    }

    let result
    switch (action) {
      case 'precondition':
        result = await preconditionVehicle(vehicleId, enable !== false)
        break
      case 'sentry':
        result = await setSentryMode(vehicleId, enable !== false)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[v0] Tesla POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
