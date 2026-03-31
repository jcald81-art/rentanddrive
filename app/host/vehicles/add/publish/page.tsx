'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Rocket, Check, Car, MapPin, Eye, Plus, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PublishResult {
  success: boolean
  vehicle: {
    id: string
    year: string
    make: string
    model: string
  }
  estimatedFirstBooking: string
  monthlyEarnings: {
    rad: number
    turo: number
    difference: number
  }
}

export default function PublishPage() {
  const router = useRouter()
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null)
  const [error, setError] = useState('')
  const [listingData, setListingData] = useState<Record<string, unknown> | null>(null)

  // Load draft
  useEffect(() => {
    const draft = localStorage.getItem('rad-listing-draft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        setListingData(parsed)
      } catch {}
    }
  }, [])

  const handlePublish = async () => {
    if (!listingData) {
      setError('No listing data found. Please start over.')
      return
    }

    setIsPublishing(true)
    setError('')

    try {
      const response = await fetch('/api/vehicles/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to publish vehicle')
        setIsPublishing(false)
        return
      }

      // Clear draft on success
      localStorage.removeItem('rad-listing-draft')
      
      setPublishResult(result)
      setIsPublished(true)
    } catch (err) {
      console.error('Publish error:', err)
      setError('Network error. Please try again.')
    } finally {
      setIsPublishing(false)
    }
  }

  // Publishing animation state
  if (isPublishing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-[#e63946]/20 flex items-center justify-center animate-pulse">
            <Rocket className="w-12 h-12 text-[#e63946] animate-bounce" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-[#e63946] border-t-transparent animate-spin" />
        </div>
        <p className="text-2xl font-bold text-white mt-8">Going live...</p>
        <p className="text-white/60 mt-2">Setting up your listing</p>
      </div>
    )
  }

  // Success state
  if (isPublished && publishResult) {
    return (
      <div className="space-y-8">
        {/* Success Header */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Your {publishResult.vehicle.year} {publishResult.vehicle.make} {publishResult.vehicle.model} is Live!
          </h1>
          <p className="text-white/60">
            Renters can now find and book your vehicle
          </p>
        </div>

        {/* Estimated Booking */}
        <Card className="bg-gradient-to-br from-[#e63946]/20 to-[#0a0f1e] border-[#e63946]/30">
          <CardContent className="p-6 text-center">
            <p className="text-white/60 mb-2">Estimated first booking based on RAD Pricing market data:</p>
            <p className="text-3xl font-bold text-[#e63946]">{publishResult.estimatedFirstBooking}</p>
          </CardContent>
        </Card>

        {/* Monthly Earnings */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Your Monthly Earnings</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white">RAD pays you</span>
                <span className="text-2xl font-bold text-[#e63946]">${publishResult.monthlyEarnings.rad}/mo</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Turo would pay</span>
                <span className="text-lg text-white/40 line-through">${publishResult.monthlyEarnings.turo}/mo</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                <span className="text-green-400">You earn MORE with RAD</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  +${publishResult.monthlyEarnings.difference}/mo
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href={`/vehicles/${publishResult.vehicle.id}`}>
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 h-14">
              <Car className="w-4 h-4 mr-2" />
              View Your Listing
            </Button>
          </Link>
          <Link href="/hostslab/rad-fleet-command">
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 h-14">
              <Eye className="w-4 h-4 mr-2" />
              Add to RAD Fleet Command
            </Button>
          </Link>
          <Link href="/host/vehicles/add/details">
            <Button className="w-full bg-[#e63946] hover:bg-[#e63946]/80 h-14">
              <Plus className="w-4 h-4 mr-2" />
              List Another Vehicle
            </Button>
          </Link>
        </div>

        {/* Dashboard Link */}
        <div className="text-center">
          <Link href="/hostslab/lobby" className="text-[#e63946] hover:underline">
            Go to RAD Hosts Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Pre-publish review state
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Ready to Go Live</h1>
        <p className="text-white/60">
          Review your listing details and publish when ready.
        </p>
      </div>

      {/* Listing Preview */}
      {listingData && (
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          {/* Photo Preview */}
          {Array.isArray(listingData.photos) && listingData.photos.length > 0 && (
            <div className="aspect-[16/9] relative">
              <img
                src={listingData.photos[0] as string}
                alt="Vehicle preview"
                className="w-full h-full object-cover"
              />
              <Badge className="absolute top-4 left-4 bg-black/60">
                {(listingData.photos as string[]).length} photos
              </Badge>
            </div>
          )}
          
          <CardContent className="p-6 space-y-4">
            {/* Vehicle Info */}
            <div>
              <h2 className="text-2xl font-bold text-white">
                {listingData.year} {listingData.make} {listingData.model}
                {listingData.trim && <span className="text-white/60 font-normal ml-2">{listingData.trim as string}</span>}
              </h2>
              <div className="flex items-center gap-2 text-white/60 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{listingData.location_city}, {listingData.location_state}</span>
              </div>
            </div>

            {/* Features */}
            {Array.isArray(listingData.features) && listingData.features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(listingData.features as string[]).slice(0, 6).map(feature => (
                  <Badge key={feature} variant="outline" className="border-white/20 text-white/80">
                    {feature}
                  </Badge>
                ))}
                {listingData.features.length > 6 && (
                  <Badge variant="outline" className="border-white/20 text-white/60">
                    +{listingData.features.length - 6} more
                  </Badge>
                )}
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#e63946]">${listingData.daily_rate}</span>
              <span className="text-white/60">/day</span>
            </div>

            {/* Checklist */}
            <div className="border-t border-white/10 pt-4 space-y-2">
              <div className="flex items-center gap-2 text-green-400">
                <Check className="w-4 h-4" />
                <span>Vehicle details complete</span>
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <Check className="w-4 h-4" />
                <span>Photos uploaded</span>
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <Check className="w-4 h-4" />
                <span>Payout account connected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Publish Button */}
      <div className="flex justify-between pb-20 sm:pb-0">
        <Button
          variant="outline"
          onClick={() => router.push('/host/vehicles/add/payout')}
          className="border-white/20 text-white hover:bg-white/10"
        >
          Back
        </Button>
        <Button
          onClick={handlePublish}
          disabled={isPublishing || !listingData}
          size="lg"
          className="bg-[#e63946] hover:bg-[#e63946]/80 text-white px-12"
        >
          <Rocket className="w-4 h-4 mr-2" />
          Publish Listing
        </Button>
      </div>
    </div>
  )
}
