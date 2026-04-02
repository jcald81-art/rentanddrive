import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Get user details
  const { data: targetUser, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Get driver verification
  const { data: verification } = await supabase
    .from('driver_verifications')
    .select('*')
    .eq('user_id', id)
    .single()

  // Get bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id,
      total_amount,
      status,
      created_at,
      vehicle:vehicles (make, model, year)
    `)
    .eq('renter_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get vehicles (if host)
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, make, model, year, is_active')
    .eq('host_id', id)

  // Calculate totals
  const { data: allBookings } = await supabase
    .from('bookings')
    .select('total_amount')
    .eq('renter_id', id)

  const { data: hostBookings } = await supabase
    .from('bookings')
    .select('total_amount')
    .eq('host_id', id)
    .in('status', ['completed', 'confirmed', 'active'])

  const total_spent = allBookings?.reduce((sum, b) => sum + b.total_amount, 0) || 0
  const total_earned = (hostBookings?.reduce((sum, b) => sum + b.total_amount, 0) || 0) * 0.9

  // Get vehicle booking counts
  const vehicleBookingCounts: Record<string, number> = {}
  if (vehicles) {
    const vehicleIds = vehicles.map(v => v.id)
    const { data: vBookings } = await supabase
      .from('bookings')
      .select('vehicle_id')
      .in('vehicle_id', vehicleIds)

    vBookings?.forEach((b) => {
      vehicleBookingCounts[b.vehicle_id] = (vehicleBookingCounts[b.vehicle_id] || 0) + 1
    })
  }

  return NextResponse.json({
    ...targetUser,
    driver_license_url: verification?.document_url || null,
    driver_license_expiry: verification?.expiry_date || null,
    total_spent,
    total_earned,
    total_bookings: allBookings?.length || 0,
    bookings: bookings?.map((b) => {
      const vehicle = Array.isArray(b.vehicle) ? b.vehicle[0] : b.vehicle
      return {
        id: b.id,
        vehicle_name: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown',
        total_amount: b.total_amount,
        status: b.status,
        created_at: b.created_at,
      }
    }) || [],
    vehicles: vehicles?.map((v) => ({
      id: v.id,
      name: `${v.year} ${v.make} ${v.model}`,
      is_active: v.is_active,
      total_bookings: vehicleBookingCounts[v.id] || 0,
    })) || [],
  })
}
