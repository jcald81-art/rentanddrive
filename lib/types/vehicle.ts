export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  category: 'car' | 'suv' | 'motorcycle' | 'rv' | 'atv'
  daily_rate: number
  rating: number
  review_count: number
  is_awd: boolean
  has_ski_rack: boolean
  has_tow_hitch: boolean
  seats: number
  location_city: string
  location_state: string
  thumbnail_url: string
  images: string[]
  instant_book: boolean
  description: string
  features: string[]
  host_id: string
  host_name: string
  host_avatar_url: string
  host_rating: number
  host_trips: number
  host_joined: string
  available_from: string
  available_to: string
  created_at: string
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
