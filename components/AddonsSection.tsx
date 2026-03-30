'use client'

import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Addon {
  id: string
  name: string
  icon: string
  description: string
  price: number
  quantity: number
  category: string
}

interface AddonsSectionProps {
  vehicleId: string
  onAddonsChange?: (selectedAddons: Addon[], total: number) => void
}

export default function AddonsSection({ vehicleId, onAddonsChange }: AddonsSectionProps) {
  const [addons, setAddons] = useState<Addon[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const res = await fetch(`/api/addons/list?vehicleId=${vehicleId}`)
        const data = await res.json()
        setAddons(Array.isArray(data) ? data : [])
      } catch (error) {
        // Mock data fallback
        setAddons([
          { id: '1', icon: '👶', name: 'Infant Car Seat', price: 15, quantity: 2, description: 'Rear-facing infant car seat', category: 'Baby & Kids' },
          { id: '2', icon: '🧊', name: 'Cooler (48qt)', price: 12, quantity: 1, description: 'Large cooler for road trips', category: 'Comfort' },
          { id: '3', icon: '⛓️', name: 'Tire Chains', price: 20, quantity: 1, description: 'Snow chains for winter driving', category: 'Adventure' },
          { id: '4', icon: '📡', name: 'WiFi Hotspot', price: 15, quantity: 1, description: 'Unlimited 4G LTE data', category: 'Travel' },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchAddons()
  }, [vehicleId])

  const toggleAddon = (addon: Addon) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(addon.id)) {
      newSelected.delete(addon.id)
    } else {
      newSelected.add(addon.id)
    }
    setSelectedIds(newSelected)

    const selectedAddons = addons.filter(a => newSelected.has(a.id))
    const total = selectedAddons.reduce((sum, a) => sum + a.price, 0)
    onAddonsChange?.(selectedAddons, total)
  }

  const total = addons.filter(a => selectedIds.has(a.id)).reduce((sum, a) => sum + a.price, 0)

  if (loading) {
    return <div className="animate-pulse bg-zinc-800 rounded-lg h-32" />
  }

  if (addons.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Add Extras to Your Rental</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[#FFD84D] flex items-center justify-center">
                    <Check className="h-3 w-3 text-black" />
                  </div>
                )}
                <div className="text-3xl mb-2">{addon.icon}</div>
                <h4 className="font-medium text-sm">{addon.name}</h4>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{addon.description}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-[#FFD84D] font-semibold">+${addon.price}</span>
                  {addon.quantity > 1 && (
                    <span className="text-xs text-zinc-500">{addon.quantity} available</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between p-3 bg-[#FFD84D]/10 rounded-lg border border-[#FFD84D]/20 transition-all">
          <span className="text-sm text-zinc-300">Add-ons:</span>
          <span className="font-mono font-semibold text-[#FFD84D]">+${total}</span>
        </div>
      )}
    </div>
  )
}
