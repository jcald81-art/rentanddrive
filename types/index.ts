// Re-export all types from lib/types for convenience
export type { Vehicle, VehicleFilters } from '@/lib/types/vehicle'

// Additional shared types
export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: 'renter' | 'host' | 'admin'
  created_at: string
  phone?: string
  verified?: boolean
}

export interface Booking {
  id: string
  vehicle_id: string
  renter_id: string
  host_id: string
  start_date: string
  end_date: string
  total_amount_cents: number
  status: 'pending' | 'approved' | 'active' | 'completed' | 'cancelled'
  created_at: string
  pickup_location?: string
  dropoff_location?: string
}

export interface Review {
  id: string
  booking_id: string
  reviewer_id: string
  reviewee_id: string
  vehicle_id: string
  rating: number
  review_text: string
  created_at: string
}
