import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Get all host vehicles with related data
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select(`
        *,
        device:fleet_telemetry(last_lat, last_lng, last_speed_mph, last_seen_at)
      `)
      .eq('host_id', user.id)
      .order('created_at', { ascending: false })

    // Get bookings and revenue per vehicle this month
    const vehicleIds = vehicles?.map(v => v.id) || []
    
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, vehicle_id, total_price_cents, status')
      .in('vehicle_id', vehicleIds)
      .gte('created_at', startOfMonth)

    // Get Dollar recommended rates
    const { data: pricingHistory } = await supabase
      .from('pricing_history')
      .select('vehicle_id, recommended_rate, confidence')
      .in('vehicle_id', vehicleIds)
      .order('created_at', { ascending: false })

    // Build vehicle stats
    const vehicleStats = vehicles?.map(vehicle => {
      const vehicleBookings = bookings?.filter(b => b.vehicle_id === vehicle.id) || []
      const completedBookings = vehicleBookings.filter(b => b.status === 'completed')
      const revenue = completedBookings.reduce((sum, b) => sum + (b.total_price_cents || 0), 0)
      
      const latestPricing = pricingHistory?.find(p => p.vehicle_id === vehicle.id)
      
      return {
        ...vehicle,
        bookingsThisMonth: vehicleBookings.length,
        revenueThisMonth: revenue,
        recommendedRate: latestPricing?.recommended_rate || null,
        priceConfidence: latestPricing?.confidence || null,
        hasDevice: !!vehicle.device?.length,
        healthScore: vehicle.pulse_health_score || null,
      }
    }) || []

    return NextResponse.json({ vehicles: vehicleStats })
  } catch (error) {
    console.error('Workshop vehicles error:', error)
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
  }
}
