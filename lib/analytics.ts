// Custom event tracking for Rent and Drive
// Works with Cloudflare Web Analytics and Vercel Analytics

type EventName = 
  | 'search_performed'
  | 'vehicle_viewed'
  | 'booking_started'
  | 'booking_completed'
  | 'review_submitted'
  | 'wishlist_added'
  | 'wishlist_removed'
  | 'concierge_opened'
  | 'concierge_ride_requested'
  | 'login_completed'
  | 'signup_completed'
  | 'vin_check_purchased'
  | 'inspection_started'
  | 'inspection_completed'
  | 'car_lot_viewed'
  | 'fast_lane_requested'
  | 'test_drive_scheduled'
  | 'shipping_quote_requested'

interface EventProperties {
  // Search
  search_query?: string
  search_location?: string
  search_dates?: string
  search_category?: string
  results_count?: number

  // Vehicle
  vehicle_id?: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number
  vehicle_price?: number
  vehicle_category?: string

  // Booking
  booking_id?: string
  booking_total?: number
  booking_days?: number
  has_concierge?: boolean

  // Review
  review_rating?: number

  // Inspection
  inspection_type?: 'pre' | 'post'
  inspection_score?: number

  // Car Lot
  listing_id?: string
  asking_price?: number
  
  // Shipping
  destination?: string
  carrier?: string

  // General
  page_path?: string
  referrer?: string
}

export function trackEvent(eventName: EventName, properties?: EventProperties) {
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${eventName}`, properties)
  }

  // Send to Vercel Analytics (if available)
  if (typeof window !== 'undefined' && (window as unknown as { va?: (cmd: string, params: { name: string; data?: EventProperties }) => void }).va) {
    (window as unknown as { va: (cmd: string, params: { name: string; data?: EventProperties }) => void }).va('event', {
      name: eventName,
      data: properties,
    })
  }

  // Cloudflare Web Analytics doesn't support custom events directly,
  // but we can use the beacon API for custom tracking if needed
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      const data = JSON.stringify({
        event: eventName,
        properties,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
      })
      
      // Send to our own analytics endpoint
      navigator.sendBeacon('/api/analytics/track', data)
    } catch (error) {
      // Silently fail - analytics should never break the app
    }
  }
}

// Convenience functions for common events
export function trackSearch(query: string, location: string, resultsCount: number) {
  trackEvent('search_performed', {
    search_query: query,
    search_location: location,
    results_count: resultsCount,
  })
}

export function trackVehicleView(vehicle: {
  id: string
  make: string
  model: string
  year: number
  daily_rate: number
  category: string
}) {
  trackEvent('vehicle_viewed', {
    vehicle_id: vehicle.id,
    vehicle_make: vehicle.make,
    vehicle_model: vehicle.model,
    vehicle_year: vehicle.year,
    vehicle_price: vehicle.daily_rate,
    vehicle_category: vehicle.category,
  })
}

export function trackBookingStarted(vehicleId: string, totalAmount: number, days: number) {
  trackEvent('booking_started', {
    vehicle_id: vehicleId,
    booking_total: totalAmount,
    booking_days: days,
  })
}

export function trackBookingCompleted(bookingId: string, totalAmount: number, hasConcierge: boolean) {
  trackEvent('booking_completed', {
    booking_id: bookingId,
    booking_total: totalAmount,
    has_concierge: hasConcierge,
  })
}

export function trackReviewSubmitted(bookingId: string, rating: number) {
  trackEvent('review_submitted', {
    booking_id: bookingId,
    review_rating: rating,
  })
}

export function trackInspectionStarted(bookingId: string, type: 'pre' | 'post') {
  trackEvent('inspection_started', {
    booking_id: bookingId,
    inspection_type: type,
  })
}

export function trackInspectionCompleted(bookingId: string, score: number) {
  trackEvent('inspection_completed', {
    booking_id: bookingId,
    inspection_score: score,
  })
}

export function trackCarLotViewed(listingId: string, askingPrice?: number) {
  trackEvent('car_lot_viewed', {
    listing_id: listingId,
    asking_price: askingPrice,
  })
}

export function trackFastLaneRequested(vehicleId: string) {
  trackEvent('fast_lane_requested', {
    vehicle_id: vehicleId,
  })
}

export function trackTestDriveScheduled(listingId: string) {
  trackEvent('test_drive_scheduled', {
    listing_id: listingId,
  })
}

export function trackShippingQuoteRequested(listingId: string, destination: string) {
  trackEvent('shipping_quote_requested', {
    listing_id: listingId,
    destination,
  })
}
