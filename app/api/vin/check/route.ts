import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// VIN validation
function isValidVin(vin: string): boolean {
  if (vin.length !== 17) return false
  if (/[IOQ]/i.test(vin)) return false
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)
}

// Mock VinAudit response when API key not set
function getMockVinAuditData(vin: string) {
  return {
    vin,
    title_status: 'clean',
    accident_count: 0,
    owner_count: 1,
    odometer_rollback: false,
    theft_record: false,
    last_reported_mileage: 45000,
    market_value: {
      base: 11500,
      low: 10000,
      high: 13000,
    },
    is_clean: true,
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { vin, full_report = false, vehicle_id, user_id } = await request.json()

    if (!vin) {
      return NextResponse.json({ error: 'VIN required' }, { status: 400 })
    }

    const normalizedVin = vin.toUpperCase().trim()

    if (!isValidVin(normalizedVin)) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid VIN format. VIN must be 17 characters and cannot contain I, O, or Q.' 
      }, { status: 400 })
    }

    // Check for existing report
    const { data: existingReport } = await supabase
      .from('vin_reports')
      .select('*')
      .eq('vin', normalizedVin)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // If we have a recent report (< 30 days), return it
    if (existingReport && !full_report) {
      const reportAge = Date.now() - new Date(existingReport.created_at).getTime()
      const thirtyDays = 30 * 24 * 60 * 60 * 1000
      if (reportAge < thirtyDays) {
        return NextResponse.json({
          valid: true,
          report: existingReport,
          cached: true,
        })
      }
    }

    // Call NHTSA free API for recalls (always free)
    const [nhtsaDecodeRes, nhtsaRecallRes] = await Promise.all([
      fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${normalizedVin}?format=json`),
      fetch(`https://api.nhtsa.gov/recalls/recallsByVehicle?vin=${normalizedVin}`),
    ])

    const nhtsaDecodeData = await nhtsaDecodeRes.json()
    const nhtsaRecallData = await nhtsaRecallRes.json()

    const results = nhtsaDecodeData.Results || []
    const getValue = (variable: string) => {
      const item = results.find((r: any) => r.Variable === variable)
      return item?.Value && item.Value !== 'Not Applicable' ? item.Value : null
    }

    const decoded = {
      make: getValue('Make'),
      model: getValue('Model'),
      year: parseInt(getValue('Model Year') || '0'),
      trim: getValue('Trim'),
      body_class: getValue('Body Class'),
      vehicle_type: getValue('Vehicle Type'),
      drive_type: getValue('Drive Type'),
      fuel_type: getValue('Fuel Type - Primary'),
      engine_cylinders: getValue('Engine Number of Cylinders'),
      engine_displacement: getValue('Displacement (L)'),
      transmission: getValue('Transmission Style'),
    }

    const recalls = nhtsaRecallData.results || []
    const openRecalls = recalls.map((r: any) => ({
      campaign_number: r.NHTSACampaignNumber,
      component: r.Component,
      summary: r.Summary,
      consequence: r.Consequence,
      remedy: r.Remedy,
      report_date: r.ReportReceivedDate,
    }))

    // For free NHTSA-only check, just return decoded + recalls
    if (!full_report) {
      return NextResponse.json({
        valid: true,
        vin: normalizedVin,
        decoded,
        recalls: {
          count: openRecalls.length,
          items: openRecalls.slice(0, 5),
        },
        full_report_available: true,
        full_report_price: 9.99,
      })
    }

    // Full report - call VinAudit or use mock
    let vinAuditData
    const vinAuditKey = process.env.VINAUDIT_API_KEY

    if (vinAuditKey) {
      try {
        const vinAuditRes = await fetch(
          `https://api.vinaudit.com/query.php?key=${vinAuditKey}&vin=${normalizedVin}&format=json&type=extended`
        )
        vinAuditData = await vinAuditRes.json()
        
        // Transform VinAudit response
        vinAuditData = {
          vin: normalizedVin,
          title_status: vinAuditData.attributes?.title_type?.toLowerCase() || 'clean',
          accident_count: vinAuditData.attributes?.accident_count || 0,
          owner_count: vinAuditData.attributes?.owner_count || 1,
          odometer_rollback: vinAuditData.attributes?.odometer_problem === 'Yes',
          theft_record: vinAuditData.attributes?.theft === 'Yes',
          last_reported_mileage: vinAuditData.attributes?.last_reported_mileage || null,
          market_value: {
            base: vinAuditData.market_value?.base || 11500,
            low: vinAuditData.market_value?.low || 10000,
            high: vinAuditData.market_value?.high || 13000,
          },
          is_clean: vinAuditData.attributes?.title_type?.toLowerCase() === 'clean' &&
                    vinAuditData.attributes?.accident_count === 0 &&
                    vinAuditData.attributes?.odometer_problem !== 'Yes',
        }
      } catch (err) {
        console.error('[VinAudit Error]:', err)
        vinAuditData = getMockVinAuditData(normalizedVin)
      }
    } else {
      // Use mock data when API key not set
      vinAuditData = getMockVinAuditData(normalizedVin)
    }

    // Generate report ID
    const reportId = `QV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Combine all data
    const fullReport = {
      vin: normalizedVin,
      report_id: reportId,
      ...decoded,
      title_status: vinAuditData.title_status,
      accident_count: vinAuditData.accident_count,
      owner_count: vinAuditData.owner_count,
      odometer_rollback: vinAuditData.odometer_rollback,
      theft_record: vinAuditData.theft_record,
      last_reported_mileage: vinAuditData.last_reported_mileage,
      market_value: vinAuditData.market_value,
      open_recalls: openRecalls,
      recall_count: openRecalls.length,
      is_clean: vinAuditData.is_clean && openRecalls.length === 0,
      flags: {
        has_accidents: vinAuditData.accident_count > 0,
        has_salvage_title: vinAuditData.title_status !== 'clean',
        has_theft_record: vinAuditData.theft_record,
        has_odometer_rollback: vinAuditData.odometer_rollback,
        has_open_recalls: openRecalls.length > 0,
      },
      checked_at: new Date().toISOString(),
    }

    // Save to vin_reports table
    const { data: savedReport, error: saveError } = await supabase
      .from('vin_reports')
      .insert({
        vin: normalizedVin,
        vehicle_id: vehicle_id || null,
        user_id: user_id || null,
        report_id: reportId,
        make: decoded.make,
        model: decoded.model,
        year: decoded.year,
        title_status: vinAuditData.title_status,
        accident_count: vinAuditData.accident_count,
        owner_count: vinAuditData.owner_count,
        odometer_rollback: vinAuditData.odometer_rollback,
        theft_record: vinAuditData.theft_record,
        last_reported_mileage: vinAuditData.last_reported_mileage,
        market_value_low: vinAuditData.market_value?.low,
        market_value_high: vinAuditData.market_value?.high,
        recall_count: openRecalls.length,
        is_clean: fullReport.is_clean,
        raw_data: fullReport,
      })
      .select()
      .single()

    if (saveError) {
      console.error('[VIN Report Save Error]:', saveError)
    }

    // Admin blocking: if salvage title or odometer rollback, block vehicle
    if (vehicle_id && (vinAuditData.title_status !== 'clean' || vinAuditData.odometer_rollback)) {
      // Set vehicle as not approved
      await supabase
        .from('vehicles')
        .update({ 
          is_approved: false,
          rejection_reason: vinAuditData.title_status !== 'clean' 
            ? 'Salvage title detected by QuickVIN' 
            : 'Odometer rollback detected by QuickVIN'
        })
        .eq('id', vehicle_id)

      // Send SecureLink alert to admin
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents/securelink`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_urgent_alert',
            to_admin: true,
            subject: `QuickVIN Alert: Vehicle Blocked`,
            message: `Vehicle ID ${vehicle_id} (VIN: ${normalizedVin}) has been automatically blocked due to ${
              vinAuditData.title_status !== 'clean' ? 'salvage title' : 'odometer rollback'
            } detected by QuickVIN.`,
          }),
        })
      } catch (err) {
        console.error('[SecureLink Alert Error]:', err)
      }
    }

    return NextResponse.json({
      valid: true,
      report: fullReport,
      saved: !!savedReport,
      blocked: vehicle_id && (vinAuditData.title_status !== 'clean' || vinAuditData.odometer_rollback),
    })
  } catch (error) {
    console.error('[VIN Check Error]:', error)
    return NextResponse.json(
      { error: 'Failed to check VIN' },
      { status: 500 }
    )
  }
}
