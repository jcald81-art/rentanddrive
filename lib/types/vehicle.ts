export interface Vehicle {
  id: string
  host_id: string
  make: string
  model: string
  year: number
  category: 'car' | 'suv' | 'truck' | 'motorcycle' | 'rv' | 'atv'
  daily_rate: number
  description: string
  location_city: string
  location_state: string
  thumbnail: string
  photos: string[]
  is_awd: boolean
  has_ski_rack: boolean
  has_tow_hitch: boolean
  seats: number
  fuel_type: string
  transmission: string
  instant_book: boolean
  rating: number
  trip_count: number
  host_name: string
  host_avatar: string | null
  // Optional fields for detail page
  location_lat?: number
  location_lng?: number
  host_member_since?: string
  host_response_rate?: number
  host_response_time?: string
  available_from?: string
  available_to?: string
  created_at?: string
}

export interface VehicleFilters {
  category?: string
  start_date?: string
  end_date?: string
  awd?: boolean
  ski_rack?: boolean
  min_rate?: number
  max_rate?: number
}
