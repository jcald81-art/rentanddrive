'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Review {
  id: string
  rating: number
  review_text: string
  created_at: string
  reviewer: {
    full_name: string
    avatar_url: string | null
  }
  vehicle: {
    make: string
    model: string
    year: number
  }
}

// Sample reviews for fallback
const sampleReviews = [
  {
    id: '1',
    rating: 5,
    review_text: "Saved $80 compared to Turo on my ski weekend rental. The Subaru had snow tires and was perfect for Tahoe. Contactless pickup was so easy - just grabbed the keys from the lockbox and hit the road!",
    created_at: new Date().toISOString(),
    reviewer: { full_name: 'Sarah M.', avatar_url: null },
    vehicle: { make: 'Subaru', model: 'Outback', year: 2023 },
  },
  {
    id: '2',
    rating: 5,
    review_text: "My truck earns me $800/month when I'm not using it. The platform is super easy and payouts are fast. Love being part of the Rent and Drive community!",
    created_at: new Date().toISOString(),
    reviewer: { full_name: 'Mike T.', avatar_url: null },
    vehicle: { make: 'Toyota', model: 'Tacoma', year: 2022 },
  },
  {
    id: '3',
    rating: 5,
    review_text: "The Lyft pickup feature is a game changer. Got picked up at the airport and dropped at the car. So convenient! Will definitely use Rent and Drive again.",
    created_at: new Date().toISOString(),
    reviewer: { full_name: 'Jessica L.', avatar_url: null },
    vehicle: { make: 'Jeep', model: 'Grand Cherokee', year: 2023 },
  },
  {
    id: '4',
    rating: 5,
    review_text: "Perfect for our Lake Tahoe adventure. The AWD was essential for the mountain roads. Joe was super responsive when we had questions. 10/10 experience!",
    created_at: new Date().toISOString(),
    reviewer: { full_name: 'David K.', avatar_url: null },
    vehicle: { make: 'Toyota', model: '4Runner', year: 2021 },
  },
  {
    id: '5',
    rating: 5,
    review_text: "First time using a peer-to-peer rental and I'm hooked! Way better pricing than Enterprise, and the car was cleaner too. Free car wash included was a nice touch.",
    created_at: new Date().toISOString(),
    reviewer: { full_name: 'Amanda R.', avatar_url: null },
    vehicle: { make: 'Honda', model: 'CR-V', year: 2022 },
  },
]

export function CustomerReviewsCarousel() {
  const [reviews, setReviews] = useState<Review[]>(sampleReviews)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    fetchReviews()
  }, [])

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(1, reviews.length - 2))
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, reviews.length])

  async function fetchReviews() {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        review_text,
        created_at,
        reviewer:users!reviews_reviewer_id_fkey (
          full_name,
          avatar_url
        ),
        vehicle:vehicles (
          make,
          model,
          year
        )
      `)
      .gte('rating', 4)
      .not('review_text', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error && data && data.length > 0) {
      setReviews(data as unknown as Review[])
    }
  }

  function goToPrevious() {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev === 0 ? Math.max(0, reviews.length - 3) : prev - 1))
  }

  function goToNext() {
    setIsAutoPlaying(false)
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, reviews.length - 2))
  }

  // Show 1 on mobile, 3 on desktop
  const visibleReviews = reviews.slice(currentIndex, currentIndex + 3)
  
  // Handle wrap-around
  while (visibleReviews.length < 3 && reviews.length > 0) {
    const wrapIndex = (currentIndex + visibleReviews.length) % reviews.length
    visibleReviews.push(reviews[wrapIndex])
  }

  return (
    <div className="relative">
      {/* Navigation Buttons - Hidden on mobile */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 hidden lg:flex rounded-full shadow-lg"
        onClick={goToPrevious}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 hidden lg:flex rounded-full shadow-lg"
        onClick={goToNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Reviews Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {visibleReviews.slice(0, 3).map((review, index) => (
          <Card 
            key={`${review.id}-${index}`} 
            className={`transition-opacity duration-300 ${index === 0 ? '' : 'hidden md:block'}`}
          >
            <CardContent className="pt-6">
              {/* Quote Icon */}
              <Quote className="h-8 w-8 text-[#CC0000]/20 mb-4" />
              
              {/* Stars */}
              <div className="mb-3 flex">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-[#CC0000] text-[#CC0000]" />
                ))}
              </div>
              
              {/* Review Text */}
              <p className="mb-4 text-sm text-muted-foreground line-clamp-4">
                &quot;{review.review_text}&quot;
              </p>
              
              {/* Reviewer Info */}
              <div className="flex items-center gap-3 border-t pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#CC0000] text-white font-medium">
                  {review.reviewer.full_name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{review.reviewer.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Rented {review.vehicle.year} {review.vehicle.make} {review.vehicle.model}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile Navigation Dots */}
      <div className="flex justify-center gap-2 mt-6 md:hidden">
        {reviews.map((_, index) => (
          <button
            key={index}
            className={`h-2 w-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-[#CC0000]' : 'bg-muted-foreground/30'
            }`}
            onClick={() => {
              setIsAutoPlaying(false)
              setCurrentIndex(index)
            }}
          />
        ))}
      </div>

      {/* Desktop Progress Dots */}
      <div className="hidden md:flex justify-center gap-2 mt-8">
        {Array.from({ length: Math.ceil(reviews.length / 3) }).map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all ${
              Math.floor(currentIndex / 3) === index ? 'w-6 bg-[#CC0000]' : 'w-2 bg-muted-foreground/30'
            }`}
            onClick={() => {
              setIsAutoPlaying(false)
              setCurrentIndex(index * 3)
            }}
          />
        ))}
      </div>
    </div>
  )
}
