import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_number,
      total_amount,
      start_date,
      end_date,
      status,
      admin_notes,
      stripe_dispute_id,
      is_flagged,
      created_at,
      vehicle:vehicles (id, make, model, year, thumbnail_url),
      renter:profiles!bookings_renter_id_fkey (id, full_name, email, avatar_url),
      host:profiles!bookings_host_id_fkey (id, full_name, email, avatar_url)
    `)
    .in('status', ['disputed', 'resolved', 'cancelled'])
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get messages for disputed bookings
  const disputedIds = bookings?.filter(b => b.status === 'disputed').map(b => b.id) || []
  
  const { data: messages } = await supabase
    .from('messages')
    .select('id, booking_id, sender_id, message, created_at')
    .in('booking_id', disputedIds)
    .order('created_at', { ascending: true })

  // Get damage photos
  const { data: damageReports } = await supabase
    .from('damage_reports')
    .select('booking_id, photos')
    .in('booking_id', disputedIds)

  const messagesMap: Record<string, any[]> = {}
  messages?.forEach((m) => {
    if (!messagesMap[m.booking_id]) messagesMap[m.booking_id] = []
    messagesMap[m.booking_id].push(m)
  })

  const damageMap: Record<string, string[]> = {}
  damageReports?.forEach((d) => {
    damageMap[d.booking_id] = d.photos || []
  })

  const formattedDisputes = bookings?.map((b) => {
    // Normalize joined relations - Supabase types them as arrays even for single FK relations
    const vehicle = Array.isArray(b.vehicle) ? b.vehicle[0] : b.vehicle
    const renter = Array.isArray(b.renter) ? b.renter[0] : b.renter
    const host = Array.isArray(b.host) ? b.host[0] : b.host

    return {
      id: b.id,
      booking_id: b.id,
      booking_number: b.booking_number || b.id.slice(0, 8).toUpperCase(),
      vehicle_name: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown',
      vehicle_thumbnail: vehicle?.thumbnail_url,
      renter: {
        id: renter?.id,
        name: renter?.full_name || 'Unknown',
        email: renter?.email,
        avatar: renter?.avatar_url,
      },
      host: {
        id: host?.id,
        name: host?.full_name || 'Unknown',
        email: host?.email,
        avatar: host?.avatar_url,
      },
      total_amount: b.total_amount,
      start_date: b.start_date,
      end_date: b.end_date,
      dispute_reason: b.admin_notes,
      dispute_created_at: b.created_at,
      stripe_dispute_id: b.stripe_dispute_id,
      status: b.status,
      admin_notes: b.admin_notes,
      damage_photos: damageMap[b.id] || [],
      messages: (messagesMap[b.id] || []).map((m) => ({
        id: m.id,
        sender: m.sender_id === renter?.id ? renter?.full_name : host?.full_name,
        sender_role: m.sender_id === renter?.id ? 'renter' : 'host',
        message: m.message,
        created_at: m.created_at,
      })),
    }
  })

  return NextResponse.json({ disputes: formattedDisputes })
}
