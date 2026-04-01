import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { vehicleId, startDate, endDate } = await request.json()

    if (!vehicleId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check for overlapping bookings
    const { data: conflictingBookings, error } = await supabase
      .from('bookings')
      .select('id, start_date, end_date')
      .eq('vehicle_id', vehicleId)
      .in('status', ['confirmed', 'pending_payment', 'active'])
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`)

    if (error) {
      console.error('Availability check error:', error)
      return NextResponse.json(
        { available: true }, // Default to available on error
        { status: 200 }
      )
    }

    const hasConflicts = conflictingBookings && conflictingBookings.length > 0

    if (hasConflicts) {
      // Find next available date
      const { data: nextBookings } = await supabase
        .from('bookings')
        .select('end_date')
        .eq('vehicle_id', vehicleId)
        .in('status', ['confirmed', 'pending_payment', 'active'])
        .gte('end_date', new Date().toISOString())
        .order('end_date', { ascending: true })
        .limit(1)

      const nextAvailable = nextBookings?.[0]?.end_date
        ? new Date(new Date(nextBookings[0].end_date).getTime() + 24 * 60 * 60 * 1000)
            .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : undefined

      return NextResponse.json({
        available: false,
        conflictingBookings: conflictingBookings.length,
        nextAvailable,
      })
    }

    return NextResponse.json({
      available: true,
    })
  } catch (error) {
    console.error('Availability API error:', error)
    return NextResponse.json(
      { available: true }, // Default to available on error
      { status: 200 }
    )
  }
}
