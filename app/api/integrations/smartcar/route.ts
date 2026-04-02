import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUrl, getVehicleTelemetry, lockVehicle, unlockVehicle } from '@/lib/integrations/smartcar'

// GET: Get Smartcar auth URL or telemetry
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

    // Get telemetry
    const telemetry = await getVehicleTelemetry(vehicleId)
    return NextResponse.json({ telemetry })
  } catch (error) {
    console.error('[v0] Smartcar GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Control vehicle (lock/unlock)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { vehicleId, action } = body

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
      case 'lock':
        result = await lockVehicle(vehicleId)
        break
      case 'unlock':
        result = await unlockVehicle(vehicleId)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[v0] Smartcar POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
