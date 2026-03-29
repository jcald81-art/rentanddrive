import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookingCheckout from './booking-checkout'

interface PageProps {
  params: Promise<{ vehicleId: string }>
  searchParams: Promise<{ start_date?: string; end_date?: string }>
}

export default async function BookingPage({ params, searchParams }: PageProps) {
  const { vehicleId } = await params
  const { start_date, end_date } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/book/${vehicleId}`)
  }

  // Fetch vehicle details
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select(`
      *,
      host:users!vehicles_owner_id_fkey (
        id,
        full_name,
        avatar_url,
        created_at
      )
    `)
    .eq('id', vehicleId)
    .single()

  if (error || !vehicle) {
    redirect('/vehicles?error=vehicle_not_found')
  }

  // Default dates if not provided
  const defaultStartDate = start_date || new Date().toISOString().split('T')[0]
  const defaultEndDate = end_date || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  return (
    <BookingCheckout 
      vehicle={vehicle} 
      initialStartDate={defaultStartDate}
      initialEndDate={defaultEndDate}
    />
  )
}
