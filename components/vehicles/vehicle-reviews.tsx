'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  reviewer_name: string
  reviewer_avatar: string | null
}

interface VehicleReviewsProps {
  vehicleId: string
}

export function VehicleReviews({ vehicleId }: VehicleReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReviews() {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          reviewer:profiles!reviews_user_id_fkey(full_name, avatar_url)
        `)
        .eq('vehicle_id', vehicleId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!error && data) {
        setReviews(
          data.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            created_at: r.created_at,
            reviewer_name: (r.reviewer as { full_name: string } | null)?.full_name || 'Anonymous',
            reviewer_avatar: (r.reviewer as { avatar_url: string | null } | null)?.avatar_url || null,
          }))
        )
      }

      setLoading(false)
    }

    fetchReviews()
  }, [vehicleId])

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Reviews</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Reviews</h2>
        <p className="text-muted-foreground">No reviews yet. Be the first to rent this vehicle!</p>
      </div>
    )
  }

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold">Reviews</h2>
        <div className="flex items-center gap-1">
          <Star className="h-5 w-5 fill-[#CC0000] text-[#CC0000]" />
          <span className="font-semibold">{averageRating.toFixed(1)}</span>
          <span className="text-muted-foreground">({reviews.length} reviews)</span>
        </div>
      </div>

      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="flex gap-4">
            <Avatar>
              <AvatarImage src={review.reviewer_avatar || undefined} />
              <AvatarFallback>
                {review.reviewer_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{review.reviewer_name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating ? 'fill-[#CC0000] text-[#CC0000]' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
