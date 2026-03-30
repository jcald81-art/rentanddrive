import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      inspectionId,
      overallCondition,
      cleanlinessRating,
      mechanicalIssues,
      signature,
    } = await request.json()

    if (!inspectionId) {
      return NextResponse.json({ error: 'Inspection ID required' }, { status: 400 })
    }

    // Get inspection with photos
    const { data: inspection } = await supabase
      .from('inspections')
      .select(`
        *,
        inspection_photos(*)
      `)
      .eq('id', inspectionId)
      .single()

    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    }

    if (inspection.inspector_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Calculate overall damage score
    const photos = inspection.inspection_photos || []
    const avgSeverity = photos.length > 0
      ? photos.reduce((sum: number, p: any) => sum + (p.severity_score || 0), 0) / photos.length
      : 0

    const hasDamage = photos.some((p: any) => p.damage_detected)

    // Update inspection
    const { data: updated, error: updateError } = await supabase
      .from('inspections')
      .update({
        status: 'completed',
        overall_condition: overallCondition,
        cleanliness_rating: cleanlinessRating,
        mechanical_issues: mechanicalIssues,
        damage_detected: hasDamage,
        overall_damage_score: avgSeverity,
        signature_url: signature,
        completed_at: new Date().toISOString(),
      })
      .eq('id', inspectionId)
      .select()
      .single()

    if (updateError) throw updateError

    // Update booking status based on inspection type
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', inspection.booking_id)
      .single()

    if (booking) {
      if (inspection.inspection_type === 'pre_trip') {
        await supabase
          .from('bookings')
          .update({
            pre_trip_inspection_id: inspectionId,
            pre_trip_mileage: inspection.mileage,
          })
          .eq('id', booking.id)
      } else if (inspection.inspection_type === 'post_trip') {
        await supabase
          .from('bookings')
          .update({
            post_trip_inspection_id: inspectionId,
            post_trip_mileage: inspection.mileage,
            actual_miles: inspection.mileage - (booking.pre_trip_mileage || 0),
          })
          .eq('id', booking.id)
      }
    }

    return NextResponse.json({
      success: true,
      inspection: {
        id: updated.id,
        status: 'completed',
        overallCondition,
        hasDamage,
        avgSeverity,
        photoCount: photos.length,
      },
    })
  } catch (error) {
    console.error('[Inspections Complete Error]:', error)
    return NextResponse.json(
      { error: 'Failed to complete inspection' },
      { status: 500 }
    )
  }
}
