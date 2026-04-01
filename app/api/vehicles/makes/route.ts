import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAllMakes, sortMakesWithPopularFirst, POPULAR_MAKES } from '@/integrations/nhtsa'

export const dynamic = 'force-dynamic'

/**
 * GET /api/vehicles/makes
 * Returns all vehicle makes, fetching from NHTSA if DB is empty
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Try to get from database first
    const { data: dbMakes, error } = await supabase
      .from('vehicle_makes')
      .select('id, nhtsa_id, name')
      .eq('vehicle_type', 'car')
      .order('name')
    
    if (!error && dbMakes && dbMakes.length > 0) {
      return NextResponse.json({
        makes: sortMakesWithPopularFirst(dbMakes),
        source: 'database',
      })
    }
    
    // Fallback to hardcoded popular makes for now
    // Full NHTSA sync would be done via admin/cron
    const fallbackMakes = POPULAR_MAKES.map((name, index) => ({
      id: index + 1,
      nhtsa_id: null,
      name,
    }))
    
    return NextResponse.json({
      makes: fallbackMakes,
      source: 'fallback',
    })
  } catch (err) {
    console.error('Error fetching vehicle makes:', err)
    return NextResponse.json(
      { error: 'Failed to fetch vehicle makes' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/vehicles/makes
 * Admin-only: Refresh makes from NHTSA API
 */
export async function POST() {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
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
    
    // Fetch from NHTSA
    const nhtsaMakes = await getAllMakes()
    
    // Upsert into database
    const makesToInsert = nhtsaMakes.map(m => ({
      nhtsa_id: m.Make_ID,
      name: m.Make_Name,
      vehicle_type: 'car',
    }))
    
    const { error: upsertError } = await supabase
      .from('vehicle_makes')
      .upsert(makesToInsert, { onConflict: 'nhtsa_id' })
    
    if (upsertError) {
      throw upsertError
    }
    
    return NextResponse.json({
      success: true,
      count: nhtsaMakes.length,
    })
  } catch (err) {
    console.error('Error refreshing vehicle makes:', err)
    return NextResponse.json(
      { error: 'Failed to refresh vehicle makes' },
      { status: 500 }
    )
  }
}
