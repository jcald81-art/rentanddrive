'use client'

import { useState } from 'react'
import { Car, Truck, MapPin, Shield, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ShippingQuote {
  shipment_id: string
  carrier_name: string
  carrier_slug: string
  carrier_rating: number
  carrier_reviews: number
  quote_cents: number
  estimated_days: number
  estimated_delivery: string
  insurance_included: boolean
  insurance_coverage: number
  door_to_door: boolean
}

interface DeliveryChoiceProps {
  listingId: string
  vehicleName: string
  vehicleAddress: string
  onComplete: (choice: 'pickup' | 'ship', data?: unknown) => void
}

export function DeliveryChoice({ 
  listingId, 
  vehicleName, 
  vehicleAddress,
  onComplete 
}: DeliveryChoiceProps) {
  const [showShipping, setShowShipping] = useState(false)
  const [destinationZip, setDestinationZip] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [quotes, setQuotes] = useState<ShippingQuote[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<ShippingQuote | null>(null)
  const [bookingShipment, setBookingShipment] = useState(false)

  const handleGetQuotes = async () => {
    if (!destinationZip) return

    setLoading(true)
    try {
      const res = await fetch('/api/shipping/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_listing_id: listingId,
          destination_zip: destinationZip,
          destination_address: destinationAddress
        })
      })

      if (res.ok) {
        const data = await res.json()
        setQuotes(data.quotes)
      }
    } catch (error) {
      console.error('Failed to get quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookShipment = async () => {
    if (!selectedQuote) return

    setBookingShipment(true)
    try {
      const res = await fetch('/api/shipping/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipment_id: selectedQuote.shipment_id
        })
      })

      if (res.ok) {
        const data = await res.json()
        onComplete('ship', data)
      }
    } catch (error) {
      console.error('Failed to book shipment:', error)
    } finally {
      setBookingShipment(false)
    }
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  return (
    <>
      <div className="grid md:grid-cols-2 gap-4">
        {/* Local Pickup Card */}
        <Card className="border-2 hover:border-[#CC0000]/50 transition-colors cursor-pointer"
              onClick={() => onComplete('pickup')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Car className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Local Pickup</CardTitle>
                <CardDescription>Free Lyft ride to vehicle</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Free for buyers within 30 miles</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Lyft brings you to the vehicle</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Same-day pickup available</span>
              </li>
            </ul>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
              FREE
            </Badge>
          </CardContent>
        </Card>

        {/* Ship It Card */}
        <Card className="border-2 hover:border-[#CC0000]/50 transition-colors cursor-pointer"
              onClick={() => setShowShipping(true)}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#CC0000]/10 flex items-center justify-center">
                <Truck className="h-6 w-6 text-[#CC0000]" />
              </div>
              <div>
                <CardTitle className="text-lg">Ship It</CardTitle>
                <CardDescription>Door-to-door delivery</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#CC0000]" />
                <span>Instant quotes from 3 carriers</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#CC0000]" />
                <span>Door-to-door delivery</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#CC0000]" />
                <span>Real-time Eagle GPS tracking</span>
              </li>
            </ul>
            <Button className="w-full bg-[#CC0000] hover:bg-[#AA0000]">
              Get Shipping Quotes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Shipping Quotes Dialog */}
      <Dialog open={showShipping} onOpenChange={setShowShipping}>
        <DialogContent className="max-w-2xl" aria-describedby="shipping-dialog-desc">
          <DialogHeader>
            <DialogTitle>Ship Your {vehicleName}</DialogTitle>
            <DialogDescription id="shipping-dialog-desc">
              Get instant quotes from verified carriers for door-to-door delivery.
            </DialogDescription>
          </DialogHeader>

          {quotes.length === 0 ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Shipping from</p>
                    <p className="font-medium">{vehicleAddress}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Delivery Address</Label>
                <Input
                  id="destination"
                  placeholder="Enter your full address"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip">Destination ZIP Code</Label>
                <Input
                  id="zip"
                  placeholder="Enter ZIP code"
                  value={destinationZip}
                  onChange={(e) => setDestinationZip(e.target.value)}
                  maxLength={5}
                />
              </div>

              <Button 
                className="w-full bg-[#CC0000] hover:bg-[#AA0000]"
                onClick={handleGetQuotes}
                disabled={!destinationZip || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting Quotes...
                  </>
                ) : (
                  'Get Instant Quotes'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Quote Cards */}
              <div className="space-y-3">
                {quotes.map((quote, index) => (
                  <Card 
                    key={quote.shipment_id}
                    className={`cursor-pointer transition-all ${
                      selectedQuote?.shipment_id === quote.shipment_id 
                        ? 'border-[#CC0000] ring-2 ring-[#CC0000]/20' 
                        : 'hover:border-[#CC0000]/50'
                    }`}
                    onClick={() => setSelectedQuote(quote)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            <Truck className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{quote.carrier_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {quote.carrier_rating} stars ({quote.carrier_reviews.toLocaleString()} reviews)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">{formatPrice(quote.quote_cents)}</p>
                          <p className="text-sm text-muted-foreground">
                            {quote.estimated_days} days
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {quote.insurance_included && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            $100k Insurance
                          </Badge>
                        )}
                        {quote.door_to_door && (
                          <Badge variant="secondary" className="text-xs">
                            Door-to-Door
                          </Badge>
                        )}
                        {index === 0 && (
                          <Badge className="bg-green-500/10 text-green-600 text-xs">
                            Best Price
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Eagle Tracking Notice */}
              <div className="p-4 bg-slate-900 text-white rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-[#CC0000]" />
                  <div>
                    <p className="font-medium">Eagle GPS Tracking Included</p>
                    <p className="text-sm text-slate-400">
                      Track your vehicle in real-time during transport
                    </p>
                  </div>
                </div>
              </div>

              {/* Total and Book Button */}
              {selectedQuote && (
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span>Shipping Cost</span>
                    <span className="font-medium">{formatPrice(selectedQuote.quote_cents)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Est. Delivery</span>
                    <span>{new Date(selectedQuote.estimated_delivery).toLocaleDateString()}</span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(selectedQuote.quote_cents)}</span>
                  </div>
                  <Button 
                    className="w-full bg-[#CC0000] hover:bg-[#AA0000]"
                    onClick={handleBookShipment}
                    disabled={bookingShipment}
                  >
                    {bookingShipment ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      'Confirm and Book'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
