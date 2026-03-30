'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Car, Check, DollarSign, MapPin, Calendar, Zap, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function HostDriveMonthlySettingsPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [settings, setSettings] = useState({
    discount30Day: 7,
    discount60Day: 15,
    discount90Day: 25,
    mileageLimit: 1500,
    overageRate: 0.25,
    deliveryEnabled: false,
    deliveryRadius: 25,
    deliveryFee: 49,
    blockedDates: [] as string[],
  })

  useEffect(() => {
    // Load host's vehicles
    const loadVehicles = async () => {
      try {
        const res = await fetch('/api/host/vehicles')
        const data = await res.json()
        setVehicles(Array.isArray(data) ? data.map((v: any) => ({ ...v, monthlyEnabled: false })) : [])
      } catch (error) {
        // Mock data
        setVehicles([
          { id: '1', year: 2024, make: 'Tesla', model: 'Model 3', monthlyEnabled: true },
          { id: '2', year: 2023, make: 'Toyota', model: 'RAV4', monthlyEnabled: false },
        ])
      }
    }
    loadVehicles()
  }, [])

  const toggleVehicle = (vehicleId: string) => {
    setVehicles(vehicles.map(v => 
      v.id === vehicleId ? { ...v, monthlyEnabled: !v.monthlyEnabled } : v
    ))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/host/drivemonthly/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicles: vehicles.filter(v => v.monthlyEnabled).map(v => v.id),
          settings,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/hostslab/lobby" className="inline-flex items-center text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to HostsLab
            </Link>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-[#FFD84D] hover:bg-[#FFD84D]/90 text-black font-semibold"
            >
              {saving ? 'Saving...' : saved ? (
                <>
                  <Check className="h-4 w-4 mr-2" /> Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Badge className="mb-4 bg-[#FFD84D]/10 text-[#FFD84D] border-[#FFD84D]/30 font-mono">
              DriveMonthly Host Settings
            </Badge>
            <h1 className="text-3xl font-bold mb-2">Monthly Rental Settings</h1>
            <p className="text-zinc-400">
              Configure which vehicles are available for monthly rentals and set your pricing.
            </p>
          </div>

          <div className="space-y-8">
            {/* Vehicle Selection */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-[#FFD84D]" />
                  Enable DriveMonthly for Vehicles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vehicles.length === 0 ? (
                    <p className="text-zinc-500 text-center py-8">
                      No vehicles found. Add a vehicle first.
                    </p>
                  ) : (
                    vehicles.map((vehicle) => (
                      <div 
                        key={vehicle.id}
                        className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                          {vehicle.monthlyEnabled && (
                            <Badge className="mt-1 bg-[#FFD84D]/10 text-[#FFD84D] border-[#FFD84D]/30 text-xs">
                              Monthly Enabled
                            </Badge>
                          )}
                        </div>
                        <Switch
                          checked={vehicle.monthlyEnabled}
                          onCheckedChange={() => toggleVehicle(vehicle.id)}
                          className="data-[state=checked]:bg-[#FFD84D]"
                        />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Discount Settings */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#FFD84D]" />
                  Monthly Discounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-zinc-400">30-Day Discount</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        value={settings.discount30Day}
                        onChange={(e) => setSettings({ ...settings, discount30Day: Number(e.target.value) })}
                        className="bg-zinc-800 border-zinc-700 text-white w-20"
                        min={0}
                        max={50}
                      />
                      <span className="text-zinc-400">%</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Default: 7%</p>
                  </div>
                  <div>
                    <Label className="text-zinc-400">60-Day Discount</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        value={settings.discount60Day}
                        onChange={(e) => setSettings({ ...settings, discount60Day: Number(e.target.value) })}
                        className="bg-zinc-800 border-zinc-700 text-white w-20"
                        min={0}
                        max={50}
                      />
                      <span className="text-zinc-400">%</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Default: 15%</p>
                  </div>
                  <div>
                    <Label className="text-zinc-400">90-Day Discount</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        value={settings.discount90Day}
                        onChange={(e) => setSettings({ ...settings, discount90Day: Number(e.target.value) })}
                        className="bg-zinc-800 border-zinc-700 text-white w-20"
                        min={0}
                        max={50}
                      />
                      <span className="text-zinc-400">%</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Default: 25%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mileage Settings */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#FFD84D]" />
                  Mileage Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-zinc-400">Monthly Mileage Limit</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        value={settings.mileageLimit}
                        onChange={(e) => setSettings({ ...settings, mileageLimit: Number(e.target.value) })}
                        className="bg-zinc-800 border-zinc-700 text-white w-32"
                        min={500}
                        max={5000}
                        step={100}
                      />
                      <span className="text-zinc-400">miles/month</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Default: 1,500 miles</p>
                  </div>
                  <div>
                    <Label className="text-zinc-400">Overage Rate</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-zinc-400">$</span>
                      <Input
                        type="number"
                        value={settings.overageRate}
                        onChange={(e) => setSettings({ ...settings, overageRate: Number(e.target.value) })}
                        className="bg-zinc-800 border-zinc-700 text-white w-20"
                        min={0.1}
                        max={1}
                        step={0.05}
                      />
                      <span className="text-zinc-400">/mile</span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">Default: $0.25/mile</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Settings */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#FFD84D]" />
                  Delivery Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Offer Delivery</p>
                      <p className="text-sm text-zinc-500">Deliver vehicle to renter&apos;s location</p>
                    </div>
                    <Switch
                      checked={settings.deliveryEnabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, deliveryEnabled: checked })}
                      className="data-[state=checked]:bg-[#FFD84D]"
                    />
                  </div>

                  {settings.deliveryEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800">
                      <div>
                        <Label className="text-zinc-400">Delivery Radius</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            type="number"
                            value={settings.deliveryRadius}
                            onChange={(e) => setSettings({ ...settings, deliveryRadius: Number(e.target.value) })}
                            className="bg-zinc-800 border-zinc-700 text-white w-20"
                            min={5}
                            max={100}
                          />
                          <span className="text-zinc-400">miles</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-zinc-400">Delivery Fee</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-zinc-400">$</span>
                          <Input
                            type="number"
                            value={settings.deliveryFee}
                            onChange={(e) => setSettings({ ...settings, deliveryFee: Number(e.target.value) })}
                            className="bg-zinc-800 border-zinc-700 text-white w-20"
                            min={0}
                            max={200}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Blocked Dates */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#FFD84D]" />
                  Block Out Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400 mb-4">
                  Block dates when your vehicles are not available for monthly rentals.
                </p>
                <Input
                  type="date"
                  className="bg-zinc-800 border-zinc-700 text-white w-48"
                  onChange={(e) => {
                    if (e.target.value && !settings.blockedDates.includes(e.target.value)) {
                      setSettings({
                        ...settings,
                        blockedDates: [...settings.blockedDates, e.target.value]
                      })
                    }
                  }}
                />
                {settings.blockedDates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {settings.blockedDates.map((date) => (
                      <Badge 
                        key={date}
                        className="bg-zinc-800 text-zinc-300 cursor-pointer hover:bg-red-900/30"
                        onClick={() => setSettings({
                          ...settings,
                          blockedDates: settings.blockedDates.filter(d => d !== date)
                        })}
                      >
                        {date} &times;
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
