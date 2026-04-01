import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get host's vehicles
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, make, model, year')
      .eq('host_id', user.id)

    const vehicleIds = vehicles?.map(v => v.id) || []

    // Get today's bookings
    const { data: todayBookings } = await supabase
      .from('bookings')
      .select('id, status, start_date, end_date, total_amount')
      .in('vehicle_id', vehicleIds)
      .gte('start_date', today.toISOString())
      .lt('start_date', tomorrow.toISOString())

    // Get pending bookings
    const { data: pendingBookings } = await supabase
      .from('bookings')
      .select('id')
      .in('vehicle_id', vehicleIds)
      .eq('status', 'pending')

    // Get recent earnings (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('total_amount')
      .in('vehicle_id', vehicleIds)
      .eq('status', 'completed')
      .gte('end_date', thirtyDaysAgo.toISOString())

    const totalEarnings = recentBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0

    return NextResponse.json({
      brief: {
        greeting: getTimeBasedGreeting(),
        date: today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        highlights: [
          { label: 'Vehicles', value: vehicles?.length || 0 },
          { label: 'Today\'s Pickups', value: todayBookings?.filter(b => b.status === 'active' || b.status === 'confirmed')?.length || 0 },
          { label: 'Pending Requests', value: pendingBookings?.length || 0 },
          { label: '30-Day Earnings', value: `$${totalEarnings.toLocaleString()}` },
        ],
        alerts: [],
        tips: [
          'Keep your calendar up to date for better visibility',
          'Respond to booking requests within 24 hours for higher rankings',
          'Add detailed descriptions to attract more renters',
        ],
      },
    })
  } catch (error) {
    console.error('Morning brief error:', error)
    return NextResponse.json({ error: 'Failed to fetch morning brief' }, { status: 500 })
  }
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
