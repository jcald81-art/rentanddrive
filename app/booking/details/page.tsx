import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookingDetailsClient } from './booking-details-client'

interface SearchParams {
  vehicle_id?: string
  start?: string
  end?: string
}

async function getVehicle(vehicleId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .eq('is_active', true)
    .eq('is_approved', true)
    .single()

  if (error || !data) return null
  return data
}

export default async function BookingDetailsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { vehicle_id, start, end } = params

  if (!vehicle_id || !start || !end) {
    redirect('/vehicles')
  }

  const vehicle = await getVehicle(vehicle_id)
  if (!vehicle) {
    redirect('/vehicles')
  }

  const startDate = new Date(start)
  const endDate = new Date(end)

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <BookingDetailsClient
        vehicle={vehicle}
        startDate={startDate}
        endDate={endDate}
      />
    </Suspense>
  )
}
