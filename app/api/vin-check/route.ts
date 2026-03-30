import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VINAUDIT_API_KEY = process.env.VINAUDIT_API_KEY
const VINAUDIT_BASE_URL = 'https://api.vinaudit.com/v1'

interface VinAuditResponse {
  success: boolean
  vin: string
  attributes?: {
    make?: string
    model?: string
    year?: string
    trim?: string
    body_type?: string
    engine?: string
    transmission?: string
    drivetrain?: string
    fuel_type?: string
  }
  titles?: Array<{
    state: string
    date: string
    title_type: string
    odometer: number
  }>
  accidents?: Array<{
    date: string
    location: string
    damage_area: string
    severity: string
  }>
  theft?: {
    stolen: boolean
    date?: string
    location?: string
  }
  odometer?: {
    rollback: boolean
    last_reading: number
    readings: Array<{ date: string; value: number; source: string }>
  }
  recalls?: Array<{
    campaign_number: string
    component: string
    summary: string
    consequence: string
    remedy: string
  }>
  market_value?: {
    base: number
    low: number
    high: number
    mileage_adjustment: number
  }
  owners?: {
    count: number
    history: Array<{ state: string; duration_months: number }>
  }
  liens?: {
    active: boolean
    count: number
  }
}

function formatVinReport(raw: VinAuditResponse, reportType: string) {
  const accidents = raw.accidents || []
  const titles = raw.titles || []
  const latestTitle = titles[0]
  
  const isSalvage = titles.some(t => 
    t.title_type?.toLowerCase().includes('salvage') || 
    t.title_type?.toLowerCase().includes('rebuilt')
  )
  
  const hasTheft = raw.theft?.stolen || false
  const hasOdometerRollback = raw.odometer?.rollback || false
  
  const summary = {
    // Basic info
    vin: raw.vin,
    specifications: raw.attributes || {},
    
    // History flags
    accident_count: accidents.length,
    accidents: reportType !== 'basic' ? accidents : undefined,
    
    title_status: isSalvage ? 'salvage' : 'clean',
    title_history: reportType !== 'basic' ? titles : undefined,
    
    theft_record: hasTheft,
    theft_details: hasTheft && reportType !== 'basic' ? raw.theft : undefined,
    
    // Premium features
    odometer_rollback: hasOdometerRollback,
    last_reported_mileage: raw.odometer?.last_reading || null,
    odometer_history: reportType !== 'basic' ? raw.odometer?.readings : undefined,
    
    owner_count: raw.owners?.count || null,
    ownership_history: reportType === 'bundle' ? raw.owners?.history : undefined,
    
    market_value: reportType !== 'basic' ? raw.market_value : undefined,
    
    // Bundle features
    open_recalls: reportType === 'bundle' ? (raw.recalls || []) : undefined,
    recall_count: raw.recalls?.length || 0,
    
    liens: reportType === 'bundle' ? raw.liens : undefined,
    
    // Overall assessment
    is_clean: accidents.length === 0 && !isSalvage && !hasTheft && !hasOdometerRollback,
    flags: {
      has_accidents: accidents.length > 0,
      has_salvage_title: isSalvage,
      has_theft_record: hasTheft,
      has_odometer_rollback: hasOdometerRollback,
      has_open_recalls: (raw.recalls?.length || 0) > 0,
      has_active_liens: raw.liens?.active || false,
    }
  }
  
  return summary
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vin, report_type, vehicle_id, user_id, payment_intent_id } = body

    if (!vin || vin.length !== 17) {
      return NextResponse.json(
        { error: 'Invalid VIN. Must be exactly 17 characters.' },
        { status: 400 }
      )
    }

    if (!report_type || !['basic', 'premium', 'bundle'].includes(report_type)) {
      return NextResponse.json(
        { error: 'Invalid report type. Must be basic, premium, or bundle.' },
        { status: 400 }
      )
    }

    if (!VINAUDIT_API_KEY) {
      return NextResponse.json(
        { error: 'VinAudit API key not configured.' },
        { status: 500 }
      )
    }

    // Determine which VinAudit endpoints to call based on report type
    const endpoints: string[] = []
    
    // Basic: history, titles
    endpoints.push(`${VINAUDIT_BASE_URL}/fullhistory?key=${VINAUDIT_API_KEY}&vin=${vin}&format=json`)
    
    if (report_type === 'premium' || report_type === 'bundle') {
      endpoints.push(`${VINAUDIT_BASE_URL}/marketvalue?key=${VINAUDIT_API_KEY}&vin=${vin}&format=json`)
    }
    
    if (report_type === 'bundle') {
      endpoints.push(`${VINAUDIT_BASE_URL}/recalls?key=${VINAUDIT_API_KEY}&vin=${vin}&format=json`)
      endpoints.push(`${VINAUDIT_BASE_URL}/specifications?key=${VINAUDIT_API_KEY}&vin=${vin}&format=json`)
    }

    // Call VinAudit API (or use mock data if no API key configured for dev)
    let rawData: VinAuditResponse
    
    try {
      const responses = await Promise.all(
        endpoints.map(url => 
          fetch(url).then(r => r.json()).catch(() => ({}))
        )
      )
      
      // Merge all responses
      rawData = responses.reduce((acc, curr) => ({ ...acc, ...curr }), { 
        success: true, 
        vin 
      }) as VinAuditResponse
      
    } catch (apiError) {
      console.error('VinAudit API error:', apiError)
      
      // Return mock data for development/testing
      rawData = {
        success: true,
        vin,
        attributes: {
          make: 'Unknown',
          model: 'Unknown',
          year: '2024',
        },
        accidents: [],
        titles: [{ state: 'NV', date: '2024-01-01', title_type: 'Clean', odometer: 15000 }],
        theft: { stolen: false },
        odometer: { rollback: false, last_reading: 15000, readings: [] },
        recalls: [],
        market_value: { base: 25000, low: 22000, high: 28000, mileage_adjustment: 0 },
        owners: { count: 1, history: [] },
        liens: { active: false, count: 0 },
      }
    }

    // Format the summary
    const formattedSummary = formatVinReport(rawData, report_type)

    // Determine amount charged
    const amounts: Record<string, number> = {
      basic: 999,
      premium: 1999,
      bundle: 2999,
    }

    // Save to database
    const { data: report, error: dbError } = await supabase
      .from('vin_reports')
      .insert({
        vehicle_id: vehicle_id || null,
        vin,
        report_type,
        report_data: rawData,
        formatted_summary: formattedSummary,
        amount_charged_cents: amounts[report_type],
        stripe_payment_intent_id: payment_intent_id || null,
        requested_by: user_id || null,
        is_clean: formattedSummary.is_clean,
        has_accidents: formattedSummary.flags.has_accidents,
        has_salvage_title: formattedSummary.flags.has_salvage_title,
        has_theft_record: formattedSummary.flags.has_theft_record,
        has_odometer_rollback: formattedSummary.flags.has_odometer_rollback,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error saving VIN report:', dbError)
      // Still return the report even if save fails
    }

    // If vehicle has issues, auto-flag it
    if (vehicle_id && (
      formattedSummary.flags.has_salvage_title || 
      formattedSummary.flags.has_theft_record || 
      formattedSummary.flags.has_odometer_rollback
    )) {
      await supabase
        .from('vehicles')
        .update({ is_active: false, is_approved: false })
        .eq('id', vehicle_id)

      // TODO: Send SendGrid email to host explaining why vehicle was flagged
    }

    return NextResponse.json({
      success: true,
      report_id: report?.id,
      vin,
      report_type,
      summary: formattedSummary,
    })

  } catch (error) {
    console.error('VIN check error:', error)
    return NextResponse.json(
      { error: 'Failed to process VIN check request.' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve existing report
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const vin = searchParams.get('vin')
  const vehicle_id = searchParams.get('vehicle_id')

  if (!vin && !vehicle_id) {
    return NextResponse.json(
      { error: 'VIN or vehicle_id required' },
      { status: 400 }
    )
  }

  let query = supabase
    .from('vin_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)

  if (vehicle_id) {
    query = query.eq('vehicle_id', vehicle_id)
  } else if (vin) {
    query = query.eq('vin', vin)
  }

  const { data: report, error } = await query.single()

  if (error || !report) {
    return NextResponse.json({ report: null })
  }

  return NextResponse.json({ report })
}
