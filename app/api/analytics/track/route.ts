import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.text()
    const event = JSON.parse(data)

    // Optionally store events in Supabase for internal analytics
    const supabase = await createClient()
    
    await supabase.from('analytics_events').insert({
      event_name: event.event,
      properties: event.properties,
      url: event.url,
      user_agent: request.headers.get('user-agent'),
      ip_country: request.headers.get('cf-ipcountry'),
      created_at: event.timestamp,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // Silently accept - analytics should never fail
    return NextResponse.json({ success: true })
  }
}
