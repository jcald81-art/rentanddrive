import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SYSTEM_PROMPT = `You are the Market Intelligence agent for Rent and Drive LLC, a premium car rental service in Reno/Lake Tahoe Nevada.

Your responsibilities:
1. Analyze competitor pricing data from Turo, Getaround, and traditional rentals
2. Identify market trends and seasonal patterns
3. Forecast demand based on events, holidays, weather, and ski season
4. Recommend fleet adjustments (which vehicles to add/remove)
5. Generate weekly market summary reports

Reno/Tahoe market context:
- SKI SEASON (Nov-Mar): High demand for AWD, SUVs, trucks. Peak pricing.
- SUMMER (Jun-Aug): Families, outdoor recreation. RVs, SUVs popular.
- SHOULDER (Apr-May, Sep-Oct): Lower demand, competitive pricing needed.
- EVENTS: Hot August Nights (Aug), Reno Air Races (Sep), various ski competitions

Response format (JSON only):
{
  "market_summary": "Brief 2-3 sentence summary",
  "demand_forecast": "high|medium|low",
  "recommended_rate_adjustment": -20 to +30 (percentage),
  "top_opportunities": ["opportunity 1", "opportunity 2"],
  "competitor_insights": "What competitors are doing",
  "fleet_recommendations": ["recommendation 1", "recommendation 2"],
  "confidence": 0-100
}`

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { analysis_type, vehicle_category } = await request.json()

    // Fetch competitor data from last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: competitors } = await supabase
      .from('competitor_snapshots')
      .select('*')
      .gte('captured_at', weekAgo)
      .order('captured_at', { ascending: false })

    // Fetch our current fleet and pricing
    const { data: fleet } = await supabase
      .from('vehicles')
      .select('id, make, model, year, category, daily_rate, is_active')
      .eq('is_active', true)

    // Fetch recent bookings for demand analysis
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('id, vehicle_id, start_date, end_date, total_amount, status')
      .gte('created_at', weekAgo)

    // Calculate occupancy rate
    const totalVehicles = fleet?.length || 0
    const activeBookings = recentBookings?.filter(b => b.status === 'active' || b.status === 'confirmed').length || 0
    const occupancyRate = totalVehicles > 0 ? (activeBookings / totalVehicles * 100).toFixed(1) : 0

    // Get current date context
    const now = new Date()
    const month = now.getMonth() + 1
    const season = month >= 11 || month <= 3 ? 'SKI SEASON' : month >= 6 && month <= 8 ? 'SUMMER' : 'SHOULDER'

    // Build analysis prompt
    const prompt = `Analyze the Reno/Lake Tahoe rental market for ${new Date().toLocaleDateString()}:

CURRENT SEASON: ${season}
FLEET SIZE: ${totalVehicles} vehicles
CURRENT OCCUPANCY: ${occupancyRate}%
CATEGORY FOCUS: ${vehicle_category || 'all categories'}

COMPETITOR DATA (last 7 days):
${competitors?.map(c => `- ${c.platform}: ${c.vehicle_make} ${c.vehicle_model} @ $${c.daily_rate}/day`).join('\n') || 'No competitor data available'}

OUR FLEET:
${fleet?.map(v => `- ${v.year} ${v.make} ${v.model} (${v.category}) @ $${v.daily_rate}/day`).join('\n') || 'No fleet data'}

RECENT BOOKING ACTIVITY: ${recentBookings?.length || 0} bookings this week

Provide market intelligence analysis as JSON.`

    // Call Claude
    const result = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: SYSTEM_PROMPT,
      prompt,
      maxOutputTokens: 800,
    })

    const tokensUsed = result.usage?.totalTokens || 0
    const costCents = Math.ceil(tokensUsed * 0.003 * 100)

    // Parse response
    let analysis
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch {
      analysis = {
        market_summary: 'Unable to parse market analysis',
        demand_forecast: 'medium',
        recommended_rate_adjustment: 0,
        top_opportunities: [],
        competitor_insights: 'Analysis failed',
        fleet_recommendations: [],
        confidence: 0
      }
    }

    // Log to agent_logs
    await supabase.from('agent_logs').insert({
      agent_name: 'market-intelligence',
      action_type: analysis_type || 'market_analysis',
      input_data: { 
        season, 
        occupancy_rate: occupancyRate, 
        fleet_size: totalVehicles,
        competitor_count: competitors?.length || 0 
      },
      output_data: analysis,
      model_used: 'claude-sonnet-4-20250514',
      tokens_used: tokensUsed,
      cost_cents: costCents,
      status: 'success',
    })

    return NextResponse.json({
      success: true,
      season,
      occupancy_rate: occupancyRate,
      analysis,
      processing_time_ms: Date.now() - startTime,
    })

  } catch (error) {
    console.error('Market intelligence error:', error)
    
    await supabase.from('agent_logs').insert({
      agent_name: 'market-intelligence',
      action_type: 'market_analysis',
      input_data: { error: String(error) },
      output_data: null,
      model_used: 'claude-sonnet-4-20250514',
      tokens_used: 0,
      cost_cents: 0,
      status: 'error',
    })

    return NextResponse.json({ error: 'Failed to analyze market' }, { status: 500 })
  }
}

// GET - Fetch latest market report or competitor data
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'summary'

  if (type === 'competitors') {
    const { data, error } = await supabase
      .from('competitor_snapshots')
      .select('*')
      .order('captured_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch competitors' }, { status: 500 })
    }

    return NextResponse.json({ competitors: data })
  }

  // Return latest market analysis from logs
  const { data, error } = await supabase
    .from('agent_logs')
    .select('*')
    .eq('agent_name', 'market-intelligence')
    .eq('status', 'success')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    return NextResponse.json({ error: 'No market analysis available' }, { status: 404 })
  }

  return NextResponse.json(data)
}

// Manual competitor snapshot endpoint
export async function PUT(request: NextRequest) {
  try {
    const { platform, vehicle_make, vehicle_model, daily_rate, location } = await request.json()

    if (!platform || !vehicle_make || !daily_rate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('competitor_snapshots')
      .insert({
        platform,
        vehicle_make,
        vehicle_model: vehicle_model || '',
        daily_rate,
        location: location || 'Reno, NV',
        captured_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to save competitor data' }, { status: 500 })
    }

    return NextResponse.json({ success: true, snapshot: data })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
