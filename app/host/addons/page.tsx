'use client'

import { useState, useEffect } from 'react'
import { Plus, Package, ToggleLeft, ToggleRight, Pencil, Trash2, Upload, Baby, Snowflake, Mountain, Navigation, Wifi, Tent, CreditCard, Umbrella, Link2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const CATEGORIES = ['Safety', 'Comfort', 'Adventure', 'Travel', 'Baby & Kids', 'Other']

const DEFAULT_ADDONS = [
  { icon: '👶', name: 'Infant Car Seat', suggestedPrice: 15, category: 'Baby & Kids', description: 'Rear-facing infant car seat for babies up to 35 lbs' },
  { icon: '🧒', name: 'Booster Seat', suggestedPrice: 10, category: 'Baby & Kids', description: 'Belt-positioning booster for kids 40-100 lbs' },
  { icon: '🧊', name: 'Cooler (48qt)', suggestedPrice: 12, category: 'Comfort', description: 'Large cooler perfect for road trips and picnics' },
  { icon: '⛓️', name: 'Tire Chains (pair)', suggestedPrice: 20, category: 'Adventure', description: 'Snow chains for winter mountain driving' },
  { icon: '🏔️', name: 'Ski/Snowboard Rack', suggestedPrice: 18, category: 'Adventure', description: 'Roof-mounted rack holds 4 skis or 2 boards' },
  { icon: '🧭', name: 'Portable GPS', suggestedPrice: 10, category: 'Travel', description: 'Standalone GPS device with offline maps' },
  { icon: '📡', name: 'Mobile WiFi Hotspot', suggestedPrice: 15, category: 'Travel', description: 'Unlimited 4G LTE data for your trip' },
  { icon: '🏕️', name: 'Camping Kit', suggestedPrice: 25, category: 'Adventure', description: 'Tent, sleeping bags, and camp stove included' },
  { icon: '🚗', name: 'Toll Pass / EZ Pass', suggestedPrice: 8, category: 'Travel', description: 'Pre-loaded toll transponder for highways' },
  { icon: '🌂', name: 'Umbrella + Rain Kit', suggestedPrice: 5, category: 'Comfort', description: 'Umbrella, rain ponchos, and microfiber towels' },
]

export default function HostAddonsPage() {
  const [addons, setAddons] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    quantity: '1',
    icon: '📦',
    active: true,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Initialize with default suggestions
    const savedAddons = DEFAULT_ADDONS.map((addon, i) => ({
      id: `default-${i}`,
      ...addon,
      price: addon.suggestedPrice,
      quantity: 1,
      active: false,
    }))
    setAddons(savedAddons)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/addons/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
        }),
      })
      const data = await res.json()

      setAddons([
        ...addons,
        {
          id: data.addonId || `custom-${Date.now()}`,
          ...formData,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
        },
      ])

      setFormData({ name: '', category: '', description: '', price: '', quantity: '1', icon: '📦', active: true })
      setShowForm(false)
    } catch (error) {
      console.error('Failed to create addon:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAddon = (id: string) => {
    setAddons(addons.map(a => a.id === id ? { ...a, active: !a.active } : a))
  }

  const activeCount = addons.filter(a => a.active).length
  const potentialEarnings = addons.filter(a => a.active).reduce((sum, a) => sum + a.price, 0)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFD84D]/10">
              <Package className="h-6 w-6 text-[#FFD84D]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Boost Your Earnings with Add-Ons</h1>
              <p className="text-zinc-400">Offer extras renters need — earn more per booking with zero extra work</p>
            </div>
          </div>
          <Card className="bg-gradient-to-r from-[#FFD84D]/10 to-transparent border-[#FFD84D]/20">
            <CardContent className="py-4">
              <p className="text-sm">
                <span className="text-[#FFD84D] font-semibold">Hosts with add-ons earn 22% more</span>
                <span className="text-zinc-400"> per rental on average</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-mono font-bold text-[#FFD84D]">{activeCount}</p>
              <p className="text-xs text-zinc-400">Active Add-Ons</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-mono font-bold text-[#FFD84D]">${potentialEarnings}</p>
              <p className="text-xs text-zinc-400">Per Rental Potential</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-mono font-bold text-green-500">85%</p>
              <p className="text-xs text-zinc-400">You Keep</p>
            </CardContent>
          </Card>
        </div>

        {/* Add New Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Add-On
          </Button>
        </div>

        {/* Add Form */}
        {showForm && (
          <Card className="bg-zinc-900 border-zinc-800 mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Create New Add-On</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Add-on Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Beach Chairs"
                      className="bg-zinc-800 border-zinc-700"
                      required
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Description (200 char max)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, 200) })}
                    placeholder="Brief description of the add-on..."
                    className="bg-zinc-800 border-zinc-700"
                    rows={2}
                    maxLength={200}
                  />
                  <p className="text-xs text-zinc-500 mt-1">{formData.description.length}/200</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price per Rental ($)</Label>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="15.00"
                      className="bg-zinc-800 border-zinc-700 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <Label>Quantity Available</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="bg-zinc-800 border-zinc-700"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-zinc-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Add-On'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Add-ons List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold mb-4">Your Add-Ons</h2>
          {addons.map((addon) => (
            <Card
              key={addon.id}
              className={`bg-zinc-900 border transition-colors ${
                addon.active ? 'border-[#FFD84D]/50' : 'border-zinc-800'
              }`}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{addon.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{addon.name}</h3>
                      <Badge variant="outline" className="text-xs border-zinc-700">
                        {addon.category}
                      </Badge>
                      {addon.active && (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">{addon.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg text-[#FFD84D]">${addon.price}</p>
                    <p className="text-xs text-zinc-500">per rental</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={addon.active}
                      onCheckedChange={() => toggleAddon(addon.id)}
                    />
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tips */}
        <Card className="mt-8 bg-zinc-900 border-zinc-800">
          <CardContent className="py-4">
            <h3 className="font-semibold mb-2">Tips for Add-On Success</h3>
            <ul className="text-sm text-zinc-400 space-y-1">
              <li>• Price competitively — $10-25 is the sweet spot for most add-ons</li>
              <li>• Winter add-ons (chains, racks) are essential for Tahoe trips</li>
              <li>• Baby gear is in high demand from traveling families</li>
              <li>• Keep items clean and in good condition for 5-star reviews</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
