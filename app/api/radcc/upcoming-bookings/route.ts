import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get host's vehicles
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id')
      .eq('host_id', user.id)

    const vehicleIds = vehicles?.map(v => v.id) || []

    if (vehicleIds.length === 0) {
      return NextResponse.json({ bookings: [] })
    }

    // Get upcoming bookings (next 7 days)
    const now = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        status,
        start_date,
        end_date,
        total_amount,
        vehicles (
          id,
          make,
          model,
          year,
          license_plate,
          thumbnail_url
        ),
        profiles:renter_id (
          id,
          full_name,
          avatar_url,
          phone
        )
      `)
      .in('vehicle_id', vehicleIds)
      .in('status', ['confirmed', 'active', 'pending'])
      .gte('start_date', now.toISOString())
      .lte('start_date', nextWeek.toISOString())
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Error fetching upcoming bookings:', error)
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    return NextResponse.json({ bookings: bookings || [] })
  } catch (error) {
    console.error('Upcoming bookings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
