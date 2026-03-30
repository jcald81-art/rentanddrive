'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Star, 
  ArrowLeft,
  Car,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface BookingDetails {
  id: string
  booking_number: string
  start_date: string
  end_date: string
  vehicle: {
    id: string
    make: string
    model: string
    year: number
    thumbnail_url: string
  }
  host: {
    id: string
    full_name: string
  }
}

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.bookingId as string
  
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  
  // Form state
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [wouldRentAgain, setWouldRentAgain] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBookingDetails()
  }, [bookingId])

  async function fetchBookingDetails() {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Check if already reviewed
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('reviewer_id', user.id)
      .single()

    if (existingReview) {
      setAlreadyReviewed(true)
      setLoading(false)
      return
    }

    // Fetch booking details
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_number,
        start_date,
        end_date,
        vehicle:vehicles (
          id,
          make,
          model,
          year,
          thumbnail_url
        ),
        host:users!bookings_host_id_fkey (
          id,
          full_name
        )
      `)
      .eq('id', bookingId)
      .eq('renter_id', user.id)
      .eq('status', 'completed')
      .single()

    if (!error && data) {
      setBooking(data as unknown as BookingDetails)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    if (reviewText.trim().length < 10) {
      setError('Please write at least a few words about your experience')
      return
    }

    setSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || !booking) {
        setError('Authentication error')
        setSubmitting(false)
        return
      }

      // Insert review
      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          vehicle_id: booking.vehicle.id,
          reviewer_id: user.id,
          host_id: booking.host.id,
          rating,
          review_text: reviewText.trim(),
          would_rent_again: wouldRentAgain,
        })

      if (insertError) {
        setError(insertError.message)
        setSubmitting(false)
        return
      }

      // Trigger Review Agent to analyze the review
      try {
        await fetch('/api/agents/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: bookingId }),
        })
      } catch {
        // Non-blocking - agent analysis is optional
      }

      setSubmitted(true)
    } catch {
      setError('Failed to submit review')
    }

    setSubmitting(false)
  }

  // Render star rating
  function StarRating() {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= (hoverRating || rating)
          const halfFilled = !filled && star - 0.5 <= (hoverRating || rating)
          
          return (
            <button
              key={star}
              type="button"
              className="relative p-1 focus:outline-none focus:ring-2 focus:ring-[#CC0000] rounded"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <Star 
                className={`h-10 w-10 transition-colors ${
                  filled 
                    ? 'fill-[#CC0000] text-[#CC0000]' 
                    : halfFilled
                    ? 'fill-[#CC0000]/50 text-[#CC0000]'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#CC0000] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (alreadyReviewed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
        <h1 className="text-xl font-semibold mb-2">Already Reviewed</h1>
        <p className="text-muted-foreground mb-4 text-center">You&apos;ve already submitted a review for this trip.</p>
        <Button asChild>
          <Link href="/bookings">View Your Bookings</Link>
        </Button>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Car className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold mb-2">Trip Not Found</h1>
        <p className="text-muted-foreground mb-4 text-center">This trip doesn&apos;t exist, isn&apos;t completed, or you don&apos;t have access to it.</p>
        <Button asChild>
          <Link href="/bookings">View Your Bookings</Link>
        </Button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
          <p className="text-muted-foreground mb-6">
            Your review helps other renters find great vehicles and rewards hosts for excellent service.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full bg-[#CC0000] hover:bg-[#CC0000]/90">
              <Link href="/vehicles">Book Another Vehicle</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/bookings">View Your Bookings</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/bookings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-lg">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">How was your trip?</CardTitle>
            <CardDescription>
              Share your experience with the {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Vehicle Preview */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg mb-6">
              <img 
                src={booking.vehicle.thumbnail_url || '/placeholder-car.jpg'}
                alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                className="w-20 h-14 object-cover rounded"
              />
              <div>
                <p className="font-medium">
                  {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                </p>
                <p className="text-sm text-muted-foreground">
                  Hosted by {booking.host.full_name}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star Rating */}
              <div className="text-center">
                <Label className="text-lg mb-4 block">Overall Rating</Label>
                <div className="flex justify-center">
                  <StarRating />
                </div>
                {rating > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great!' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                  </p>
                )}
              </div>

              {/* Review Text */}
              <div>
                <Label htmlFor="review" className="text-lg">Your Review</Label>
                <Textarea
                  id="review"
                  placeholder="Tell others about your experience. Was the vehicle as described? How was the pickup process? Would you recommend this host?"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={5}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {reviewText.length} characters
                </p>
              </div>

              {/* Would Rent Again */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="rent-again" className="font-medium">Would you rent from this host again?</Label>
                  <p className="text-sm text-muted-foreground">This helps other renters make decisions</p>
                </div>
                <Switch
                  id="rent-again"
                  checked={wouldRentAgain}
                  onCheckedChange={setWouldRentAgain}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#CC0000] hover:bg-[#CC0000]/90 text-lg"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Reviews are public and help build trust in our community. Be honest and constructive.
        </p>
      </div>
    </div>
  )
}
