import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const booking_id = req.nextUrl.searchParams.get('booking_id')
  
  if (!booking_id) {
    return NextResponse.json({ error: 'Missing booking_id' }, { status: 400 })
  }

  try {
    const { data: requests, error } = await supabase
      .from('mobility_requests')
      .select('*')
      .eq('booking_id', booking_id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ requests: requests || [] })
  } catch (error) {
    console.error('Mobility status error:', error)
    return NextResponse.json(
      { error: 'Failed to get mobility status' },
      { status: 500 }
    )
  }
}
