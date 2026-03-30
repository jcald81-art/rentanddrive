'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Car, Shield, Radar, DollarSign, Gauge, Calendar, MapPin,
  CheckCircle2, Snowflake, FileText, MessageSquare, ExternalLink,
  ChevronLeft, ChevronRight, User, Star, Phone, Truck
} from 'lucide-react'
import { toast } from 'sonner'
import { TestDriveModal } from '@/components/car-lot/test-drive-modal'
import { DeliveryChoice } from '@/components/car-lot/delivery-choice'

export default function CarLotListingPage() {
  const params = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentImage, setCurrentImage] = useState(0)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [inquiryMessage, setInquiryMessage] = useState('')
  const [offerAmount, setOfferAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [testDriveOpen, setTestDriveOpen] = useState(false)
  const [showDeliveryChoice, setShowDeliveryChoice] = useState(false)

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/car-lot/listings/${params.id}`)
        if (!res.ok) throw new Error('Failed to fetch listing')
        const data = await res.json()
        setListing(data)
        
        // Increment view count
        fetch(`/api/car-lot/listings/${params.id}/view`, { method: 'POST' })
      } catch (error) {
        console.error('Error:', error)
        toast.error('Failed to load listing')
      } finally {
        setLoading(false)
      }
    }
    fetchListing()
  }, [params.id])

  const handleInquiry = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/car-lot/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listing.id,
          message: inquiryMessage,
          offer_amount: offerAmount ? parseFloat(offerAmount) : null,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to submit inquiry')
      
      toast.success('Inquiry sent! The host will be notified.')
      setInquiryOpen(false)
      setInquiryMessage('')
      setOfferAmount('')
    } catch (error) {
      toast.error('Failed to send inquiry')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-[400px] w-full mb-8" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Listing Not Found</h1>
          <p className="text-muted-foreground mb-6">This vehicle may have been sold or removed.</p>
          <Button asChild>
            <Link href="/car-lot">Browse All Listings</Link>
          </Button>
        </div>
      </div>
    )
  }

  const vehicle = listing.vehicle
  const images = vehicle?.images || [vehicle?.primary_image_url]

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Car Lot
        </Button>
      </div>

      {/* Image Gallery */}
      <section className="bg-black">
        <div className="container mx-auto px-4">
          <div className="relative aspect-[16/9] max-h-[500px]">
            <Image
              src={images[currentImage] || '/placeholder-car.jpg'}
              alt={`${vehicle?.year} ${vehicle?.make} ${vehicle?.model}`}
              fill
              className="object-contain"
              priority
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_: any, i: number) => (
                    <button
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentImage ? 'bg-white' : 'bg-white/50'
                      }`}
                      onClick={() => setCurrentImage(i)}
                    />
                  ))}
                </div>
              </>
            )}
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <Badge className="bg-black/80 text-white">
                <Radar className="h-3 w-3 mr-1 text-[#CC0000]" />
                Eagle Verified
              </Badge>
              <Badge 
                className={
                  listing.condition === 'excellent' ? 'bg-green-500' :
                  listing.condition === 'good' ? 'bg-blue-500' : 'bg-yellow-500'
                }
              >
                {listing.condition} condition
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {vehicle?.year} {vehicle?.make} {vehicle?.model}
                </h1>
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Gauge className="h-4 w-4" />
                    {vehicle?.mileage?.toLocaleString()} miles
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Reno, NV
                  </span>
                  {vehicle?.has_awd && (
                    <Badge variant="outline">
                      <Snowflake className="h-3 w-3 mr-1" />
                      AWD
                    </Badge>
                  )}
                </div>
              </div>

              {/* Seller Notes */}
              {listing.seller_notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Seller Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {listing.seller_notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Verification Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#CC0000]" />
                    Verification & History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Eagle GPS Tracked</p>
                        <p className="text-sm text-muted-foreground">
                          Complete trip history available
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Cartegrity Inspected</p>
                        <p className="text-sm text-muted-foreground">
                          AI-verified condition reports
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Rental History</p>
                        <p className="text-sm text-muted-foreground">
                          Maintenance records from rentals
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">VIN Verified</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle?.vin}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t flex gap-3">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/api/car-lot/listings/${listing.id}/report`} target="_blank">
                        <FileText className="h-4 w-4 mr-2" />
                        Get Cartegrity Report
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Rent to Own Discount */}
              {listing.rent_to_own_discount_cents > 0 && (
                <Card className="border-[#CC0000]/30 bg-[#CC0000]/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-[#CC0000]/10 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-[#CC0000]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Rent-to-Own Discount</h3>
                        <p className="text-muted-foreground">
                          Previous renters of this vehicle get <span className="font-bold text-[#CC0000]">
                            ${(listing.rent_to_own_discount_cents / 100).toLocaleString()}
                          </span> off the purchase price!
                        </p>
                        <Button asChild variant="link" className="px-0 text-[#CC0000]">
                          <Link href={`/vehicles/${vehicle?.id}`}>
                            Rent this vehicle first
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Price & Contact */}
            <div className="space-y-6">
              <Card className="sticky top-24">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-1">Asking Price</p>
                    <p className="text-4xl font-bold text-[#CC0000]">
                      ${listing.asking_price?.toLocaleString()}
                    </p>
                    {listing.rent_to_own_discount_cents > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        or ${((listing.asking_price * 100 - listing.rent_to_own_discount_cents) / 100).toLocaleString()} with rent-to-own discount
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-[#CC0000] hover:bg-[#AA0000]">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Contact Host About Purchase
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Contact Host</DialogTitle>
                          <DialogDescription>
                            Send a message to the host about this vehicle
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="offer">Your Offer (optional)</Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="offer"
                                type="number"
                                placeholder={listing.asking_price?.toLocaleString()}
                                value={offerAmount}
                                onChange={(e) => setOfferAmount(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                              id="message"
                              placeholder="I'm interested in this vehicle..."
                              value={inquiryMessage}
                              onChange={(e) => setInquiryMessage(e.target.value)}
                              rows={4}
                            />
                          </div>
                          <Button
                            onClick={handleInquiry}
                            disabled={!inquiryMessage || submitting}
                            className="w-full bg-[#CC0000] hover:bg-[#AA0000]"
                          >
                            {submitting ? 'Sending...' : 'Send Inquiry'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button 
                      variant="outline" 
                      className="w-full border-[#CC0000] text-[#CC0000] hover:bg-[#CC0000]/10"
                      onClick={() => setTestDriveOpen(true)}
                    >
                      <Car className="h-4 w-4 mr-2" />
                      Schedule Test Drive
                    </Button>

                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/vehicles/${vehicle?.id}`}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Rent This Vehicle First
                      </Link>
                    </Button>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowDeliveryChoice(true)}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Shipping Options
                    </Button>

                    <Button variant="outline" className="w-full" asChild>
                      <a href="https://www.escrow.com" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Use Escrow.com for Transaction
                      </a>
                    </Button>
                  </div>

                  {/* Host Info */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        {vehicle?.host?.avatar_url ? (
                          <Image
                            src={vehicle.host.avatar_url}
                            alt={vehicle.host.full_name}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{vehicle?.host?.full_name || 'Host'}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          Verified Host
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-center text-sm">
                    <div>
                      <p className="font-semibold">{listing.views_count || 0}</p>
                      <p className="text-muted-foreground">Views</p>
                    </div>
                    <div>
                      <p className="font-semibold">{listing.inquiries_count || 0}</p>
                      <p className="text-muted-foreground">Inquiries</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Delivery Choice Section - shown when offer accepted */}
          {showDeliveryChoice && (
            <div className="mt-8 pt-8 border-t">
              <h2 className="text-2xl font-bold mb-6">How would you like to receive this vehicle?</h2>
              <DeliveryChoice
                listingId={listing.id}
                vehicleName={`${vehicle?.year} ${vehicle?.make} ${vehicle?.model}`}
                vehicleAddress={vehicle?.location_address || 'Reno, NV'}
                onComplete={(choice, data) => {
                  if (choice === 'pickup') {
                    setTestDriveOpen(true)
                    setShowDeliveryChoice(false)
                  } else {
                    toast.success('Shipment booked! Check your email for tracking details.')
                    router.push(`/rr/my-trips/shipment/${(data as any)?.shipment?.id}`)
                  }
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* Test Drive Modal */}
      <TestDriveModal
        open={testDriveOpen}
        onOpenChange={setTestDriveOpen}
        listingId={listing.id}
        vehicleName={`${vehicle?.year} ${vehicle?.make} ${vehicle?.model}`}
        vehicleImage={images[0]}
      />
    </div>
  )
}
