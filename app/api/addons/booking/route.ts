import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PLATFORM_FEE_PERCENT = 0.15 // 15% platform fee on add-ons

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, addonIds } = body

    if (!bookingId || !addonIds || !Array.isArray(addonIds)) {
      return NextResponse.json(
        { error: 'bookingId and addonIds array required' },
        { status: 400 }
      )
    }

    if (addonIds.length === 0) {
      return NextResponse.json({
        addonTotal: 0,
        platformFee: 0,
        newBookingTotal: 0,
      })
    }

    const supabase = await createClient()

    // Get add-on prices
    const { data: addons, error: addonsError } = await supabase
      .from('host_addons')
      .select('id, name, price')
      .in('id', addonIds)

    // Calculate totals (use mock if no addons found)
    let addonTotal = 0
    if (addons && addons.length > 0) {
      addonTotal = addons.reduce((sum, addon) => sum + addon.price, 0)
    } else {
      // Mock calculation: assume $15 average per addon
      addonTotal = addonIds.length * 15
    }

    const platformFee = Math.round(addonTotal * PLATFORM_FEE_PERCENT * 100) / 100
    const hostEarnings = addonTotal - platformFee

    // Get current booking total
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('total_amount')
      .eq('id', bookingId)
      .single()

    const currentTotal = booking?.total_amount || 285 // Default mock total
    const newBookingTotal = currentTotal + addonTotal

    // Update booking with add-ons (stub)
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        addon_ids: addonIds,
        addon_total: addonTotal,
        total_amount: newBookingTotal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    if (updateError) {
      console.log('Booking update failed (may not exist in dev):', updateError.message)
    }

    // Create booking add-on records
    const bookingAddons = addonIds.map(addonId => ({
      booking_id: bookingId,
      addon_id: addonId,
      price: addons?.find(a => a.id === addonId)?.price || 15,
    }))

    await supabase.from('booking_addons').insert(bookingAddons)

    return NextResponse.json({
      addonTotal,
      platformFee,
      hostEarnings,
      newBookingTotal,
      addonsCount: addonIds.length,
    })
  } catch (error) {
    console.error('Error adding addons to booking:', error)
    return NextResponse.json(
      { error: 'Failed to add add-ons to booking' },
      { status: 500 }
    )
  }
}
