import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering since we use cookies via Supabase
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'

  // Static pages - priority 0.5 for info pages
  const staticPages: MetadataRoute.Sitemap = [
    // Homepage - highest priority
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // Main vehicle browsing
    {
      url: `${baseUrl}/vehicles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // Vehicle categories
    {
      url: `${baseUrl}/vehicles?category=suv`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vehicles?category=car`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vehicles?category=truck`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vehicles?awd=true`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Car Lot main page
    {
      url: `${baseUrl}/car-lot`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // Info pages - priority 0.5
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/insurance-disclosure`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    // Auth pages
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    // Rewards page
    {
      url: `${baseUrl}/rewards`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ]

  // Dynamic vehicle pages from vehicles table
  let vehiclePages: MetadataRoute.Sitemap = []
  
  // Dynamic Car Lot listings from vehicle_listings table
  let carLotPages: MetadataRoute.Sitemap = []
  
  try {
    const supabase = await createClient()
    
    // Fetch active vehicle rentals
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, updated_at')
      .eq('is_active', true)
      .eq('is_approved', true)

    if (vehicles) {
      vehiclePages = vehicles.map((vehicle) => ({
        url: `${baseUrl}/vehicles/${vehicle.id}`,
        lastModified: new Date(vehicle.updated_at || new Date()),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }))
    }

    // Fetch active Car Lot listings
    const { data: listings } = await supabase
      .from('vehicle_listings')
      .select('id, updated_at')
      .eq('status', 'active')

    if (listings) {
      carLotPages = listings.map((listing) => ({
        url: `${baseUrl}/car-lot/${listing.id}`,
        lastModified: new Date(listing.updated_at || new Date()),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error('Error fetching data for sitemap:', error)
  }

  return [...staticPages, ...vehiclePages, ...carLotPages]
}
