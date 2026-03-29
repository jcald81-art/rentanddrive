import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get host's vehicles
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id')
      .eq('host_id', user.id)

    const vehicleIds = vehicles?.map(v => v.id) || []

    // Get insurance policies
    const { data: insurancePolicies } = await supabase
      .from('insurance_policies')
      .select('*')
      .in('vehicle_id', vehicleIds)
      .order('created_at', { ascending: false })

    // Get inspections
    const { data: inspections } = await supabase
      .from('inspections')
      .select(`
        *,
        vehicle:vehicles(make, model, year)
      `)
      .in('vehicle_id', vehicleIds)
      .order('created_at', { ascending: false })

    // Get trip records
    const { data: tripRecords } = await supabase
      .from('trip_records')
      .select(`
        *,
        vehicle:vehicles(make, model, year)
      `)
      .in('vehicle_id', vehicleIds)
      .order('started_at', { ascending: false })
      .limit(50)

    // Get VIN reports
    const { data: vinReports } = await supabase
      .from('vin_reports')
      .select(`
        *,
        vehicle:vehicles(make, model, year, vin)
      `)
      .in('vehicle_id', vehicleIds)
      .order('created_at', { ascending: false })

    // Get NHTSA recalls
    const { data: recalls } = await supabase
      .from('nhtsa_recalls')
      .select(`
        *,
        vehicle:vehicles(make, model, year)
      `)
      .in('vehicle_id', vehicleIds)
      .order('recall_date', { ascending: false })

    // Get driver verifications (for renters who booked host's vehicles)
    const { data: bookings } = await supabase
      .from('bookings')
      .select('renter_id')
      .in('vehicle_id', vehicleIds)

    const renterIds = [...new Set(bookings?.map(b => b.renter_id) || [])]
    
    const { data: driverVerifications } = await supabase
      .from('driver_verifications')
      .select(`
        *,
        user:profiles!driver_verifications_user_id_fkey(full_name)
      `)
      .in('user_id', renterIds)
      .order('verified_at', { ascending: false })

    return NextResponse.json({
      documents: {
        insurancePolicies: insurancePolicies || [],
        inspections: inspections || [],
        tripRecords: tripRecords || [],
        vinReports: vinReports || [],
        recalls: recalls || [],
        driverVerifications: driverVerifications || [],
      },
      counts: {
        insurancePolicies: insurancePolicies?.length || 0,
        inspections: inspections?.length || 0,
        tripRecords: tripRecords?.length || 0,
        vinReports: vinReports?.length || 0,
        recalls: recalls?.length || 0,
        driverVerifications: driverVerifications?.length || 0,
      },
    })
  } catch (error) {
    console.error('Filing cabinet error:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}
