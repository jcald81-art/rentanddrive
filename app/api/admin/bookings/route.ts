import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Use service role for admin operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/bookings - Get all platform bookings (admin only)
export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')

  let query = supabaseAdmin
    .from('bookings')
    .select(`
      id,
      start_date,
      end_date,
      status,
      total_amount,
      host_payout,
      platform_fee,
      is_flagged,
      admin_notes,
      created_at,
      renter:users!bookings_renter_id_fkey (
        id,
        full_name,
        email
      ),
      host:users!bookings_host_id_fkey (
        id,
        full_name,
        email
      ),
      vehicle:vehicles (
        id,
        make,
        model,
        year
      )
    `)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }
  if (startDate) {
    query = query.gte('start_date', startDate)
  }
  if (endDate) {
    query = query.lte('end_date', endDate)
  }

  const { data: bookings, error } = await query

  if (error) {
    console.error('Failed to fetch admin bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }

  return NextResponse.json({ bookings })
}
