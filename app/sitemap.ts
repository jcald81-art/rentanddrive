import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
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
    // Auth pages
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Info pages
    {
      url: `${baseUrl}/rewards`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    // HostsLab pages (for SEO on host acquisition)
    {
      url: `${baseUrl}/hostslab/lobby`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/hostslab/academy`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ]

  // Dynamic vehicle pages
  let vehiclePages: MetadataRoute.Sitemap = []
  
  try {
    const supabase = await createClient()
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, updated_at')
      .eq('is_active', true)
      .eq('is_approved', true)

    if (vehicles) {
      vehiclePages = vehicles.map((vehicle) => ({
        url: `${baseUrl}/vehicles/${vehicle.id}`,
        lastModified: new Date(vehicle.updated_at || new Date()),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error('Error fetching vehicles for sitemap:', error)
  }

  return [...staticPages, ...vehiclePages]
}
