import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/bookings/export - Export all bookings to CSV
export async function GET() {
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

  const { data: bookings, error } = await supabaseAdmin
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
      created_at,
      renter:users!bookings_renter_id_fkey (full_name, email),
      host:users!bookings_host_id_fkey (full_name, email),
      vehicle:vehicles (make, model, year)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }

  // Generate CSV
  const headers = [
    'Booking ID',
    'Renter Name',
    'Renter Email',
    'Host Name',
    'Host Email',
    'Vehicle',
    'Start Date',
    'End Date',
    'Status',
    'Total Amount',
    'Host Payout',
    'Platform Fee',
    'Flagged',
    'Created At',
  ]

  const rows = bookings?.map(b => [
    b.id,
    (b.renter as any)?.full_name || '',
    (b.renter as any)?.email || '',
    (b.host as any)?.full_name || '',
    (b.host as any)?.email || '',
    `${(b.vehicle as any)?.year} ${(b.vehicle as any)?.make} ${(b.vehicle as any)?.model}`,
    b.start_date,
    b.end_date,
    b.status,
    (b.total_amount / 100).toFixed(2),
    (b.host_payout / 100).toFixed(2),
    (b.platform_fee / 100).toFixed(2),
    b.is_flagged ? 'Yes' : 'No',
    b.created_at,
  ]) || []

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="bookings-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
