import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/bookings/[id]/report-issue - Report an issue with a booking
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { description } = await request.json()

  if (!description?.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  }

  // Verify user is part of this booking
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, renter_id, host_id')
    .eq('id', id)
    .single()

  if (fetchError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (booking.renter_id !== user.id && booking.host_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Create support ticket
  const { error: ticketError } = await supabase
    .from('support_tickets')
    .insert({
      booking_id: id,
      user_id: user.id,
      subject: `Issue with booking ${id.slice(0, 8)}`,
      description,
      status: 'open',
      priority: 'medium',
    })

  if (ticketError) {
    console.error('Failed to create support ticket:', ticketError)
    return NextResponse.json({ error: 'Failed to report issue' }, { status: 500 })
  }

  // Flag the booking for admin review
  await supabase
    .from('bookings')
    .update({ is_flagged: true })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
