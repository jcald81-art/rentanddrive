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
  // Host and audio fields
  host_bio?: string
  host_avatar_url?: string
  host_rating?: number
  host_trips?: number
  host_joined?: string
  audio_walkthrough_url?: string
  audio_walkthrough_duration?: number
  // VIN and recall fields
  vin?: string
  vin_report_url?: string
  has_open_recalls?: boolean
  recall_severity?: 'CRITICAL' | 'WARNING' | 'INFO' | null
  // Additional listing fields
  is_active?: boolean
  is_approved?: boolean
  features?: string[]
  images?: string[]
  thumbnail_url?: string
  review_count?: number
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
