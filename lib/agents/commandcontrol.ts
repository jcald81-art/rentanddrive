import { routeAIRequest } from '@/lib/ai-router'
import { createClient } from '@/lib/supabase/server'

const AGENT_NAME = 'CommandControl'

interface MarketIntelligence {
  avgCompetitorRate: number
  ratePosition: 'below' | 'at' | 'above'
  upcomingDemandEvents: Array<{
    name: string
    date: string
    expectedImpact: 'low' | 'medium' | 'high'
    category: string
  }>
  alerts: Array<{
    type: 'opportunity' | 'threat' | 'info'
    message: string
  }>
  weeklySummary: string
  turoListingCount: number
  marketTrends: string[]
}

// Search web for market data using Perplexity
async function searchMarketData(query: string): Promise<string> {
  const result = await routeAIRequest({
    taskType: 'market_intelligence',
    agentName: AGENT_NAME,
    actionType: 'web_search',
    system: `You are Command&Control, the market intelligence AI for Rent and Drive in Reno/Tahoe, Nevada.
Search the web and provide current, factual information. Focus on:
- Turo listings and pricing in Reno/Tahoe area
- Upcoming events that drive tourism
- Weather forecasts affecting travel
- Competitor news and market changes
Return detailed, actionable intelligence.`,
    prompt: query,
    maxTokens: 1024,
  })

  return result.text
}

// Analyze and synthesize market data with Claude
async function synthesizeIntelligence(rawData: string): Promise<MarketIntelligence> {
  const systemPrompt = `You are Command&Control analyzing raw market data for Rent and Drive in Reno/Tahoe.
Synthesize the data into actionable intelligence.
Return JSON only:
{
  "avgCompetitorRate": number (daily rate in USD),
  "ratePosition": "below|at|above" (compared to our $75-150 range),
  "upcomingDemandEvents": [{"name": string, "date": "YYYY-MM-DD", "expectedImpact": "low|medium|high", "category": "sports|music|convention|holiday|weather"}],
  "alerts": [{"type": "opportunity|threat|info", "message": string}],
  "weeklySummary": "2-3 sentence executive summary",
  "turoListingCount": number (estimated AWD listings in Reno area),
  "marketTrends": ["trend1", "trend2"]
}`

  const result = await routeAIRequest({
    taskType: 'market_intelligence',
    agentName: AGENT_NAME,
    actionType: 'synthesize_intelligence',
    system: systemPrompt,
    prompt: `Analyze this market data and extract intelligence:\n\n${rawData}`,
    maxTokens: 1024,
    forceModel: 'claude', // Use Claude for synthesis
  })

  try {
    const parsed = JSON.parse(result.text.replace(/```json\n?|\n?```/g, ''))
    return {
      avgCompetitorRate: parsed.avgCompetitorRate || 100,
      ratePosition: parsed.ratePosition || 'at',
      upcomingDemandEvents: parsed.upcomingDemandEvents || [],
      alerts: parsed.alerts || [],
      weeklySummary: parsed.weeklySummary || 'No summary available.',
      turoListingCount: parsed.turoListingCount || 0,
      marketTrends: parsed.marketTrends || [],
    }
  } catch {
    return {
      avgCompetitorRate: 100,
      ratePosition: 'at',
      upcomingDemandEvents: [],
      alerts: [{ type: 'info', message: 'Unable to parse market data' }],
      weeklySummary: 'Market analysis unavailable.',
      turoListingCount: 0,
      marketTrends: [],
    }
  }
}

// Main market scan function (called by cron)
export async function runWeeklyMarketScan(): Promise<MarketIntelligence> {
  const supabase = await createClient()

  // Search for various market data points
  const searches = [
    'Turo Reno Nevada AWD car rental prices average daily rate 2024',
    'Upcoming events Reno Tahoe next 30 days concerts sports conventions',
    'Lake Tahoe ski resort snow conditions forecast',
    'Reno car rental market trends tourism statistics',
  ]

  let combinedData = ''
  for (const query of searches) {
    try {
      const data = await searchMarketData(query)
      combinedData += `\n\n--- ${query} ---\n${data}`
      await new Promise(r => setTimeout(r, 500)) // Rate limit
    } catch (error) {
      console.error(`[CommandControl] Search failed for: ${query}`, error)
    }
  }

  // Synthesize all data
  const intelligence = await synthesizeIntelligence(combinedData)

  // Save to competitor_snapshots
  await supabase.from('competitor_snapshots').insert({
    platform: 'turo',
    market_area: 'reno_tahoe',
    avg_daily_rate: intelligence.avgCompetitorRate,
    vehicle_count: intelligence.turoListingCount,
    upcoming_events: intelligence.upcomingDemandEvents,
    market_trends: intelligence.marketTrends,
    alerts: intelligence.alerts,
    weekly_summary: intelligence.weeklySummary,
    raw_data: combinedData.slice(0, 10000), // Truncate if needed
    scanned_at: new Date().toISOString(),
  })

  // Send weekly summary email to admin/hosts
  if (process.env.SENDGRID_API_KEY) {
    const { data: hosts } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('role', 'host')
      .eq('weekly_digest_enabled', true)

    for (const host of hosts || []) {
      if (!host.email) continue

      const eventsList = intelligence.upcomingDemandEvents
        .slice(0, 5)
        .map(e => `<li>${e.name} (${e.date}) - ${e.expectedImpact} impact</li>`)
        .join('')

      const alertsList = intelligence.alerts
        .map(a => `<li><strong>${a.type.toUpperCase()}:</strong> ${a.message}</li>`)
        .join('')

      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: host.email }] }],
          from: { 
            email: process.env.SENDGRID_FROM_EMAIL || 'commandcontrol@rentanddrive.net', 
            name: 'Command&Control | R&D Intelligence' 
          },
          subject: 'Weekly Market Intelligence Report',
          content: [{
            type: 'text/html',
            value: `
              <h2>Weekly Market Intelligence</h2>
              <p>Hi ${host.full_name || 'Host'},</p>
              
              <h3>Executive Summary</h3>
              <p>${intelligence.weeklySummary}</p>
              
              <h3>Market Position</h3>
              <ul>
                <li><strong>Competitor Avg Rate:</strong> $${intelligence.avgCompetitorRate}/day</li>
                <li><strong>Your Position:</strong> ${intelligence.ratePosition} market average</li>
                <li><strong>Turo Listings (AWD):</strong> ~${intelligence.turoListingCount} in area</li>
              </ul>
              
              <h3>Upcoming Demand Events</h3>
              <ul>${eventsList || '<li>No major events detected</li>'}</ul>
              
              <h3>Alerts & Opportunities</h3>
              <ul>${alertsList || '<li>No alerts this week</li>'}</ul>
              
              <h3>Market Trends</h3>
              <ul>${intelligence.marketTrends.map(t => `<li>${t}</li>`).join('')}</ul>
              
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/host">View Dashboard</a></p>
              
              <p style="color: #666; font-size: 12px;">
                Command&Control | R&D Intelligence System<br>
                This report was generated automatically.
              </p>
            `,
          }],
        }),
      })

      await new Promise(r => setTimeout(r, 100)) // Rate limit emails
    }
  }

  return intelligence
}

// Get latest market snapshot
export async function getLatestMarketSnapshot(): Promise<MarketIntelligence | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('competitor_snapshots')
    .select('*')
    .eq('market_area', 'reno_tahoe')
    .order('scanned_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return null

  return {
    avgCompetitorRate: data.avg_daily_rate,
    ratePosition: data.avg_daily_rate > 120 ? 'below' : data.avg_daily_rate < 80 ? 'above' : 'at',
    upcomingDemandEvents: data.upcoming_events || [],
    alerts: data.alerts || [],
    weeklySummary: data.weekly_summary || '',
    turoListingCount: data.vehicle_count || 0,
    marketTrends: data.market_trends || [],
  }
}

// Search for specific vehicle pricing
export async function searchVehiclePricing(make: string, model: string, year: number): Promise<{
  avgRate: number
  minRate: number
  maxRate: number
  listingCount: number
  source: string
}> {
  const query = `Turo ${year} ${make} ${model} rental price Reno Nevada daily rate`
  
  const result = await routeAIRequest({
    taskType: 'market_intelligence',
    agentName: AGENT_NAME,
    actionType: 'search_vehicle_pricing',
    system: `Search for rental pricing and return JSON: {"avgRate": number, "minRate": number, "maxRate": number, "listingCount": number}`,
    prompt: query,
    maxTokens: 256,
  })

  try {
    const parsed = JSON.parse(result.text.replace(/```json\n?|\n?```/g, ''))
    return {
      avgRate: parsed.avgRate || 100,
      minRate: parsed.minRate || 75,
      maxRate: parsed.maxRate || 150,
      listingCount: parsed.listingCount || 5,
      source: 'perplexity_search',
    }
  } catch {
    return {
      avgRate: 100,
      minRate: 75,
      maxRate: 150,
      listingCount: 0,
      source: 'default',
    }
  }
}

// Get real-time conditions (weather, traffic, events today)
export async function getRealTimeConditions(): Promise<{
  weather: { temp: number; condition: string; roadConditions: string }
  activeEvents: string[]
  trafficAlerts: string[]
}> {
  const result = await routeAIRequest({
    taskType: 'realtime_conditions',
    agentName: AGENT_NAME,
    actionType: 'get_realtime_conditions',
    system: `Get current conditions for Reno/Tahoe area. Return JSON:
{
  "weather": {"temp": number, "condition": string, "roadConditions": string},
  "activeEvents": ["event names happening today"],
  "trafficAlerts": ["any road closures or issues"]
}`,
    prompt: 'Current weather, road conditions, and events in Reno Lake Tahoe area right now',
    maxTokens: 512,
  })

  try {
    const parsed = JSON.parse(result.text.replace(/```json\n?|\n?```/g, ''))
    return {
      weather: parsed.weather || { temp: 65, condition: 'Unknown', roadConditions: 'Unknown' },
      activeEvents: parsed.activeEvents || [],
      trafficAlerts: parsed.trafficAlerts || [],
    }
  } catch {
    return {
      weather: { temp: 65, condition: 'Unknown', roadConditions: 'Check local sources' },
      activeEvents: [],
      trafficAlerts: [],
    }
  }
}

// Class wrapper for API routes
export class CommandControlAgent {
  async scanMarket(region: string = 'reno') {
    return runWeeklyMarketScan()
  }
  async scanUpcomingEvents() {
    const snapshot = await getLatestMarketSnapshot()
    return snapshot?.upcomingDemandEvents || []
  }
  async scanCompetitorPricing(category?: string) {
    return getLatestMarketSnapshot()
  }
  async generateReport() {
    return runWeeklyMarketScan()
  }
}
