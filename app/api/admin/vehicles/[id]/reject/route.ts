import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
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

  const { reason } = await request.json()

  // Get vehicle to find host
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('host_id, make, model, year')
    .eq('id', id)
    .single()

  if (!vehicle) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
  }

  // Reject the vehicle
  const { error } = await supabase
    .from('vehicles')
    .update({
      is_approved: false,
      is_active: false,
      rejection_reason: reason,
      rejected_at: new Date().toISOString(),
      rejected_by: user.id,
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Notify host
  await supabase.from('notifications').insert({
    user_id: vehicle.host_id,
    type: 'vehicle_rejected',
    title: 'Vehicle Not Approved',
    message: `Your ${vehicle.year} ${vehicle.make} ${vehicle.model} was not approved. Reason: ${reason}`,
    data: { vehicle_id: id, reason },
  })

  return NextResponse.json({ success: true })
}
