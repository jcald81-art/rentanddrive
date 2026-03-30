import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_STATUSES = [
  'pending',
  'confirmed',
  'active',
  'completed',
  'cancelled',
  'disputed',
  'refunded',
]

// POST /api/admin/bookings/[id]/status - Force status change
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  const { status } = await request.json()

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updateData: Record<string, any> = { status }

  // Set timestamp based on status
  switch (status) {
    case 'confirmed':
      updateData.confirmed_at = new Date().toISOString()
      break
    case 'active':
      updateData.started_at = new Date().toISOString()
      break
    case 'completed':
      updateData.completed_at = new Date().toISOString()
      break
    case 'cancelled':
    case 'refunded':
      updateData.cancelled_at = new Date().toISOString()
      break
  }

  const { error } = await supabaseAdmin
    .from('bookings')
    .update(updateData)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
