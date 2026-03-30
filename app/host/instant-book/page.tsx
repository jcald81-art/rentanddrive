'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Zap, Shield, Clock, TrendingUp, CheckCircle2, Info } from 'lucide-react'

export default function InstantBookPage() {
  const [enabled, setEnabled] = useState(true)
  const [threshold, setThreshold] = useState([55])
  const [saving, setSaving] = useState(false)
  const [criteria, setCriteria] = useState({
    idVerified: true, // Required, cannot toggle off
    noIncidents: true,
    completedRental: true,
    accountAge: true,
    rating: true,
    profilePhoto: false,
  })
  const [vehicleOverrides, setVehicleOverrides] = useState<Record<string, number>>({})
  const [vehicles, setVehicles] = useState([
    { id: '1', name: '2023 Tesla Model 3', category: 'Electric' },
    { id: '2', name: '2022 Porsche 911', category: 'Sports' },
    { id: '3', name: '2024 Toyota 4Runner', category: 'SUV' },
  ])

  const getThresholdDescription = (value: number) => {
    if (value <= 40) return { text: 'Very permissive — most renters qualify', color: 'text-green-500' }
    if (value <= 65) return { text: 'Balanced — verified renters qualify', color: 'text-yellow-500', recommended: true }
    if (value <= 85) return { text: 'Strict — only top-rated renters qualify', color: 'text-orange-500' }
    return { text: 'Very strict — almost no Instant Book', color: 'text-red-500' }
  }

  const getEstimatedQualification = (value: number) => {
    if (value <= 30) return 95
    if (value <= 50) return 78
    if (value <= 65) return 55
    if (value <= 80) return 30
    return 12
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/host/instant-book/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, threshold: threshold[0], criteria, vehicleOverrides }),
      })
    } finally {
      setSaving(false)
    }
  }

  const description = getThresholdDescription(threshold[0])

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-500" />
              Instant Book
            </h1>
            <p className="text-zinc-400 mt-1">Auto-approve qualified renters instantly</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">Enable Instant Book</span>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>

        {/* Explainer Card */}
        <Card className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-zinc-300">
                  <strong className="text-white">Instant Book</strong> means qualified renters can book immediately — no waiting for your approval.
                </p>
                <p className="text-zinc-400 text-sm">
                  You set the trust threshold. Renters below it still require manual approval.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    3x more bookings
                  </Badge>
                  <span className="text-sm text-zinc-500">on average with Instant Book enabled</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Threshold Slider */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Minimum Trust Score to Instant Book</CardTitle>
            <CardDescription>Renters with scores below this threshold will require your manual approval</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-mono font-bold text-white">{threshold[0]}</span>
                {description.recommended && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    Recommended
                  </Badge>
                )}
              </div>
              
              <Slider
                value={threshold}
                onValueChange={setThreshold}
                max={100}
                min={0}
                step={5}
                className="py-4"
              />
              
              <div className="flex justify-between text-xs text-zinc-500">
                <span>0 (Permissive)</span>
                <span>50</span>
                <span>100 (Strict)</span>
              </div>
            </div>

            <div className={`p-4 rounded-lg bg-zinc-800/50 border border-zinc-700 ${description.color}`}>
              <p className="font-medium">{description.text}</p>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-zinc-500" />
              <span className="text-zinc-400">
                Estimated <span className="font-mono font-bold text-white">{getEstimatedQualification(threshold[0])}%</span> of renters qualify for Instant Book at this threshold
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Qualification Criteria */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Qualification Criteria</CardTitle>
            <CardDescription>Choose which factors determine a renter&apos;s trust score</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ID Verified - Required */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">ID Verified</p>
                  <p className="text-sm text-zinc-500">Renter has verified their identity</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-zinc-700 text-zinc-300">Required</Badge>
                <Switch checked={true} disabled />
              </div>
            </div>

            {/* No Prior Incidents */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30 border border-zinc-800">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="font-medium">No Prior Incidents</p>
                  <p className="text-sm text-zinc-500">Clean rental history with no claims</p>
                </div>
              </div>
              <Switch 
                checked={criteria.noIncidents} 
                onCheckedChange={(v) => setCriteria(c => ({ ...c, noIncidents: v }))} 
              />
            </div>

            {/* Completed Rental */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30 border border-zinc-800">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="font-medium">At Least 1 Completed Rental</p>
                  <p className="text-sm text-zinc-500">Not a first-time renter</p>
                </div>
              </div>
              <Switch 
                checked={criteria.completedRental} 
                onCheckedChange={(v) => setCriteria(c => ({ ...c, completedRental: v }))} 
              />
            </div>

            {/* Account Age */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30 border border-zinc-800">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="font-medium">Account Age 30+ Days</p>
                  <p className="text-sm text-zinc-500">Established account on platform</p>
                </div>
              </div>
              <Switch 
                checked={criteria.accountAge} 
                onCheckedChange={(v) => setCriteria(c => ({ ...c, accountAge: v }))} 
              />
            </div>

            {/* Rating */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30 border border-zinc-800">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="font-medium">4.5+ Renter Rating</p>
                  <p className="text-sm text-zinc-500">High-rated by other hosts</p>
                </div>
              </div>
              <Switch 
                checked={criteria.rating} 
                onCheckedChange={(v) => setCriteria(c => ({ ...c, rating: v }))} 
              />
            </div>

            {/* Profile Photo */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30 border border-zinc-800">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-zinc-400" />
                <div>
                  <p className="font-medium">Profile Photo Uploaded</p>
                  <p className="text-sm text-zinc-500">Has a visible profile picture</p>
                </div>
              </div>
              <Switch 
                checked={criteria.profilePhoto} 
                onCheckedChange={(v) => setCriteria(c => ({ ...c, profilePhoto: v }))} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Vehicle-Specific Overrides */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Vehicle-Specific Settings</CardTitle>
            <CardDescription>Override the default threshold for specific vehicles (e.g., require higher scores for luxury cars)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/30 border border-zinc-800">
                <div>
                  <p className="font-medium">{vehicle.name}</p>
                  <p className="text-sm text-zinc-500">{vehicle.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={vehicleOverrides[vehicle.id]?.toString() || 'default'}
                    onValueChange={(v) => {
                      if (v === 'default') {
                        const { [vehicle.id]: _, ...rest } = vehicleOverrides
                        setVehicleOverrides(rest)
                      } else {
                        setVehicleOverrides({ ...vehicleOverrides, [vehicle.id]: parseInt(v) })
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder="Use default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Use default ({threshold[0]})</SelectItem>
                      <SelectItem value="50">Score 50+</SelectItem>
                      <SelectItem value="65">Score 65+</SelectItem>
                      <SelectItem value="80">Score 80+ (Strict)</SelectItem>
                      <SelectItem value="90">Score 90+ (Very Strict)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
