/**
 * JSON-LD Structured Data for SEO
 * Implements Schema.org vocabulary for rich search results
 */

// Vehicle type for structured data - accepts either daily_rate or daily_rate_cents
interface VehicleForSchema {
  id: string
  make: string
  model: string
  year: number
  category?: string
  daily_rate?: number
  daily_rate_cents?: number
  description?: string
  images?: string[]
  is_active?: boolean
  is_approved?: boolean
  is_awd?: boolean
  seats?: number
  color?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rentanddrive.net'

// Organization schema
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    '@id': `${baseUrl}/#organization`,
    name: 'Rent and Drive LLC',
    alternateName: 'R&D',
    url: baseUrl,
    logo: `${baseUrl}/icons/icon-512x512.png`,
    image: `${baseUrl}/og-image.jpg`,
    description: 'Premium peer-to-peer car rental in Reno and Lake Tahoe, Nevada. AWD vehicles, contactless pickup, VIN verified.',
    telephone: '+17755551234',
    email: 'info@rentanddrive.net',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Virginia St',
      addressLocality: 'Reno',
      addressRegion: 'NV',
      postalCode: '89501',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 39.5296,
      longitude: -119.8138,
    },
    areaServed: [
      { '@type': 'City', name: 'Reno', addressRegion: 'NV' },
      { '@type': 'City', name: 'Sparks', addressRegion: 'NV' },
      { '@type': 'City', name: 'Lake Tahoe', addressRegion: 'NV' },
      { '@type': 'City', name: 'Carson City', addressRegion: 'NV' },
      { '@type': 'City', name: 'Truckee', addressRegion: 'CA' },
    ],
    priceRange: '$$',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    sameAs: [
      'https://facebook.com/rentanddrive',
      'https://instagram.com/rentanddrive',
      'https://twitter.com/rentanddrive',
    ],
  }
}

// Vehicle/Product schema
export function getVehicleSchema(vehicle: VehicleForSchema, reviews?: { rating: number; count: number }) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${baseUrl}/vehicles/${vehicle.id}`,
    name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    description: vehicle.description || `Rent this ${vehicle.year} ${vehicle.make} ${vehicle.model} in Reno/Lake Tahoe. ${vehicle.is_awd ? 'AWD capable. ' : ''}${vehicle.seats} seats.`,
    image: vehicle.images?.[0] || `${baseUrl}/og-image.jpg`,
    url: `${baseUrl}/vehicles/${vehicle.id}`,
    brand: {
      '@type': 'Brand',
      name: vehicle.make,
    },
    category: vehicle.category,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: (vehicle.daily_rate_cents ? vehicle.daily_rate_cents / 100 : vehicle.daily_rate || 0).toFixed(2),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: vehicle.is_active && vehicle.is_approved
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Rent and Drive LLC',
      },
    },
  }

  // Add aggregate rating if reviews exist
  if (reviews && reviews.count > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: reviews.rating.toFixed(1),
      reviewCount: reviews.count,
      bestRating: 5,
      worstRating: 1,
    }
  }

  // Vehicle-specific properties
  schema.additionalProperty = [
    { '@type': 'PropertyValue', name: 'Year', value: vehicle.year },
    { '@type': 'PropertyValue', name: 'Seats', value: vehicle.seats },
    { '@type': 'PropertyValue', name: 'AWD', value: vehicle.is_awd ? 'Yes' : 'No' },
  ]

  if (vehicle.color) {
    schema.color = vehicle.color
  }

  return schema
}

// Vehicle listing (for search results page)
export function getVehicleListSchema(vehicles: VehicleForSchema[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: vehicles.map((vehicle, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        '@id': `${baseUrl}/vehicles/${vehicle.id}`,
        name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        image: vehicle.images?.[0],
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
price: (vehicle.daily_rate_cents ? vehicle.daily_rate_cents / 100 : vehicle.daily_rate || 0).toFixed(2),
        },
      },
    })),
  }
}

// Breadcrumb schema
export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  }
}

// FAQ schema
export function getFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

// Local Business schema for homepage
export function getLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}/#localbusiness`,
    name: 'Rent and Drive LLC',
    image: `${baseUrl}/og-image.jpg`,
    telephone: '+17755551234',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Virginia St',
      addressLocality: 'Reno',
      addressRegion: 'NV',
      postalCode: '89501',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 39.5296,
      longitude: -119.8138,
    },
    url: baseUrl,
    priceRange: '$$',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '00:00',
        closes: '23:59',
      },
    ],
  }
}

// Review schema
export function getReviewSchema(review: {
  author: string
  rating: number
  text: string
  date: string
  vehicleName: string
  vehicleId: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Product',
      name: review.vehicleName,
      url: `${baseUrl}/vehicles/${review.vehicleId}`,
    },
    author: {
      '@type': 'Person',
      name: review.author,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.text,
    datePublished: review.date,
  }
}

// Website schema with search action
export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    url: baseUrl,
    name: 'Rent and Drive',
    description: 'Premium peer-to-peer car rental in Reno and Lake Tahoe',
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/vehicles?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}
