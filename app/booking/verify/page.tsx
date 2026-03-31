import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookingVerifyClient } from './booking-verify-client'

interface SearchParams {
  vehicle_id?: string
  start?: string
  end?: string
  lyft_pickup?: string
  lyft_return?: string
  unlimited_miles?: string
  promo?: string
  pickup_address?: string
  return_address?: string
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

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { ...user, profile }
}

export default async function BookingVerifyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { vehicle_id, start, end } = params

  if (!vehicle_id || !start || !end) {
    redirect('/vehicles')
  }

  const [vehicle, user] = await Promise.all([
    getVehicle(vehicle_id),
    getUser(),
  ])

  if (!vehicle) {
    redirect('/vehicles')
  }

  const startDate = new Date(start)
  const endDate = new Date(end)

  const addOns = {
    lyftPickup: params.lyft_pickup === 'true',
    lyftReturn: params.lyft_return === 'true',
    unlimitedMiles: params.unlimited_miles === 'true',
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <BookingVerifyClient
        vehicle={vehicle}
        startDate={startDate}
        endDate={endDate}
        addOns={addOns}
        promoCode={params.promo || null}
        user={user}
        pickupAddress={params.pickup_address}
        returnAddress={params.return_address}
      />
    </Suspense>
  )
}
