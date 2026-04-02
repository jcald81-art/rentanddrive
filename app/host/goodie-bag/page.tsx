"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Package, Truck, CheckCircle2, Clock, MapPin, 
  Gift, ShoppingBag, ExternalLink, RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface GoodieBagOrder {
  id: string
  host_id: string
  order_status: 'pending' | 'processing' | 'shipped' | 'delivered'
  tracking_number?: string
  carrier?: string
  estimated_delivery?: string
  items: {
    name: string
    quantity: number
    image?: string
  }[]
  shipping_address: {
    name: string
    street: string
    city: string
    state: string
    zip: string
  }
  created_at: string
  updated_at: string
}

const GOODIE_BAG_ITEMS = [
  { name: 'RAD Keychain', image: '/images/goodie/keychain.jpg', included: true },
  { name: 'Car Air Freshener (3-pack)', image: '/images/goodie/freshener.jpg', included: true },
  { name: 'RAD Window Decal', image: '/images/goodie/decal.jpg', included: true },
  { name: 'Welcome Card Pack', image: '/images/goodie/cards.jpg', included: true },
  { name: 'RAD Microfiber Cloth', image: '/images/goodie/cloth.jpg', included: true },
  { name: 'Phone Mount Clip', image: '/images/goodie/mount.jpg', included: true },
]

export default function GoodieBagPage() {
  const [order, setOrder] = useState<GoodieBagOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      // Check for existing goodie bag order
      const { data: orderData } = await supabase
        .from('goodie_bag_orders')
        .select('*')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (orderData) {
        setOrder(orderData)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const requestGoodieBag = async () => {
    setRequesting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !profile) {
      setRequesting(false)
      return
    }

    // Create order in database
    const newOrder: Partial<GoodieBagOrder> = {
      host_id: user.id,
      order_status: 'pending',
      items: GOODIE_BAG_ITEMS.map(item => ({
        name: item.name,
        quantity: 1,
        image: item.image
      })),
      shipping_address: {
        name: profile.full_name || '',
        street: profile.address_line1 || '',
        city: profile.city || 'Reno',
        state: profile.state || 'NV',
        zip: profile.zip || '89501'
      }
    }

    const { data, error } = await supabase
      .from('goodie_bag_orders')
      .insert(newOrder)
      .select()
      .single()

    if (!error && data) {
      setOrder(data)
    }

    setRequesting(false)
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          label: 'Order Received', 
          color: 'bg-amber-500/10 text-amber-400',
          icon: Clock,
          description: 'Your order has been received and is being prepared by 4imprint.'
        }
      case 'processing':
        return { 
          label: 'Processing', 
          color: 'bg-blue-500/10 text-blue-400',
          icon: Package,
          description: 'Your goodie bag is being assembled and will ship soon.'
        }
      case 'shipped':
        return { 
          label: 'Shipped', 
          color: 'bg-purple-500/10 text-purple-400',
          icon: Truck,
          description: 'Your package is on its way!'
        }
      case 'delivered':
        return { 
          label: 'Delivered', 
          color: 'bg-emerald-500/10 text-emerald-400',
          icon: CheckCircle2,
          description: 'Your goodie bag has been delivered. Enjoy!'
        }
      default:
        return { 
          label: status, 
          color: 'bg-white/10 text-white/50',
          icon: Package,
          description: ''
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 bg-white/10 rounded" />
            <div className="h-64 bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-[#FF4D4D]/10 flex items-center justify-center">
              <Gift className="h-6 w-6 text-[#FF4D4D]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">RAD Host Goodie Bag</h1>
              <p className="text-white/50">Welcome kit for RAD hosts - powered by 4imprint</p>
            </div>
          </div>
        </div>

        {/* Order Status or Request */}
        {order ? (
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="bg-[#151515] border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Order Status</CardTitle>
                    <CardDescription className="text-white/50">
                      Order placed on {new Date(order.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusInfo(order.order_status).color}>
                    {(() => {
                      const StatusIcon = getStatusInfo(order.order_status).icon
                      return <StatusIcon className="h-3.5 w-3.5 mr-1.5" />
                    })()}
                    {getStatusInfo(order.order_status).label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Progress Tracker */}
                <div className="relative mb-6">
                  <div className="flex justify-between mb-2">
                    {['pending', 'processing', 'shipped', 'delivered'].map((step, index) => {
                      const isComplete = ['pending', 'processing', 'shipped', 'delivered'].indexOf(order.order_status) >= index
                      const isCurrent = order.order_status === step
                      return (
                        <div key={step} className="flex flex-col items-center flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                            isComplete ? 'bg-[#FF4D4D]' : 'bg-white/10'
                          } ${isCurrent ? 'ring-2 ring-[#FF4D4D] ring-offset-2 ring-offset-[#151515]' : ''}`}>
                            {isComplete ? (
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            ) : (
                              <span className="text-white/40 text-sm">{index + 1}</span>
                            )}
                          </div>
                          <span className={`text-xs capitalize ${isComplete ? 'text-white' : 'text-white/40'}`}>
                            {step}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/10 -z-10">
                    <div 
                      className="h-full bg-[#FF4D4D] transition-all duration-500"
                      style={{ 
                        width: `${(['pending', 'processing', 'shipped', 'delivered'].indexOf(order.order_status) / 3) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                <p className="text-white/70 text-sm mb-4">
                  {getStatusInfo(order.order_status).description}
                </p>

                {/* Tracking Info */}
                {order.tracking_number && (
                  <div className="p-4 bg-white/5 rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/50 text-sm">Tracking Number</p>
                        <p className="text-white font-mono">{order.tracking_number}</p>
                        {order.carrier && (
                          <p className="text-white/50 text-xs mt-1">via {order.carrier}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="border-white/10 text-white">
                        <ExternalLink className="h-4 w-4 mr-1.5" />
                        Track Package
                      </Button>
                    </div>
                  </div>
                )}

                {/* Shipping Address */}
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-white/40 mt-0.5" />
                    <div>
                      <p className="text-white/50 text-sm mb-1">Shipping to</p>
                      <p className="text-white">{order.shipping_address?.name}</p>
                      <p className="text-white/70 text-sm">
                        {order.shipping_address?.street}<br />
                        {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.zip}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items List */}
            <Card className="bg-[#151515] border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Package Contents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {GOODIE_BAG_ITEMS.map((item, index) => (
                    <div key={index} className="p-3 bg-white/5 rounded-lg">
                      <div className="w-full aspect-square bg-white/10 rounded-lg mb-2 flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-white/30" />
                      </div>
                      <p className="text-white text-sm font-medium">{item.name}</p>
                      <p className="text-white/40 text-xs">Qty: 1</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Request Goodie Bag */
          <Card className="bg-[#151515] border-white/10">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full bg-[#FF4D4D]/10 flex items-center justify-center mx-auto mb-4">
                  <Gift className="h-10 w-10 text-[#FF4D4D]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Welcome to the RAD Host Family!</h2>
                <p className="text-white/50 max-w-md mx-auto">
                  As a thank you for joining RAD Rent and Drive, we&apos;d like to send you a free goodie bag 
                  with branded essentials for your vehicle.
                </p>
              </div>

              {/* Items Preview */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {GOODIE_BAG_ITEMS.map((item, index) => (
                  <div key={index} className="p-3 bg-white/5 rounded-lg text-center">
                    <div className="w-full aspect-square bg-white/10 rounded-lg mb-2 flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-white/30" />
                    </div>
                    <p className="text-white text-sm font-medium">{item.name}</p>
                    <Badge className="mt-1 bg-emerald-500/10 text-emerald-400 text-xs">Free</Badge>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-4">
                <Button 
                  onClick={requestGoodieBag}
                  disabled={requesting}
                  className="bg-[#FF4D4D] hover:bg-[#e63939] text-white px-8 py-6 text-lg font-medium"
                >
                  {requesting ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Gift className="h-5 w-5 mr-2" />
                      Request Your Free Goodie Bag
                    </>
                  )}
                </Button>
                <p className="text-white/40 text-sm">
                  Ships free via 4imprint within 5-7 business days
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link href="/host/dashboard" className="text-[#FF4D4D] hover:underline text-sm">
            Back to Host Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
