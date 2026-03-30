import { NextRequest, NextResponse } from 'next/server'

// In-memory store for demo (would be database in production)
const rateSchedules: Record<string, any[]> = {}

function generateSchedule(vehicleId: string, floorPrice = 65, ceilingPrice = 150) {
  const schedule: any[] = []
  const today = new Date()
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    
    const isWeekend = [0, 6].includes(date.getDay())
    const isSmartRate = Math.random() > 0.25 // 75% SmartRate
    
    // Base rate varies by day
    let rate = 85
    let reason = 'Base rate'
    
    if (isSmartRate) {
      // Apply random adjustments
      const adjustments = []
      
      if (isWeekend) {
        rate += 15
        adjustments.push('Weekend premium')
      }
      
      if (Math.random() > 0.7) {
        rate += 20
        adjustments.push('High demand')
      }
      
      if (Math.random() > 0.8) {
        rate += 25
        adjustments.push('Local event')
      }
      
      // Clamp
      rate = Math.min(Math.max(rate, floorPrice), ceilingPrice)
      reason = adjustments.length > 0 ? adjustments.join(', ') : 'Optimized rate'
    }
    
    schedule.push({
      date: date.toISOString().split('T')[0],
      rate,
      setBy: isSmartRate ? 'smartrate' : 'manual',
      reason,
      isWeekend
    })
  }
  
  return schedule
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const vehicleId = searchParams.get('vehicleId')
  
  if (!vehicleId) {
    return NextResponse.json(
      { error: 'vehicleId is required' },
      { status: 400 }
    )
  }
  
  // Get or generate schedule
  if (!rateSchedules[vehicleId]) {
    rateSchedules[vehicleId] = generateSchedule(vehicleId)
  }
  
  return NextResponse.json({
    vehicleId,
    schedule: rateSchedules[vehicleId],
    generated: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicleId, date, rate, reason } = body
    
    if (!vehicleId || !date || !rate) {
      return NextResponse.json(
        { error: 'vehicleId, date, and rate are required' },
        { status: 400 }
      )
    }
    
    // Initialize schedule if needed
    if (!rateSchedules[vehicleId]) {
      rateSchedules[vehicleId] = generateSchedule(vehicleId)
    }
    
    // Find and update the specific date
    const dayIndex = rateSchedules[vehicleId].findIndex(d => d.date === date)
    
    if (dayIndex === -1) {
      return NextResponse.json(
        { error: 'Date not found in schedule' },
        { status: 404 }
      )
    }
    
    // Update with manual override
    rateSchedules[vehicleId][dayIndex] = {
      ...rateSchedules[vehicleId][dayIndex],
      rate,
      setBy: 'manual',
      reason: reason || 'Manual override',
      overriddenAt: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      updated: rateSchedules[vehicleId][dayIndex]
    })
  } catch (error) {
    console.error('Schedule update error:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
}
