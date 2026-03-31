import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { BookingConfirmedClient } from './booking-confirmed-client'

interface SearchParams {
  booking_id?: string
}

async function getBooking(bookingId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicles (
        id,
        make,
        model,
        year,
        thumbnail,
        photos,
        daily_rate,
        location_city,
        location_state,
        carfidelity_certified,
        smoking_policy
      )
    `)
    .eq('id', bookingId)
    .single()

  if (error || !data) return null
  return data
}

export default async function BookingConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { booking_id } = params

  let booking = null
  if (booking_id) {
    booking = await getBooking(booking_id)
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <BookingConfirmedClient booking={booking} />
    </Suspense>
  )
}
