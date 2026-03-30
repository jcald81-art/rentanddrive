import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const IGLOO_API_URL = 'https://api.igloodeveloper.co/v1'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId, reason } = await request.json()

    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
    }

    // Get booking and access code
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, host_id')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Only host or admin can revoke
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (booking.host_id !== user.id && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Get access code
    const { data: accessCode } = await supabase
      .from('lockbox_access_codes')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('is_revoked', false)
      .single()

    if (!accessCode) {
      return NextResponse.json({ error: 'No active access code found' }, { status: 404 })
    }

    // Revoke via igloo API if we have the ID
    if (accessCode.igloo_access_code_id && process.env.IGLOO_API_KEY) {
      await fetch(`${IGLOO_API_URL}/accesscodes/${accessCode.igloo_access_code_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.IGLOO_API_KEY}`,
        },
      })
    }

    // Mark as revoked in database
    await supabase
      .from('lockbox_access_codes')
      .update({
        is_revoked: true,
        revoked_at: new Date().toISOString(),
        revoked_by: user.id,
        revoke_reason: reason || 'Manual revocation',
      })
      .eq('id', accessCode.id)

    // Clear PIN from booking
    await supabase
      .from('bookings')
      .update({
        lockbox_pin: null,
        lockbox_pin_expires_at: null,
      })
      .eq('id', bookingId)

    return NextResponse.json({
      success: true,
      message: 'Access revoked successfully',
    })
  } catch (error) {
    console.error('[Igloo Revoke Access Error]:', error)
    return NextResponse.json(
      { error: 'Failed to revoke access' },
      { status: 500 }
    )
  }
}
