import { NextResponse } from 'next/server'

// Real-time events that drive rental demand in Reno/Sparks/Lake Tahoe
// In production, this would fetch from event APIs like Ticketmaster, Eventbrite, local tourism boards

interface LocalEvent {
  id: string
  name: string
  venue: string
  date: string
  endDate?: string
  category: 'concert' | 'sports' | 'convention' | 'festival' | 'holiday' | 'ski' | 'outdoor'
  expectedAttendance: number
  demandIncrease: 'low' | 'moderate' | 'high' | 'extreme'
  description: string
  bookingTip: string
}

// Simulated real-time event data - would be replaced with actual API calls
function getUpcomingEvents(): LocalEvent[] {
  const now = new Date()
  
  // Generate dynamic events based on current date
  const events: LocalEvent[] = []
  
  // Check for ski season (Nov-Apr)
  const month = now.getMonth()
  if (month >= 10 || month <= 3) {
    events.push({
      id: 'ski-season',
      name: 'Lake Tahoe Ski Season',
      venue: 'Multiple Resorts - Heavenly, Northstar, Palisades',
      date: new Date(now.getFullYear(), 10, 15).toISOString(),
      endDate: new Date(now.getFullYear() + 1, 3, 15).toISOString(),
      category: 'ski',
      expectedAttendance: 50000,
      demandIncrease: 'extreme',
      description: 'Peak ski season brings thousands of visitors weekly seeking AWD vehicles and SUVs',
      bookingTip: 'AWD and 4x4 vehicles see 3x demand. Book early for weekend rentals.'
    })
  }
  
  // Weekend surge
  const dayOfWeek = now.getDay()
  if (dayOfWeek === 4 || dayOfWeek === 5) { // Thursday or Friday
    events.push({
      id: 'weekend-surge',
      name: 'Weekend Travel Surge',
      venue: 'Reno-Tahoe Region',
      date: now.toISOString(),
      category: 'holiday',
      expectedAttendance: 15000,
      demandIncrease: 'moderate',
      description: 'Weekend travelers from Bay Area and Sacramento heading to Tahoe',
      bookingTip: 'List vehicles by Thursday for maximum weekend bookings.'
    })
  }

  // Add upcoming events for the next 30 days
  const upcomingStaticEvents: Omit<LocalEvent, 'date'>[] = [
    {
      id: 'hot-august-nights',
      name: 'Hot August Nights',
      venue: 'Downtown Reno & Sparks',
      category: 'festival',
      expectedAttendance: 800000,
      demandIncrease: 'extreme',
      description: 'The world\'s largest classic car event brings collectors and enthusiasts from across the country',
      bookingTip: 'Classic and convertible vehicles are in highest demand. Book 2 weeks ahead.'
    },
    {
      id: 'street-vibrations',
      name: 'Street Vibrations Fall Rally',
      venue: 'Downtown Reno',
      category: 'festival',
      expectedAttendance: 50000,
      demandIncrease: 'high',
      description: 'Major motorcycle rally draws riders from Western states',
      bookingTip: 'Truck and SUV rentals increase for hauling bikes.'
    },
    {
      id: 'burning-man',
      name: 'Burning Man',
      venue: 'Black Rock Desert (via Reno)',
      category: 'festival',
      expectedAttendance: 80000,
      demandIncrease: 'extreme',
      description: 'Annual arts festival creates massive rental demand in Reno as gateway city',
      bookingTip: 'Trucks and SUVs for desert travel. Consider special event pricing.'
    },
    {
      id: 'reno-air-races',
      name: 'National Championship Air Races',
      venue: 'Reno Stead Airport',
      category: 'sports',
      expectedAttendance: 150000,
      demandIncrease: 'high',
      description: 'World\'s fastest motorsport attracts aviation enthusiasts nationally',
      bookingTip: 'High demand for all vehicle types. Shuttle services also needed.'
    },
    {
      id: 'great-reno-balloon-race',
      name: 'Great Reno Balloon Race',
      venue: 'Rancho San Rafael Regional Park',
      category: 'festival',
      expectedAttendance: 120000,
      demandIncrease: 'moderate',
      description: 'Largest free hot-air balloon event brings families from across region',
      bookingTip: 'Family-friendly SUVs and minivans in demand. Early morning pickups popular.'
    },
    {
      id: 'unr-football',
      name: 'Nevada Wolf Pack Home Game',
      venue: 'Mackay Stadium, UNR',
      category: 'sports',
      expectedAttendance: 25000,
      demandIncrease: 'moderate',
      description: 'College football game days bring alumni and visiting fans',
      bookingTip: 'Saturday rentals peak. Consider game day premium pricing.'
    },
    {
      id: 'sparks-hometown-christmas',
      name: 'Sparks Hometowne Christmas',
      venue: 'Victorian Square, Sparks',
      category: 'holiday',
      expectedAttendance: 35000,
      demandIncrease: 'moderate',
      description: 'Holiday parade and festivities draw regional visitors',
      bookingTip: 'Family vehicles and comfortable sedans preferred.'
    },
    {
      id: 'americas-most-beautiful-roadster',
      name: 'America\'s Most Beautiful Roadster Show',
      venue: 'Grand Sierra Resort',
      category: 'convention',
      expectedAttendance: 25000,
      demandIncrease: 'moderate',
      description: 'Premier indoor car show attracts collectors and enthusiasts',
      bookingTip: 'Classic car enthusiasts may want to rent fun vehicles to drive.'
    }
  ]
  
  // Add events with dynamic dates in the next 60 days
  upcomingStaticEvents.forEach((event, index) => {
    const eventDate = new Date(now)
    eventDate.setDate(eventDate.getDate() + (index * 7) + 3) // Spread events out
    
    events.push({
      ...event,
      date: eventDate.toISOString()
    })
  })
  
  // Sort by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  // Return only next 30 days of events
  const thirtyDaysFromNow = new Date(now)
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  
  return events.filter(e => new Date(e.date) <= thirtyDaysFromNow).slice(0, 8)
}

export async function GET() {
  try {
    const events = getUpcomingEvents()
    
    // Calculate overall market demand
    const demandScores = { low: 1, moderate: 2, high: 3, extreme: 4 }
    const avgDemand = events.reduce((sum, e) => sum + demandScores[e.demandIncrease], 0) / Math.max(events.length, 1)
    
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
