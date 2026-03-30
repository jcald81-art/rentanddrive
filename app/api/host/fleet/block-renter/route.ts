import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    // Add to blocked renters list
    const { error } = await supabase
      .from('host_blocked_renters')
      .upsert({
        host_id: user.id,
        renter_id: user_id,
        blocked_at: new Date().toISOString(),
      }, { onConflict: 'host_id,renter_id' })

    if (error) {
      console.error('Error blocking renter:', error)
      return NextResponse.json({ error: 'Failed to block renter' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Block renter error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
