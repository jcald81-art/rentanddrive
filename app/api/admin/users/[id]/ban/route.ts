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

  const { error } = await supabase
    .from('profiles')
    .update({
      is_banned: true,
      ban_reason: reason,
      banned_at: new Date().toISOString(),
      banned_by: user.id,
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also deactivate any vehicles they own
  await supabase
    .from('vehicles')
    .update({ is_active: false })
    .eq('host_id', id)

  return NextResponse.json({ success: true })
}
