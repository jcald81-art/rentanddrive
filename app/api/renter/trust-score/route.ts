import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Trust Score Calculation:
// - idVerified: 25pts (required)
// - noIncidents: 20pts
// - completedRentals: min(rentals * 5, 15)pts
// - accountAgeDays: min(days/3, 10)pts
// - avgRating: min((rating-3)*10, 20)pts
// - profileComplete: 10pts
// Total possible: 100pts

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const renterId = searchParams.get('renterId')

    if (!renterId) {
      return NextResponse.json({ error: 'renterId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch renter profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', renterId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Renter not found' }, { status: 404 })
    }

    // Fetch completed rentals count
    const { count: completedRentals } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('renter_id', renterId)
      .eq('status', 'completed')

    // Fetch incidents count
    const { count: incidents } = await supabase
      .from('incidents')
      .select('*', { count: 'exact', head: true })
      .eq('renter_id', renterId)

    // Fetch average rating from reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewed_user_id', renterId)
      .eq('reviewer_type', 'host')

    const avgRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    // Calculate account age in days
    const createdAt = new Date(profile.created_at)
    const now = new Date()
    const accountAgeDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

    // Check profile completeness
    const profileComplete = !!(
      profile.full_name &&
      profile.phone &&
      profile.avatar_url &&
      profile.driver_license_verified
    )

    // Calculate breakdown
    const breakdown = {
      idVerified: !!profile.id_verified,
      noIncidents: (incidents || 0) === 0,
      completedRentals: completedRentals || 0,
      accountAgeDays,
      avgRating: avgRating || 0,
      profileComplete,
    }

    // Calculate points
    const points = {
      idVerified: breakdown.idVerified ? 25 : 0,
      noIncidents: breakdown.noIncidents ? 20 : 0,
      completedRentals: Math.min((breakdown.completedRentals) * 5, 15),
      accountAge: Math.min(Math.floor(breakdown.accountAgeDays / 3), 10),
      rating: breakdown.avgRating >= 3 ? Math.min(Math.floor((breakdown.avgRating - 3) * 10), 20) : 0,
      profileComplete: breakdown.profileComplete ? 10 : 0,
    }

    const score = Object.values(points).reduce((sum, p) => sum + p, 0)

    // Fetch host thresholds to determine qualifying vehicles
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, make, model, instant_book_threshold')
      .eq('instant_book_enabled', true)

    const qualifyingVehicles = (vehicles || [])
      .filter(v => score >= (v.instant_book_threshold || 50))
      .map(v => ({ id: v.id, name: `${v.make} ${v.model}` }))

    return NextResponse.json({
      renterId,
      score,
      breakdown,
      points,
      instantBookEligible: score >= 50, // Default threshold
      qualifyingVehicles,
    })
  } catch (error) {
    console.error('[Trust Score API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
