import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'all'

  let query = supabase
    .from('vehicles')
    .select(`
      id,
      make,
      model,
      year,
      category,
      daily_rate,
      location_city,
      vin,
      has_vin_report,
      is_active,
      is_approved,
      is_flagged,
      thumbnail_url,
      images,
      seats,
      doors,
      fuel_type,
      transmission,
      is_awd,
      has_ski_rack,
      has_tow_hitch,
      created_at,
      host:profiles!vehicles_host_id_fkey (id, full_name, email)
    `)
    .order('created_at', { ascending: false })

  if (status === 'pending') {
    query = query.eq('is_approved', false)
  } else if (status === 'approved') {
    query = query.eq('is_approved', true)
  } else if (status === 'flagged') {
    query = query.eq('is_flagged', true)
  }

  const { data: vehicles, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const formattedVehicles = vehicles?.map((v) => {
    const host = (Array.isArray(v.host) ? v.host[0] : v.host) as { id: string; full_name: string; email: string } | null
    return {
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      category: v.category,
      daily_rate: v.daily_rate,
      location_city: v.location_city,
      vin: v.vin,
      has_vin_report: v.has_vin_report,
      is_active: v.is_active,
      is_approved: v.is_approved,
      thumbnail_url: v.thumbnail_url,
      images: v.images || [],
      host_name: host?.full_name || 'Unknown',
      host_email: host?.email || '',
      host_id: host?.id || '',
      created_at: v.created_at,
      specs: {
        seats: v.seats,
        doors: v.doors,
        fuel_type: v.fuel_type,
        transmission: v.transmission,
        is_awd: v.is_awd,
        has_ski_rack: v.has_ski_rack,
        has_tow_hitch: v.has_tow_hitch,
      },
    }
  })

  return NextResponse.json({ vehicles: formattedVehicles })
}
