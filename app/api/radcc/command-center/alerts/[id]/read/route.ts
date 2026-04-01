import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mark alert as read
    const { error } = await supabase
      .from('fleet_alerts')
      .update({ is_read: true })
      .eq('id', id)

    if (error) {
      console.error('Error marking alert read:', error)
      return NextResponse.json({ error: 'Failed to mark alert read' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark alert read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
