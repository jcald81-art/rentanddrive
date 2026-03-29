import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/vehicles',
          '/vehicles/*',
          '/rewards',
          '/hostslab/lobby',
          '/hostslab/academy',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/bookings/',
          '/profile/',
          '/notifications/',
          '/wishlist/',
          '/hostslab/vault',
          '/hostslab/filing-cabinet',
          '/hostslab/lab-controls',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/dashboard/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
