import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const IGLOO_API_URL = 'https://api.igloodeveloper.co/v1'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lockboxId = searchParams.get('lockboxId')
    const bookingId = searchParams.get('bookingId')
    const vehicleId = searchParams.get('vehicleId')

    // Get user's vehicles if host
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('lockbox_access_codes')
      .select(`
        *,
        bookings(
          id,
          start_date,
          end_date,
          renter:profiles!bookings_renter_id_fkey(full_name),
          vehicles(id, make, model, year, license_plate)
        )
      `)
      .order('created_at', { ascending: false })

    if (bookingId) {
      query = query.eq('booking_id', bookingId)
    }

    if (lockboxId) {
      query = query.eq('lockbox_id', lockboxId)
    }

    // Filter by vehicle if specified
    if (vehicleId) {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('lockbox_id')
        .eq('id', vehicleId)
        .single()

      if (vehicle?.lockbox_id) {
        query = query.eq('lockbox_id', vehicle.lockbox_id)
      }
    }

    // If not admin, only show own bookings/vehicles
    if (profile?.role !== 'admin') {
      const { data: userVehicles } = await supabase
        .from('vehicles')
        .select('lockbox_id')
        .eq('host_id', user.id)
        .not('lockbox_id', 'is', null)

      const lockboxIds = userVehicles?.map(v => v.lockbox_id).filter(Boolean) || []
      
      if (lockboxIds.length > 0) {
        query = query.in('lockbox_id', lockboxIds)
      } else {
        // Check if user has any bookings
        query = query.eq('created_by', user.id)
      }
    }

    const { data: accessLogs, error } = await query.limit(100)

    if (error) throw error

    // Fetch real-time access logs from igloo if API key exists
    let iglooLogs: any[] = []
    if (process.env.IGLOO_API_KEY && lockboxId) {
      try {
        const response = await fetch(
          `${IGLOO_API_URL}/locks/${lockboxId}/activitylog?limit=50`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.IGLOO_API_KEY}`,
            },
          }
        )
        if (response.ok) {
          const data = await response.json()
          iglooLogs = data.activityLogs || []
        }
      } catch (e) {
        console.error('Failed to fetch igloo logs:', e)
      }
    }

    return NextResponse.json({
      accessCodes: accessLogs,
      iglooActivityLogs: iglooLogs,
    })
  } catch (error) {
    console.error('[Igloo Access Log Error]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch access logs' },
      { status: 500 }
    )
  }
}
