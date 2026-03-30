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
          '/car-lot',
          '/car-lot/*',
          '/about',
          '/faq',
          '/contact',
          '/terms',
          '/privacy',
          '/insurance-disclosure',
          '/rewards',
          '/login',
          '/signup',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/hostslab/',
          '/renter/',
          '/admin/',
          '/bookings/',
          '/profile/',
          '/notifications/',
          '/wishlist/',
          '/inspect/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/hostslab/',
          '/renter/',
          '/admin/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
