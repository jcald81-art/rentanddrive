import { redirect } from 'next/navigation'

// Redirect /list-vehicle to /dashboard/vehicles/new for consistency
export default function ListVehiclePage() {
  redirect('/dashboard/vehicles/new')
}
