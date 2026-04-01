// CACHE-BUST-2026-04-01-FULL-STANDARDIZATION
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Package, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Addon {
  id: string
  name: string
  icon: string
  description: string
  price: number
  quantity: number
}

export default function BookingAddonsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = use(params)
  const router = useRouter()
  const [addons, setAddons] = useState<Addon[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Mock booking data
    setBooking({
      id: bookingId,
      vehicleId: 'vehicle-123',
      vehicleName: '2023 Toyota 4Runner',
      baseTotal: 285,
    })

    // Mock addons
    setAddons([
      { id: '1', icon: '👶', name: 'Infant Car Seat', price: 15, quantity: 2, description: 'Rear-facing infant car seat for babies up to 35 lbs' },
      { id: '2', icon: '🧒', name: 'Booster Seat', price: 10, quantity: 2, description: 'Belt-positioning booster for kids 40-100 lbs' },
      { id: '3', icon: '🧊', name: 'Cooler (48qt)', price: 12, quantity: 1, description: 'Large cooler perfect for road trips and picnics' },
      { id: '4', icon: '⛓️', name: 'Tire Chains', price: 20, quantity: 1, description: 'Snow chains for winter mountain driving' },
      { id: '5', icon: '🏔️', name: 'Ski/Snowboard Rack', price: 18, quantity: 1, description: 'Roof-mounted rack holds 4 skis or 2 boards' },
      { id: '6', icon: '📡', name: 'Mobile WiFi Hotspot', price: 15, quantity: 1, description: 'Unlimited 4G LTE data for your trip' },
    ])
  }, [bookingId])

  const toggleAddon = (addon: Addon) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(addon.id)) {
      newSelected.delete(addon.id)
    } else {
      newSelected.add(addon.id)
    }
    setSelectedIds(newSelected)
  }

  const selectedAddons = addons.filter(a => selectedIds.has(a.id))
  const addonTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0)
  const newTotal = (booking?.baseTotal || 0) + addonTotal

  const handleAddToBooking = async () => {
    if (selectedIds.size === 0) {
      router.push(`/booking/success?id=${bookingId}`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/addons/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          addonIds: Array.from(selectedIds),
        }),
      })
      const data = await res.json()
      
      // Redirect to success or payment
      router.push(`/booking/success?id=${bookingId}&addons=${selectedIds.size}`)
    } catch (error) {
      console.error('Failed to add addons:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFD84D]/10">
              <Package className="h-8 w-8 text-[#FFD84D]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Make Your Trip Better</h1>
          <p className="text-zinc-400">Add extras to your {booking?.vehicleName} rental</p>
        </div>

        {/* Add-ons Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {addons.map((addon) => {
            const isSelected = selectedIds.has(addon.id)
            return (
              <Card
                key={addon.id}
                onClick={() => toggleAddon(addon)}
                className={`cursor-pointer transition-all bg-zinc-900 hover:bg-zinc-800 ${
                  isSelected 
                    ? 'border-[#FFD84D] ring-1 ring-[#FFD84D]' 
                    : 'border-zinc-800'
                }`}
              >
                <CardContent className="p-4 relative">
                  {isSelected && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-[#FFD84D] flex items-center justify-center">
                      <Check className="h-4 w-4 text-black" />
                    </div>
                  )}
                  <div className="text-4xl mb-3">{addon.icon}</div>
                  <h3 className="font-semibold text-sm">{addon.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{addon.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono text-lg text-[#FFD84D] font-bold">+${addon.price}</span>
                    {addon.quantity > 1 && (
                      <span className="text-xs text-zinc-500">{addon.quantity} avail</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Summary */}
        <Card className="bg-zinc-900 border-zinc-800 mb-6">
          <CardContent className="py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Base Rental</span>
              <span className="font-mono">${booking?.baseTotal || 0}</span>
            </div>
            {addonTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Add-ons ({selectedIds.size})</span>
                <span className="font-mono text-[#FFD84D]">+${addonTotal}</span>
              </div>
            )}
            <div className="border-t border-zinc-800 pt-3 flex justify-between">
              <span className="font-semibold">New Total</span>
              <span className="font-mono text-xl font-bold text-[#FFD84D]">${newTotal}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleAddToBooking}
            className="w-full bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90 h-12 text-lg font-semibold"
            disabled={loading}
          >
            {loading ? 'Processing...' : selectedIds.size > 0 ? 'Add to My Booking' : 'Continue'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <button
            onClick={() => router.push(`/booking/success?id=${bookingId}`)}
            className="w-full text-center text-sm text-zinc-500 hover:text-zinc-300 py-2"
          >
            Continue without add-ons
          </button>
        </div>
      </div>
    </div>
  )
}
