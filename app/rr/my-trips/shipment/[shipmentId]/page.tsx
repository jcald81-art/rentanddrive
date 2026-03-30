'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  MapPin, Truck, Package, CheckCircle, Clock, Phone, Mail, 
  Share2, ExternalLink, Shield, Gauge, AlertCircle, Copy
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Shipment {
  id: string
  carrier_name: string
  tracking_number: string
  status: 'quoted' | 'booked' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
  origin_address: string
  destination_address: string
  estimated_delivery: string
  actual_delivery: string | null
  eagle_monitoring_active: boolean
  quote_cents: number
  listing: {
    vehicle: {
      id: string
      make: string
      model: string
      year: number
      images: string[]
      device?: {
        last_lat: number
        last_lng: number
        last_speed_mph: number
        last_seen_at: string
      }
    }
  }
}

const STATUS_STEPS = [
  { key: 'booked', label: 'Sold & Booked', icon: Package },
  { key: 'picked_up', label: 'Picked Up', icon: Truck },
  { key: 'in_transit', label: 'In Transit', icon: MapPin },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
]

export default function ShipmentTrackingPage() {
  const params = useParams()
  const shipmentId = params.shipmentId as string
  
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [eagleData, setEagleData] = useState<{
    lat: number
    lng: number
    speed: number
    lastSeen: string
  } | null>(null)
  const [showEagleContinue, setShowEagleContinue] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchShipment()
    const interval = setInterval(fetchShipment, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [shipmentId])

  async function fetchShipment() {
    try {
      const res = await fetch(`/api/shipping/book?id=${shipmentId}`)
      if (res.ok) {
        const data = await res.json()
        setShipment(data.shipment)
        
        // Get Eagle telemetry if monitoring active
        if (data.shipment.eagle_monitoring_active && data.shipment.listing?.vehicle?.id) {
          const eagleRes = await fetch(`/api/eagle/vehicles?vehicle_id=${data.shipment.listing.vehicle.id}`)
          if (eagleRes.ok) {
            const eagleData = await eagleRes.json()
            if (eagleData.location) {
              setEagleData({
                lat: eagleData.location.lat,
                lng: eagleData.location.lng,
                speed: eagleData.location.speed || 0,
                lastSeen: eagleData.location.timestamp
              })
            }
          }
        }

        // Show Eagle continuation modal when delivered
        if (data.shipment.status === 'delivered' && !localStorage.getItem(`eagle-offer-${shipmentId}`)) {
          setShowEagleContinue(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch shipment:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIndex = (status: string) => {
    return STATUS_STEPS.findIndex(s => s.key === status)
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/rr/my-trips/shipment/${shipmentId}`
    
    if (navigator.share) {
      await navigator.share({
        title: `Vehicle Shipment Tracking - ${shipment?.tracking_number}`,
        url
      })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleEagleContinue = async (accept: boolean) => {
    localStorage.setItem(`eagle-offer-${shipmentId}`, 'true')
    setShowEagleContinue(false)

    if (accept) {
      // Generate Bouncie referral link
      window.open('https://bouncie.com/ref/rentanddrive', '_blank')
    }
  }

  const getDaysUntilDelivery = () => {
    if (!shipment?.estimated_delivery) return null
    const delivery = new Date(shipment.estimated_delivery)
    const now = new Date()
    const diff = Math.ceil((delivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64 bg-slate-800" />
          <Skeleton className="h-[400px] w-full bg-slate-800" />
          <Skeleton className="h-48 w-full bg-slate-800" />
        </div>
      </div>
    )
  }

  if (!shipment) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">Shipment Not Found</h1>
          <p className="text-slate-400 mb-4">This tracking link may be invalid or expired.</p>
          <Button asChild>
            <Link href="/rr/my-trips">Back to My Trips</Link>
          </Button>
        </div>
      </div>
    )
  }

  const vehicle = shipment.listing?.vehicle
  const vehicleName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Vehicle'
  const currentStatusIndex = getStatusIndex(shipment.status)
  const daysUntil = getDaysUntilDelivery()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#CC0000] to-[#990000] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-white/70">Tracking Number</p>
              <p className="text-xl font-mono font-bold">{shipment.tracking_number}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare}
              className="border-white/30 text-white hover:bg-white/10"
            >
              {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
              {copied ? 'Copied!' : 'Share Link'}
            </Button>
          </div>
          <h1 className="text-2xl font-bold">{vehicleName}</h1>
          <p className="text-white/70">{shipment.carrier_name}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Live Map */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white">
              <MapPin className="h-5 w-5 text-[#CC0000]" />
              Live Location
              {shipment.eagle_monitoring_active && (
                <Badge className="bg-green-500/20 text-green-400 ml-auto">
                  <Shield className="h-3 w-3 mr-1" />
                  Eagle Active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] rounded-lg bg-slate-800 relative overflow-hidden">
              {eagleData ? (
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${eagleData.lng - 0.1}%2C${eagleData.lat - 0.1}%2C${eagleData.lng + 0.1}%2C${eagleData.lat + 0.1}&layer=mapnik&marker=${eagleData.lat}%2C${eagleData.lng}`}
                  className="w-full h-full"
                  style={{ border: 0 }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Truck className="h-12 w-12 mx-auto mb-2 text-slate-600" />
                    <p className="text-slate-400">
                      {shipment.status === 'booked' 
                        ? 'Awaiting carrier pickup' 
                        : 'Location updating...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Eagle Telemetry Feed */}
            {eagleData && (
              <div className="mt-4 p-3 bg-slate-800 rounded-lg flex items-center gap-4">
                <Shield className="h-8 w-8 text-green-500" />
                <div className="flex-1">
                  <p className="text-sm text-green-400 font-medium">Vehicle is safe</p>
                  <p className="text-xs text-slate-400">
                    Last speed: {eagleData.speed} mph on carrier
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Last update</p>
                  <p className="text-sm text-slate-300">
                    {new Date(eagleData.lastSeen).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Shipment Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between relative">
              {/* Progress line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-slate-700">
                <div 
                  className="h-full bg-[#CC0000] transition-all duration-500"
                  style={{ width: `${(currentStatusIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                />
              </div>

              {STATUS_STEPS.map((step, index) => {
                const isComplete = index <= currentStatusIndex
                const isCurrent = index === currentStatusIndex
                const Icon = step.icon

                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isComplete 
                        ? 'bg-[#CC0000] text-white' 
                        : 'bg-slate-700 text-slate-400'}
                      ${isCurrent ? 'ring-4 ring-[#CC0000]/30' : ''}
                    `}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className={`mt-2 text-xs text-center ${isComplete ? 'text-white' : 'text-slate-500'}`}>
                      {step.label}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Delivery countdown */}
            {daysUntil !== null && shipment.status !== 'delivered' && (
              <div className="mt-6 p-4 bg-slate-800 rounded-lg text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-[#CC0000]" />
                <p className="text-2xl font-bold">{daysUntil} days</p>
                <p className="text-slate-400">until estimated delivery</p>
                <p className="text-sm text-slate-500 mt-1">
                  {new Date(shipment.estimated_delivery).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {/* Delivered message */}
            {shipment.status === 'delivered' && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-lg font-bold text-green-400">Delivered!</p>
                <p className="text-slate-400">
                  {shipment.actual_delivery 
                    ? new Date(shipment.actual_delivery).toLocaleDateString()
                    : 'Enjoy your new vehicle!'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Route Info */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="w-0.5 h-16 bg-slate-700" />
                <div className="w-3 h-3 rounded-full bg-[#CC0000]" />
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <p className="text-xs text-slate-500">ORIGIN</p>
                  <p className="text-white">{shipment.origin_address}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">DESTINATION</p>
                  <p className="text-white">{shipment.destination_address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Carrier Contact */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Carrier Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{shipment.carrier_name}</p>
                <p className="text-sm text-slate-400">Professional auto transport</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="border-slate-700">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="border-slate-700">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Card */}
        {vehicle && (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                {vehicle.images?.[0] && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-800">
                    <Image
                      src={vehicle.images[0]}
                      alt={vehicleName}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold text-lg">{vehicleName}</p>
                  <p className="text-slate-400 text-sm">Your new vehicle</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="border-green-500/30 text-green-400">
                      <Shield className="h-3 w-3 mr-1" />
                      Eagle Verified
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Keep Eagle Active Modal */}
      <Dialog open={showEagleContinue} onOpenChange={setShowEagleContinue}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#CC0000]" />
              Keep Eagle Active?
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Your vehicle has been delivered! Want to keep GPS tracking active?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-800 rounded-lg">
              <p className="font-medium mb-2">Bouncie GPS Subscription</p>
              <p className="text-2xl font-bold text-[#CC0000]">$8/month</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Real-time location tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Trip history and driving scores
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Theft alerts and geofencing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Complete vehicle history transfer
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-[#CC0000] hover:bg-[#AA0000]"
                onClick={() => handleEagleContinue(true)}
              >
                Keep Eagle Active
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                className="border-slate-700"
                onClick={() => handleEagleContinue(false)}
              >
                No Thanks
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
