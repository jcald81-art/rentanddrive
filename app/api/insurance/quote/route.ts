import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Insurance rate calculation
function calculatePremium(vehicle: any, days: number, coverageType: string) {
  const baseRates: Record<string, number> = {
    basic: 8,      // $8/day
    standard: 15,  // $15/day
    premium: 25,   // $25/day
    full: 35,      // $35/day
  }

  let baseRate = baseRates[coverageType] || baseRates.standard
  
  // Adjust for vehicle value
  const vehicleValue = vehicle.daily_rate_cents / 100 * 30 // Estimate monthly rental value
  if (vehicleValue > 3000) baseRate *= 1.2
  if (vehicleValue > 5000) baseRate *= 1.3
  
  // Adjust for vehicle age
  const age = new Date().getFullYear() - vehicle.year
  if (age > 5) baseRate *= 0.9
  if (age > 10) baseRate *= 0.85
  
  // Adjust for category
  if (vehicle.category === 'luxury') baseRate *= 1.5
  if (vehicle.category === 'rv') baseRate *= 1.3
  if (vehicle.category === 'motorcycle') baseRate *= 1.4
  
  return Math.round(baseRate * days * 100) // Return in cents
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { vehicleId, startDate, endDate, coverageType } = await request.json()

    if (!vehicleId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get vehicle details
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    const coverageOptions = ['basic', 'standard', 'premium', 'full']
    const quotes = coverageOptions.map(type => ({
      coverageType: type,
      premiumCents: calculatePremium(vehicle, days, type),
      deductible: type === 'basic' ? 2500 : type === 'standard' ? 1500 : type === 'premium' ? 500 : 0,
      liabilityLimit: type === 'basic' ? 100000 : type === 'standard' ? 300000 : type === 'premium' ? 500000 : 1000000,
      collisionCoverage: type !== 'basic',
      comprehensiveCoverage: type === 'premium' || type === 'full',
      roadsideAssistance: type === 'premium' || type === 'full',
      personalEffects: type === 'full',
    }))

    // Store quote for reference
    const selectedQuote = quotes.find(q => q.coverageType === (coverageType || 'standard'))
    
    await supabase.from('insurance_quotes').insert({
      vehicle_id: vehicleId,
      user_id: user.id,
      coverage_type: coverageType || 'standard',
      premium_cents: selectedQuote?.premiumCents,
      deductible_cents: (selectedQuote?.deductible || 0) * 100,
      start_date: startDate,
      end_date: endDate,
      days,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hour expiry
    })

    return NextResponse.json({
      quotes,
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
      },
      days,
      recommended: 'standard',
    })
  } catch (error) {
    console.error('[Insurance Quote Error]:', error)
    return NextResponse.json(
      { error: 'Failed to generate insurance quote' },
      { status: 500 }
    )
  }
}
