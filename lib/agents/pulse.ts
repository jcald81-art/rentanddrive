import { routeAIRequest } from '@/lib/ai-router'
import { createClient } from '@/lib/supabase/server'

const AGENT_NAME = 'Pulse'

interface VehicleHealth {
  vehicleId: string
  make: string
  model: string
  year: number
  healthScore: number // 0-100
  issues: Array<{
    type: 'maintenance' | 'behavior' | 'efficiency' | 'safety'
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    recommendation: string
  }>
  maintenancePredictions: Array<{
    item: string
    estimatedDate: string
    estimatedCost: number
    priority: 'low' | 'medium' | 'high'
  }>
  fuelEfficiency: {
    avgMpg: number
    trend: 'improving' | 'stable' | 'declining'
  }
  drivingBehavior: {
    avgSpeed: number
    hardBrakingPerTrip: number
    idleTimePercent: number
    riskLevel: 'low' | 'medium' | 'high'
  }
}

interface FleetHealthReport {
  fleetHealthScore: number
  vehiclesNeedingAttention: VehicleHealth[]
  drivingBehaviorFlags: Array<{
    vehicleId: string
    renterId: string
    flagType: string
    details: string
  }>
  maintenancePredictions: Array<{
    vehicleId: string
    vehicle: string
    item: string
    estimatedDate: string
    estimatedCost: number
  }>
  summary: string
  alerts: Array<{
    vehicleId: string
    severity: 'warning' | 'critical'
    message: string
  }>
}

// Analyze vehicle telemetry
async function analyzeVehicleTelemetry(vehicleId: string): Promise<VehicleHealth> {
  const supabase = await createClient()

  // Get vehicle info
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, make, model, year, mileage, last_maintenance_date, host_id')
    .eq('id', vehicleId)
    .single()

  if (!vehicle) throw new Error('Vehicle not found')

  // Get recent telemetry (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: telemetry } = await supabase
    .from('fleet_telemetry')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .gte('recorded_at', thirtyDaysAgo.toISOString())
    .order('recorded_at', { ascending: false })

  // Get recent trips
  const { data: trips } = await supabase
    .from('trip_records')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .gte('start_time', thirtyDaysAgo.toISOString())

  // Get recent alerts
  const { data: alerts } = await supabase
    .from('fleet_alerts')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .gte('created_at', thirtyDaysAgo.toISOString())

  // Calculate metrics
  const totalTrips = trips?.length || 0
  const avgSpeed = trips?.reduce((sum, t) => sum + (t.avg_speed_mph || 0), 0) / (totalTrips || 1)
  const totalHardBraking = trips?.reduce((sum, t) => sum + (t.hard_braking_count || 0), 0) || 0
  const totalIdleMinutes = trips?.reduce((sum, t) => sum + (t.idle_time_minutes || 0), 0) || 0
  const totalDriveMinutes = trips?.reduce((sum, t) => sum + ((t.duration_minutes || 0) - (t.idle_time_minutes || 0)), 0) || 1
  const avgMpg = trips?.reduce((sum, t) => sum + (t.fuel_efficiency_mpg || 0), 0) / (totalTrips || 1) || 0

  const latestBattery = telemetry?.[0]?.battery_voltage || 12.6
  const latestFuel = telemetry?.[0]?.fuel_level_percent || 50

  // Prepare context for AI analysis
  const context = {
    vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    mileage: vehicle.mileage,
    lastMaintenance: vehicle.last_maintenance_date,
    metrics: {
      totalTrips,
      avgSpeed: Math.round(avgSpeed),
      hardBrakingPerTrip: totalTrips > 0 ? (totalHardBraking / totalTrips).toFixed(1) : 0,
      idlePercent: ((totalIdleMinutes / totalDriveMinutes) * 100).toFixed(1),
      avgMpg: avgMpg.toFixed(1),
      batteryVoltage: latestBattery,
      fuelLevel: latestFuel,
    },
    recentAlerts: alerts?.map(a => ({ type: a.alert_type, severity: a.severity })) || [],
  }

  // AI analysis
  const result = await routeAIRequest({
    taskType: 'fleet_health',
    agentName: AGENT_NAME,
    actionType: 'analyze_vehicle',
    system: `You are Pulse, the fleet health AI for Rent and Drive.
Analyze vehicle telemetry and provide health assessment.
Consider:
- Battery voltage (normal: 12.4-12.8V, low: <12.2V)
- Hard braking frequency (normal: <2/trip, concerning: >4/trip)
- Idle time (normal: <15%, concerning: >25%)
- Maintenance intervals (oil every 5k miles, brakes every 30k)
- Fuel efficiency trends

Return JSON:
{
  "healthScore": 0-100,
  "issues": [{"type": "maintenance|behavior|efficiency|safety", "severity": "low|medium|high|critical", "description": string, "recommendation": string}],
  "maintenancePredictions": [{"item": string, "estimatedDate": "YYYY-MM-DD", "estimatedCost": number, "priority": "low|medium|high"}],
  "fuelEfficiency": {"avgMpg": number, "trend": "improving|stable|declining"},
  "drivingBehavior": {"avgSpeed": number, "hardBrakingPerTrip": number, "idleTimePercent": number, "riskLevel": "low|medium|high"}
}`,
    prompt: `Analyze this vehicle:\n${JSON.stringify(context, null, 2)}`,
    maxTokens: 1024,
  })

  try {
    const parsed = JSON.parse(result.text.replace(/```json\n?|\n?```/g, ''))
    return {
      vehicleId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      healthScore: Math.min(100, Math.max(0, parsed.healthScore || 80)),
      issues: parsed.issues || [],
      maintenancePredictions: parsed.maintenancePredictions || [],
      fuelEfficiency: parsed.fuelEfficiency || { avgMpg: avgMpg, trend: 'stable' },
      drivingBehavior: parsed.drivingBehavior || {
        avgSpeed: Math.round(avgSpeed),
        hardBrakingPerTrip: totalTrips > 0 ? totalHardBraking / totalTrips : 0,
        idleTimePercent: (totalIdleMinutes / totalDriveMinutes) * 100,
        riskLevel: 'low',
      },
    }
  } catch {
    // Fallback to rule-based
    const issues: VehicleHealth['issues'] = []
    let healthScore = 100

    if (latestBattery < 12.2) {
      issues.push({
        type: 'maintenance',
        severity: 'high',
        description: 'Low battery voltage detected',
        recommendation: 'Check battery and charging system',
      })
      healthScore -= 15
    }

    if (totalTrips > 0 && totalHardBraking / totalTrips > 4) {
      issues.push({
        type: 'behavior',
        severity: 'medium',
        description: 'High frequency of hard braking events',
        recommendation: 'Review renter driving behavior',
      })
      healthScore -= 10
    }

    return {
      vehicleId,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      healthScore: Math.max(0, healthScore),
      issues,
      maintenancePredictions: [],
      fuelEfficiency: { avgMpg, trend: 'stable' },
      drivingBehavior: {
        avgSpeed: Math.round(avgSpeed),
        hardBrakingPerTrip: totalTrips > 0 ? totalHardBraking / totalTrips : 0,
        idleTimePercent: (totalIdleMinutes / totalDriveMinutes) * 100,
        riskLevel: 'low',
      },
    }
  }
}

// Run full fleet health check (called by cron)
export async function runFleetHealthCheck(): Promise<FleetHealthReport> {
  const supabase = await createClient()

  // Get all active vehicles with Bouncie devices
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, make, model, year, host_id, bouncie_device_id')
    .eq('status', 'active')
    .not('bouncie_device_id', 'is', null)

  if (!vehicles || vehicles.length === 0) {
    return {
      fleetHealthScore: 100,
      vehiclesNeedingAttention: [],
      drivingBehaviorFlags: [],
      maintenancePredictions: [],
      summary: 'No vehicles with telematics to analyze.',
      alerts: [],
    }
  }

  const vehicleHealths: VehicleHealth[] = []
  const allAlerts: FleetHealthReport['alerts'] = []
  const allFlags: FleetHealthReport['drivingBehaviorFlags'] = []
  const allMaintenancePredictions: FleetHealthReport['maintenancePredictions'] = []

  for (const vehicle of vehicles) {
    try {
      const health = await analyzeVehicleTelemetry(vehicle.id)
      vehicleHealths.push(health)

      // Collect critical issues
      for (const issue of health.issues) {
        if (issue.severity === 'critical' || issue.severity === 'high') {
          allAlerts.push({
            vehicleId: vehicle.id,
            severity: issue.severity === 'critical' ? 'critical' : 'warning',
            message: `${vehicle.year} ${vehicle.make} ${vehicle.model}: ${issue.description}`,
          })
        }
      }

      // Collect behavior flags
      if (health.drivingBehavior.riskLevel !== 'low') {
        // Get current renter
        const { data: activeBooking } = await supabase
          .from('bookings')
          .select('renter_id')
          .eq('vehicle_id', vehicle.id)
          .eq('status', 'active')
          .single()

        if (activeBooking) {
          allFlags.push({
            vehicleId: vehicle.id,
            renterId: activeBooking.renter_id,
            flagType: health.drivingBehavior.riskLevel === 'high' ? 'aggressive_driving' : 'concerning_behavior',
            details: `Avg speed: ${health.drivingBehavior.avgSpeed}mph, Hard braking: ${health.drivingBehavior.hardBrakingPerTrip.toFixed(1)}/trip`,
          })
        }
      }

      // Collect maintenance predictions
      for (const pred of health.maintenancePredictions) {
        allMaintenancePredictions.push({
          vehicleId: vehicle.id,
          vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          item: pred.item,
          estimatedDate: pred.estimatedDate,
          estimatedCost: pred.estimatedCost,
        })
      }

      await new Promise(r => setTimeout(r, 200)) // Rate limit
    } catch (error) {
      console.error(`[Pulse] Failed to analyze vehicle ${vehicle.id}:`, error)
    }
  }

  // Calculate fleet-wide health score
  const fleetHealthScore = vehicleHealths.length > 0
    ? Math.round(vehicleHealths.reduce((sum, v) => sum + v.healthScore, 0) / vehicleHealths.length)
    : 100

  // Vehicles needing attention (health score < 70)
  const vehiclesNeedingAttention = vehicleHealths.filter(v => v.healthScore < 70)

  // Generate summary with AI
  const summaryResult = await routeAIRequest({
    taskType: 'fleet_health',
    agentName: AGENT_NAME,
    actionType: 'generate_summary',
    system: 'Generate a brief 2-3 sentence fleet health summary for Rent and Drive.',
    prompt: `Fleet health score: ${fleetHealthScore}/100
Vehicles analyzed: ${vehicleHealths.length}
Vehicles needing attention: ${vehiclesNeedingAttention.length}
Critical alerts: ${allAlerts.filter(a => a.severity === 'critical').length}
Behavior flags: ${allFlags.length}
Upcoming maintenance items: ${allMaintenancePredictions.length}`,
    maxTokens: 128,
    forceModel: 'claude',
  })

  // Create fleet alerts for critical issues
  for (const alert of allAlerts.filter(a => a.severity === 'critical')) {
    const vehicle = vehicles.find(v => v.id === alert.vehicleId)
    
    await supabase.from('fleet_alerts').insert({
      vehicle_id: alert.vehicleId,
      alert_type: 'health_critical',
      severity: 'critical',
      title: 'Critical Health Issue',
      description: alert.message,
      is_resolved: false,
    })

    // SMS to host for critical
    if (vehicle?.host_id && process.env.TWILIO_ACCOUNT_SID) {
      const { data: host } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', vehicle.host_id)
        .single()

      if (host?.phone) {
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
        await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: host.phone,
              From: process.env.TWILIO_PHONE_NUMBER!,
              Body: `[Pulse Alert] ${alert.message}. Check dashboard for details.`,
            }),
          }
        )
      }
    }
  }

  return {
    fleetHealthScore,
    vehiclesNeedingAttention,
    drivingBehaviorFlags: allFlags,
    maintenancePredictions: allMaintenancePredictions.sort((a, b) => 
      new Date(a.estimatedDate).getTime() - new Date(b.estimatedDate).getTime()
    ).slice(0, 10),
    summary: summaryResult.text,
    alerts: allAlerts,
  }
}

// Get single vehicle health
export async function getVehicleHealth(vehicleId: string): Promise<VehicleHealth> {
  return analyzeVehicleTelemetry(vehicleId)
}
