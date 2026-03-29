import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const NHTSA_BASE_URL = 'https://api.nhtsa.gov'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  try {
    const { vin } = await params
    
    if (!vin || vin.length !== 17) {
      return NextResponse.json({ error: 'Invalid VIN - must be 17 characters' }, { status: 400 })
    }

    // First decode the VIN to get make, model, year
    const decodeResponse = await fetch(
      `${NHTSA_BASE_URL}/vehicles/DecodeVinValues/${vin}?format=json`,
      { headers: { 'Accept': 'application/json' } }
    )

    if (!decodeResponse.ok) {
      throw new Error(`NHTSA Decode API error: ${decodeResponse.status}`)
    }

    const decodeData = await decodeResponse.json()
    const decodedVehicle = decodeData.Results?.[0]

    if (!decodedVehicle || !decodedVehicle.Make || !decodedVehicle.Model || !decodedVehicle.ModelYear) {
      return NextResponse.json({ 
        error: 'Could not decode VIN to get vehicle details',
        vin 
      }, { status: 400 })
    }

    const make = decodedVehicle.Make
    const model = decodedVehicle.Model
    const year = decodedVehicle.ModelYear

    // Call NHTSA Complaints API
    const complaintsResponse = await fetch(
      `${NHTSA_BASE_URL}/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`,
      { headers: { 'Accept': 'application/json' } }
    )

    if (!complaintsResponse.ok) {
      throw new Error(`NHTSA Complaints API error: ${complaintsResponse.status}`)
    }

    const complaintsData = await complaintsResponse.json()
    const complaints = complaintsData.results || []

    // Process complaints - group by component and count
    const componentCounts: Record<string, { count: number; complaints: Array<{ summary: string; date: string; crash: boolean; injury: boolean }> }> = {}
    
    for (const complaint of complaints) {
      const component = complaint.components || 'Unknown'
      if (!componentCounts[component]) {
        componentCounts[component] = { count: 0, complaints: [] }
      }
      componentCounts[component].count++
      
      // Keep top 3 complaints per component
      if (componentCounts[component].complaints.length < 3) {
        componentCounts[component].complaints.push({
          summary: complaint.summary || '',
          date: complaint.dateOfIncident || complaint.dateComplaintFiled || '',
          crash: complaint.crash === 'Yes',
          injury: complaint.injuries > 0,
        })
      }
    }

    // Sort by count and get top 5 components
    const topComponents = Object.entries(componentCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([component, data]) => ({
        component,
        total_complaints: data.count,
        sample_complaints: data.complaints,
      }))

    // Calculate crash and injury stats
    const totalCrashes = complaints.filter((c: { crash?: string }) => c.crash === 'Yes').length
    const totalInjuries = complaints.reduce((sum: number, c: { injuries?: number }) => sum + (c.injuries || 0), 0)
    const totalDeaths = complaints.reduce((sum: number, c: { deaths?: number }) => sum + (c.deaths || 0), 0)

    return NextResponse.json({
      vin: vin.toUpperCase(),
      vehicle: { make, model, year },
      total_complaints: complaints.length,
      summary: {
        total_crashes: totalCrashes,
        total_injuries: totalInjuries,
        total_deaths: totalDeaths,
      },
      top_components: topComponents,
      checked_at: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[NHTSA Complaints API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch complaints' },
      { status: 500 }
    )
  }
}
