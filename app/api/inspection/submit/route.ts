import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/inspection/submit
 * 
 * Accepts inspection photos for pre or post rental.
 * Photos can be base64 data URLs or cloud storage URLs.
 * 
 * Request body:
 * {
 *   rentalId: string,
 *   mode: 'pre' | 'post',
 *   photos: Array<{ angle: string, dataUrl: string }>,
 *   timestamp: string (ISO),
 *   coordinates: { lat: number, lng: number }
 * }
 * 
 * Returns:
 * { inspectionId: string, status: string, preInspectionId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rentalId, mode, photos, timestamp, coordinates } = body

    // Validate required fields
    if (!rentalId || !mode || !photos || photos.length !== 6) {
      return NextResponse.json(
        { error: 'Missing required fields or incomplete photos (need 6)' },
        { status: 400 }
      )
    }

    if (!['pre', 'post'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "pre" or "post"' },
        { status: 400 }
      )
    }

    // Verify rental exists and belongs to user
    const { data: rental, error: rentalError } = await supabase
      .from('bookings')
      .select('id, renter_id, vehicle_id, pre_inspection_id')
      .eq('id', rentalId)
      .single()

    if (rentalError || !rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 })
    }

    if (rental.renter_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this rental' }, { status: 403 })
    }

    // TODO: Upload photos to cloud storage (Vercel Blob, S3, etc.)
    // For now, we'll store references/stubs
    const photoUrls = photos.map((photo: { angle: string; dataUrl: string }) => ({
      angle: photo.angle,
      url: `stub://inspection/${rentalId}/${mode}/${photo.angle}.jpg`,
      // In production: upload photo.dataUrl to blob storage and get URL
    }))

    // Create inspection record
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .insert({
        rental_id: rentalId,
        user_id: user.id,
        mode,
        photos: photoUrls,
        timestamp,
        coordinates,
        status: mode === 'pre' ? 'completed' : 'pending_analysis',
      })
      .select()
      .single()

    if (inspectionError) {
      console.error('Inspection insert error:', inspectionError)
      return NextResponse.json(
        { error: 'Failed to save inspection' },
        { status: 500 }
      )
    }

    // Update rental with inspection reference
    if (mode === 'pre') {
      await supabase
        .from('bookings')
        .update({ pre_inspection_id: inspection.id })
        .eq('id', rentalId)
    } else {
      await supabase
        .from('bookings')
        .update({ post_inspection_id: inspection.id })
        .eq('id', rentalId)
    }

    // Return response with pre_inspection_id for post-rental AI comparison
    return NextResponse.json({
      inspectionId: inspection.id,
      status: inspection.status,
      preInspectionId: mode === 'post' ? rental.pre_inspection_id : undefined,
    })

  } catch (error) {
    console.error('Inspection submit error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
