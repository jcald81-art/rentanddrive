import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// NHTSA API - completely free, no API key required
const NHTSA_BASE_URL = 'https://api.nhtsa.gov'

// Severity classification based on component type
function classifySeverity(component: string, summary: string): 'CRITICAL' | 'WARNING' | 'INFO' {
  const lowerComponent = component.toLowerCase()
  const lowerSummary = summary.toLowerCase()
  
  // CRITICAL: Fire, airbag, brake, steering, fuel system issues
  const criticalKeywords = [
    'fire', 'airbag', 'air bag', 'brake', 'braking', 'steering', 
    'fuel', 'accelerator', 'throttle', 'seat belt', 'seatbelt',
    'child seat', 'explosion', 'crash', 'rollover', 'sudden acceleration'
  ]
  
  for (const keyword of criticalKeywords) {
    if (lowerComponent.includes(keyword) || lowerSummary.includes(keyword)) {
      return 'CRITICAL'
    }
  }
  
  // WARNING: Electrical, structural, suspension, transmission issues
  const warningKeywords = [
    'electrical', 'wiring', 'short circuit', 'structural', 'frame',
    'suspension', 'transmission', 'engine', 'power loss', 'stall',
    'door', 'hood', 'latch', 'wheel', 'tire', 'axle'
  ]
  
  for (const keyword of warningKeywords) {
    if (lowerComponent.includes(keyword) || lowerSummary.includes(keyword)) {
      return 'WARNING'
    }
  }
  
  // INFO: Minor issues
  return 'INFO'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  try {
    const { vin } = await params
    
    if (!vin || vin.length !== 17) {
      return NextResponse.json({ error: 'Invalid VIN - must be 17 characters' }, { status: 400 })
    }

    // Get vehicle_id if this VIN exists in our database
    const { data: vehicle } = await supabaseAdmin
      .from('vehicles')
      .select('id, host_id, make, model, year')
      .eq('vin', vin.toUpperCase())
      .single()

    // Call NHTSA Recalls API
    const nhtsaResponse = await fetch(
      `${NHTSA_BASE_URL}/recalls/recallsByVehicle?vin=${vin}`,
      { headers: { 'Accept': 'application/json' } }
    )

    if (!nhtsaResponse.ok) {
      throw new Error(`NHTSA API error: ${nhtsaResponse.status}`)
    }

    const nhtsaData = await nhtsaResponse.json()
    const recalls = nhtsaData.results || []

    // Process and classify recalls
    const processedRecalls = recalls.map((recall: {
      NHTSACampaignNumber?: string
      Component?: string
      Summary?: string
      Consequence?: string
      Remedy?: string
      ReportReceivedDate?: string
      Manufacturer?: string
    }) => {
      const component = recall.Component || ''
      const summary = recall.Summary || ''
      const severity = classifySeverity(component, summary)
      
      return {
        nhtsa_campaign_id: recall.NHTSACampaignNumber,
        component,
        summary,
        consequence: recall.Consequence || '',
        remedy: recall.Remedy || '',
        severity,
        is_open: true, // NHTSA doesn't track individual vehicle recall completion
        recall_date: recall.ReportReceivedDate,
        manufacturer: recall.Manufacturer,
        vin: vin.toUpperCase(),
        vehicle_id: vehicle?.id || null,
        checked_at: new Date().toISOString(),
      }
    })

    // Save recalls to database if vehicle exists
    if (vehicle?.id && processedRecalls.length > 0) {
      // Delete old recalls for this vehicle
      await supabaseAdmin
        .from('nhtsa_recalls')
        .delete()
        .eq('vehicle_id', vehicle.id)

      // Insert new recalls
      await supabaseAdmin
        .from('nhtsa_recalls')
        .insert(processedRecalls)

      // Check for critical recalls
      const hasCritical = processedRecalls.some((r: { severity: string }) => r.severity === 'CRITICAL')
      const hasWarning = processedRecalls.some((r: { severity: string }) => r.severity === 'WARNING')
      const highestSeverity = hasCritical ? 'CRITICAL' : hasWarning ? 'WARNING' : processedRecalls.length > 0 ? 'INFO' : null

      // Update vehicle record
      await supabaseAdmin
        .from('vehicles')
        .update({
          last_recall_check: new Date().toISOString(),
          has_open_recalls: processedRecalls.length > 0,
          recall_severity: highestSeverity,
          // Force vehicle offline if critical recall found
          ...(hasCritical ? { is_approved: false } : {}),
        })
        .eq('id', vehicle.id)

      // If critical recall found, send alert email and create fleet alert
      if (hasCritical) {
        const criticalRecalls = processedRecalls.filter((r: { severity: string }) => r.severity === 'CRITICAL')
        
        // Create fleet alert
        await supabaseAdmin.from('fleet_alerts').insert({
          vehicle_id: vehicle.id,
          alert_type: 'critical_recall',
          severity: 'critical',
          title: `Critical Safety Recall - ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          description: criticalRecalls.map((r: { component: string; summary: string }) => `${r.component}: ${r.summary}`).join('\n'),
          is_resolved: false,
        })

        // Send admin alert via SendGrid
        if (process.env.SENDGRID_API_KEY) {
          try {
            await fetch('https://api.sendgrid.com/v3/mail/send', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                personalizations: [{ to: [{ email: 'joe@rentanddrive.net' }] }],
                from: { email: process.env.SENDGRID_FROM_EMAIL || 'alerts@rentanddrive.net' },
                subject: `[CRITICAL] Safety Recall Found - ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                content: [{
                  type: 'text/html',
                  value: `
                    <h2>Critical Safety Recall Alert</h2>
                    <p><strong>Vehicle:</strong> ${vehicle.year} ${vehicle.make} ${vehicle.model}</p>
                    <p><strong>VIN:</strong> ${vin}</p>
                    <p><strong>Status:</strong> Vehicle has been automatically taken offline.</p>
                    <h3>Recall Details:</h3>
                    <ul>
                      ${criticalRecalls.map((r: { component: string; summary: string; nhtsa_campaign_id: string }) => `
                        <li>
                          <strong>${r.component}</strong><br/>
                          ${r.summary}<br/>
                          <a href="https://www.nhtsa.gov/recalls?nhtsaId=${r.nhtsa_campaign_id}">NHTSA Campaign: ${r.nhtsa_campaign_id}</a>
                        </li>
                      `).join('')}
                    </ul>
                    <p>The host has been notified to get the recall fixed at an authorized dealership (free of charge).</p>
                  `,
                }],
              }),
            })
          } catch (emailError) {
            console.error('[NHTSA API] Failed to send admin alert:', emailError)
          }
        }

        // Log to agent_logs
        await supabaseAdmin.from('agent_logs').insert({
          agent_name: 'NHTSA Recall Check',
          action: 'critical_recall_found',
          details: {
            vehicle_id: vehicle.id,
            vin,
            critical_recalls: criticalRecalls.length,
            vehicle_offline: true,
          },
        })
      }
    }

    // Log the check
    await supabaseAdmin.from('agent_logs').insert({
      agent_name: 'NHTSA Recall Check',
      action: 'recall_check',
      details: {
        vin,
        vehicle_id: vehicle?.id,
        total_recalls: processedRecalls.length,
        critical: processedRecalls.filter((r: { severity: string }) => r.severity === 'CRITICAL').length,
        warning: processedRecalls.filter((r: { severity: string }) => r.severity === 'WARNING').length,
        info: processedRecalls.filter((r: { severity: string }) => r.severity === 'INFO').length,
      },
    })

    return NextResponse.json({
      vin: vin.toUpperCase(),
      total_recalls: processedRecalls.length,
      recalls: processedRecalls,
      summary: {
        critical: processedRecalls.filter((r: { severity: string }) => r.severity === 'CRITICAL').length,
        warning: processedRecalls.filter((r: { severity: string }) => r.severity === 'WARNING').length,
        info: processedRecalls.filter((r: { severity: string }) => r.severity === 'INFO').length,
      },
      checked_at: new Date().toISOString(),
    })

  } catch (error) {
    console.error('[NHTSA API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to check recalls' },
      { status: 500 }
    )
  }
}
