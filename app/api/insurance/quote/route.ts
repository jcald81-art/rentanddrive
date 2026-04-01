import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { roamly, buildInternalQuotes } from '@/integrations/roamly'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { vehicleId, startDate, endDate } = await request.json()

    if (!vehicleId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, make, model, year, daily_rate, daily_rate_cents, category')
      .eq('id', vehicleId)
      .single()

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    const dailyRateCents = vehicle.daily_rate_cents ?? (vehicle.daily_rate ?? 0) * 100

    // ── Try Roamly first ──────────────────────────────────────────────────────
    if (process.env.ROAMLY_API_KEY) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        const nameParts = (profile?.full_name ?? '').split(' ')

        const roamlyQuote = await roamly.getQuote({
          vehicle: {
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            category: vehicle.category as never,
            daily_value_cents: dailyRateCents,
          },
          driver: {
            first_name: nameParts[0] ?? '',
            last_name: nameParts.slice(1).join(' ') || 'Guest',
            email: user.email ?? '',
          },
          rental_start: startDate,
          rental_end: endDate,
          external_booking_ref: vehicleId,
        })

        // Normalise Roamly plan names to basic/standard/premium only
        const plans = roamlyQuote.plans
          .filter(p => ['basic', 'standard', 'premium'].includes(p.name))
          .map(p => ({
            ...p,
            premium_cents: p.premium_cents,
            deductible_cents: p.deductible_cents,
            liability_limit_cents: p.liability_limit_cents,
            collision: p.collision,
            comprehensive: p.comprehensive,
            roadside_assistance: p.roadside_assistance,
            personal_effects: p.personal_effects,
            uninsured_motorist: p.uninsured_motorist,
          }))

        return NextResponse.json({
          quote_id: roamlyQuote.quote_id,
          plans,
          recommended: 'standard',
          provider: 'roamly',
          vehicle: { id: vehicle.id, make: vehicle.make, model: vehicle.model, year: vehicle.year },
          days,
        })
      } catch (roamlyErr) {
        console.error('[Roamly quote failed, falling back to internal]:', roamlyErr)
      }
    }

    // ── Internal fallback ─────────────────────────────────────────────────────
    const plans = buildInternalQuotes(dailyRateCents, days)

    // Store quote for audit log
    await supabase.from('insurance_quotes').insert({
      vehicle_id: vehicleId,
      user_id: user.id,
      coverage_type: 'standard',
      premium_cents: plans.find(p => p.name === 'standard')?.premium_cents ?? 0,
      deductible_cents: plans.find(p => p.name === 'standard')?.deductible_cents ?? 0,
      start_date: startDate,
      end_date: endDate,
      days,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }).throwOnError()

    return NextResponse.json({
      quote_id: null,
      plans,
      recommended: 'standard',
      provider: 'rad_internal',
      vehicle: { id: vehicle.id, make: vehicle.make, model: vehicle.model, year: vehicle.year },
      days,
    })
  } catch (error) {
    console.error('[Insurance Quote Error]:', error)
    return NextResponse.json({ error: 'Failed to generate insurance quote' }, { status: 500 })
  }
}
