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
  const filter = searchParams.get('filter') || 'all'
  const search = searchParams.get('search') || ''

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, phone, avatar_url, role, is_verified, verification_status, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  // Apply filters
  if (filter === 'renter') {
    query = query.eq('role', 'renter')
  } else if (filter === 'host') {
    query = query.eq('role', 'host')
  } else if (filter === 'admin') {
    query = query.eq('role', 'admin')
  } else if (filter === 'pending_verification') {
    query = query.eq('verification_status', 'pending')
  } else if (filter === 'banned') {
    query = query.eq('is_banned', true)
  }

  // Apply search
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data: users, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get booking stats for each user
  const userIds = users?.map(u => u.id) || []
  
  const { data: bookingStats } = await supabase
    .from('bookings')
    .select('renter_id, total_amount')
    .in('renter_id', userIds)

  const { data: hostEarnings } = await supabase
    .from('bookings')
    .select('host_id, total_amount')
    .in('host_id', userIds)
    .in('status', ['completed', 'confirmed', 'active'])

  // Calculate stats per user
  const userSpent: Record<string, number> = {}
  const userBookings: Record<string, number> = {}
  const userEarned: Record<string, number> = {}

  bookingStats?.forEach((b) => {
    userSpent[b.renter_id] = (userSpent[b.renter_id] || 0) + b.total_amount
    userBookings[b.renter_id] = (userBookings[b.renter_id] || 0) + 1
  })

  hostEarnings?.forEach((b) => {
    userEarned[b.host_id] = (userEarned[b.host_id] || 0) + (b.total_amount * 0.9)
  })

  const formattedUsers = users?.map((u) => ({
    ...u,
    total_bookings: userBookings[u.id] || 0,
    total_spent: userSpent[u.id] || 0,
    total_earned: userEarned[u.id] || 0,
  }))

  return NextResponse.json({ users: formattedUsers })
}
