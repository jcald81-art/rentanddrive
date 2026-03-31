import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMobilityCostEstimate } from '@/lib/mobility/mobility-orchestrator'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { vehicle_location, renter_location, delivery_address } = await req.json()

    if (!vehicle_location || !renter_location) {
      return NextResponse.json(
        { error: 'Missing required fields: vehicle_location, renter_location' },
        { status: 400 }
      )
    }

    const estimates = await getMobilityCostEstimate(
      vehicle_location,
      renter_location,
      delivery_address
    )

    return NextResponse.json(estimates)
  } catch (error) {
    console.error('Mobility quote error:', error)
    return NextResponse.json(
      { error: 'Failed to get mobility estimates' },
      { status: 500 }
    )
  }
}
