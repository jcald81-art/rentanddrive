import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Sample vehicles for demo/development when database table doesn't exist yet
const SAMPLE_VEHICLES = [
  {
    id: '1',
    host_id: 'demo-host-1',
    make: 'Tesla',
    model: 'Model 3',
    year: 2024,
    category: 'car',
    daily_rate: 89,
    description: 'Electric luxury with autopilot. Perfect for road trips to Lake Tahoe.',
    location_city: 'Reno',
    location_state: 'NV',
    thumbnail: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop',
    photos: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop'],
    is_awd: false,
    has_ski_rack: false,
    has_tow_hitch: false,
    seats: 5,
    fuel_type: 'electric',
    transmission: 'automatic',
    instant_book: true,
    rating: 4.9,
    trip_count: 47,
    host_name: 'Michael R.',
    host_avatar: null,
  },
  {
    id: '2',
    host_id: 'demo-host-2',
    make: 'Jeep',
    model: 'Wrangler Rubicon',
    year: 2023,
    category: 'suv',
    daily_rate: 125,
    description: 'Ultimate off-road capability. Ski rack included for winter adventures.',
    location_city: 'Reno',
    location_state: 'NV',
    thumbnail: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop',
    photos: ['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop'],
    is_awd: true,
    has_ski_rack: true,
    has_tow_hitch: true,
    seats: 4,
    fuel_type: 'gasoline',
    transmission: 'automatic',
    instant_book: true,
    rating: 4.8,
    trip_count: 62,
    host_name: 'Sarah K.',
    host_avatar: null,
  },
  {
    id: '3',
    host_id: 'demo-host-3',
    make: 'Ford',
    model: 'F-150 Raptor',
    year: 2024,
    category: 'truck',
    daily_rate: 175,
    description: 'Desert beast with tow package. Ready for any terrain.',
    location_city: 'Reno',
    location_state: 'NV',
    thumbnail: 'https://images.unsplash.com/photo-1590739225287-bd31519780c3?w=800&auto=format&fit=crop',
    photos: ['https://images.unsplash.com/photo-1590739225287-bd31519780c3?w=800&auto=format&fit=crop'],
    is_awd: true,
    has_ski_rack: true,
    has_tow_hitch: true,
    seats: 5,
    fuel_type: 'gasoline',
    transmission: 'automatic',
    instant_book: true,
    rating: 5.0,
    trip_count: 23,
    host_name: 'Jake T.',
    host_avatar: null,
  },
  {
    id: '4',
    host_id: 'demo-host-4',
    make: 'BMW',
    model: 'X5 M',
    year: 2023,
    category: 'suv',
    daily_rate: 145,
    description: 'Luxury meets performance. AWD with premium ski rack.',
    location_city: 'Sparks',
    location_state: 'NV',
    thumbnail: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop',
    photos: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop'],
    is_awd: true,
    has_ski_rack: true,
    has_tow_hitch: false,
    seats: 5,
    fuel_type: 'gasoline',
    transmission: 'automatic',
    instant_book: true,
    rating: 4.7,
    trip_count: 35,
    host_name: 'Lisa M.',
    host_avatar: null,
  },
  {
    id: '5',
    host_id: 'demo-host-5',
    make: 'Porsche',
    model: '911 Carrera',
    year: 2024,
    category: 'car',
    daily_rate: 299,
    description: 'Iconic sports car. Weekend special available.',
    location_city: 'Reno',
    location_state: 'NV',
    thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop',
    photos: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop'],
    is_awd: false,
    has_ski_rack: false,
    has_tow_hitch: false,
    seats: 2,
    fuel_type: 'gasoline',
    transmission: 'automatic',
    instant_book: true,
    rating: 5.0,
    trip_count: 12,
    host_name: 'David W.',
    host_avatar: null,
  },
  {
    id: '6',
    host_id: 'demo-host-6',
    make: 'Toyota',
    model: '4Runner TRD Pro',
    year: 2024,
    category: 'suv',
    daily_rate: 115,
    description: 'Trail-ready with rooftop tent compatibility. Perfect for camping.',
    location_city: 'Reno',
    location_state: 'NV',
    thumbnail: 'https://images.unsplash.com/photo-1625231334168-32a5765e7a8e?w=800&auto=format&fit=crop',
    photos: ['https://images.unsplash.com/photo-1625231334168-32a5765e7a8e?w=800&auto=format&fit=crop'],
    is_awd: true,
    has_ski_rack: true,
    has_tow_hitch: true,
    seats: 5,
    fuel_type: 'gasoline',
    transmission: 'automatic',
    instant_book: true,
    rating: 4.9,
    trip_count: 89,
    host_name: 'Amanda C.',
    host_avatar: null,
  },
  {
    id: '7',
    host_id: 'demo-host-7',
    make: 'Winnebago',
    model: 'Travato',
    year: 2023,
    category: 'rv',
    daily_rate: 225,
    description: 'Compact Class B RV. Sleep 2, full kitchen, perfect for Tahoe camping.',
    location_city: 'Reno',
    location_state: 'NV',
    thumbnail: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&auto=format&fit=crop',
    photos: ['https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800&auto=format&fit=crop'],
    is_awd: false,
    has_ski_rack: false,
    has_tow_hitch: false,
    seats: 2,
    fuel_type: 'gasoline',
    transmission: 'automatic',
    instant_book: false,
    rating: 4.8,
    trip_count: 18,
    host_name: 'Tom B.',
    host_avatar: null,
  },
  {
    id: '8',
    host_id: 'demo-host-8',
    make: 'Polaris',
    model: 'RZR Pro XP',
    year: 2024,
    category: 'atv',
    daily_rate: 350,
    description: 'Ultimate desert toy. Helmet and trailer included.',
    location_city: 'Sparks',
    location_state: 'NV',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
    photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop'],
    is_awd: true,
    has_ski_rack: false,
    has_tow_hitch: false,
    seats: 2,
    fuel_type: 'gasoline',
    transmission: 'automatic',
    instant_book: false,
    rating: 5.0,
    trip_count: 8,
    host_name: 'Chris P.',
    host_avatar: null,
  },
]

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams

  const category = searchParams.get('category')
  const awd = searchParams.get('awd')
  const skiRack = searchParams.get('ski_rack')
  const minRate = searchParams.get('min_rate')
  const maxRate = searchParams.get('max_rate')

  // Try to fetch from database first
  let query = supabase.from('active_listings').select('*')

  if (category) {
    query = query.eq('category', category)
  }

  if (awd === 'true') {
    query = query.eq('is_awd', true)
  }

  if (skiRack === 'true') {
    query = query.eq('has_ski_rack', true)
  }

  if (minRate) {
    query = query.gte('daily_rate', parseFloat(minRate))
  }

  if (maxRate) {
    query = query.lte('daily_rate', parseFloat(maxRate))
  }

  const { data, error } = await query.order('daily_rate', { ascending: true })

  // If database query fails (table doesn't exist), use sample data
  if (error) {
    console.error('Error fetching vehicles:', error)
    
    // Filter sample data based on query params
    let filteredVehicles = [...SAMPLE_VEHICLES]
    
    if (category) {
      filteredVehicles = filteredVehicles.filter(v => v.category === category)
    }
    if (awd === 'true') {
      filteredVehicles = filteredVehicles.filter(v => v.is_awd)
    }
    if (skiRack === 'true') {
      filteredVehicles = filteredVehicles.filter(v => v.has_ski_rack)
    }
    if (minRate) {
      filteredVehicles = filteredVehicles.filter(v => v.daily_rate >= parseFloat(minRate))
    }
    if (maxRate) {
      filteredVehicles = filteredVehicles.filter(v => v.daily_rate <= parseFloat(maxRate))
    }
    
    return NextResponse.json(filteredVehicles)
  }

  return NextResponse.json(data)
}
