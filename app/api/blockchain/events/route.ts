import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { recordBlockchainEvent, getVehicleBlockchainHistory, type BlockchainEventType } from '@/lib/blockchain'

// POST: Record a new blockchain event
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { vehicleId, bookingId, eventType, eventData, gpsLat, gpsLng, photoIpfsHash, chain } = body
    
    if (!vehicleId || !eventType || !eventData) {
      return NextResponse.json(
        { error: 'Missing required fields: vehicleId, eventType, eventData' },
        { status: 400 }
      )
    }
    
    // Verify user has permission (host of vehicle or renter of booking)
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('host_id')
      .eq('id', vehicleId)
      .single()
    
    let hasPermission = vehicle?.host_id === user.id
    
    if (!hasPermission && bookingId) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('guest_id')
        .eq('id', bookingId)
        .single()
      
      hasPermission = booking?.guest_id === user.id
    }
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const result = await recordBlockchainEvent({
      vehicleId,
      bookingId,
      eventType: eventType as BlockchainEventType,
      eventData: {
        ...eventData,
        recorded_by: user.id,
        timestamp: new Date().toISOString(),
      },
      gpsLat,
      gpsLng,
      photoIpfsHash,
      chain,
    })
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      eventId: result.eventId,
      message: 'Event recorded. Pending blockchain confirmation.' 
    })
  } catch (error) {
    console.error('[api/blockchain/events] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Get blockchain history for a vehicle
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')
    
    if (!vehicleId) {
      return NextResponse.json({ error: 'Missing vehicleId parameter' }, { status: 400 })
    }
    
    const events = await getVehicleBlockchainHistory(vehicleId)
    
    return NextResponse.json({ events })
  } catch (error) {
    console.error('[api/blockchain/events] GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
