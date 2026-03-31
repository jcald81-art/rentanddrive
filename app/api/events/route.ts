import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface LocalEvent {
  id: string
  name: string
  venue: string
  date: string
  endDate?: string
  category: string
  demandIncrease: 'low' | 'moderate' | 'high' | 'extreme'
  market: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const market = searchParams.get('market') || 'all'
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    
    // Build query for upcoming events
    let query = supabase
      .from('local_events')
      .select('*')
      .eq('active', true)
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(limit)
    
    // Filter by market if specified
    if (market !== 'all') {
      query = query.eq('market', market)
    }
    
    const { data: dbEvents, error } = await query
    
    if (error) {
      console.error('Error fetching events from database:', error)
      return NextResponse.json({ events: [], marketOutlook: 'steady', error: error.message }, { status: 500 })
    }
    
    // Transform database events to expected format
    const events: LocalEvent[] = (dbEvents || []).map(event => ({
      id: event.id,
      name: event.event_name,
      venue: event.venue ? `${event.venue}, ${event.city}` : event.city,
      date: event.start_date,
      endDate: event.end_date,
      category: event.category,
      demandIncrease: event.demand_level as 'low' | 'moderate' | 'high' | 'extreme',
      market: event.market,
    }))
    
    // Calculate overall market demand
    const demandScores = { low: 1, moderate: 2, high: 3, extreme: 4 }
    const avgDemand = events.reduce((sum, e) => sum + (demandScores[e.demandIncrease] || 2), 0) / Math.max(events.length, 1)
    
    let marketOutlook: 'slow' | 'steady' | 'busy' | 'peak' = 'steady'
    if (avgDemand >= 3.5) marketOutlook = 'peak'
    else if (avgDemand >= 2.5) marketOutlook = 'busy'
    else if (avgDemand >= 1.5) marketOutlook = 'steady'
    else marketOutlook = 'slow'
    
    return NextResponse.json({
      events,
      marketOutlook,
      lastUpdated: new Date().toISOString(),
      region: 'Reno-Sparks-Lake Tahoe'
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ events: [], marketOutlook: 'steady', error: 'Failed to fetch events' }, { status: 500 })
  }
}
