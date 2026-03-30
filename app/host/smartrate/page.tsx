'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Sun, Building2, Car, TrendingUp, TrendingDown, Zap, DollarSign, ChevronRight } from 'lucide-react'

export default function SmartRatePage() {
  const [enabled, setEnabled] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState('vehicle-1')
  const [floorPrice, setFloorPrice] = useState('65')
  const [ceilingPrice, setCeilingPrice] = useState('150')
  const [currentRate, setCurrentRate] = useState(112)
  const [manualRate] = useState(85)
  const [loading, setLoading] = useState(false)
  const [rateHistory, setRateHistory] = useState<any[]>([])
  const [signals, setSignals] = useState<any[]>([])

  // Mock vehicles
  const vehicles = [
    { id: 'vehicle-1', name: '2023 Toyota RAV4 AWD' },
    { id: 'vehicle-2', name: '2022 Tesla Model 3' },
    { id: 'vehicle-3', name: '2021 Ford F-150' },
  ]

  // Fetch rate data
  useEffect(() => {
    fetchRateData()
  }, [selectedVehicle])

  const fetchRateData = async () => {
    // Generate mock 14-day history
    const history = Array.from({ length: 14 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (13 - i))
      const isSmartRate = Math.random() > 0.3
      const rate = isSmartRate 
        ? Math.floor(85 + Math.random() * 45) 
        : 85
      return {
        date: date.toISOString().split('T')[0],
        rate,
        isSmartRate,
        reason: isSmartRate ? ['NASCAR Weekend', 'High Demand', 'Clear Weather', 'Low Competition'][Math.floor(Math.random() * 4)] : 'Manual Rate'
      }
    })
    setRateHistory(history)

    // Mock demand signals
    setSignals([
      { type: 'event', icon: Calendar, title: 'Local Events', description: 'NASCAR race weekend — high demand detected', status: 'high', color: 'green' },
      { type: 'weather', icon: Sun, title: 'Weather', description: 'Clear skies forecast — 15% booking increase typical', status: 'positive', color: 'green' },
      { type: 'hotels', icon: Building2, title: 'Hotel Rates', description: 'Local hotels up 23% this weekend', status: 'high', color: 'green' },
      { type: 'competition', icon: Car, title: 'Competition', description: '2 similar vehicles in area — you\'re priced 12% lower', status: 'opportunity', color: 'yellow' },
    ])
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/smartrate/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: selectedVehicle,
          targetDate: new Date().toISOString(),
          floorPrice: parseInt(floorPrice),
          ceilingPrice: parseInt(ceilingPrice),
          location: { lat: 39.5296, lng: -119.8138 } // Reno
        })
      })
      const data = await res.json()
      if (data.recommendedRate) {
        setCurrentRate(data.recommendedRate)
      }
    } catch (error) {
      console.error('Failed to calculate rate:', error)
    }
    setLoading(false)
  }

  // Calculate range visualization
  const floor = parseInt(floorPrice) || 65
  const ceiling = parseInt(ceilingPrice) || 150
  const range = ceiling - floor
  const currentPosition = ((currentRate - floor) / range) * 100

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFD84D]/10">
              <Zap className="h-6 w-6 text-[#FFD84D]" />
            </div>
            <h1 className="text-3xl font-bold">SmartRate</h1>
          </div>
          <p className="text-xl text-zinc-400 mb-2">Your Car Earns More While You Sleep</p>
          <p className="text-zinc-500 max-w-2xl">
            Set your floor and ceiling. SmartRate handles the rest — adjusting your price in real time based on local demand, events, and competition.
          </p>
          
          {/* Enable Toggle */}
          <div className="flex items-center gap-4 mt-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800 w-fit">
            <span className="font-medium">Enable SmartRate</span>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              className="data-[state=checked]:bg-[#FFD84D]"
            />
            {enabled && (
              <Badge className="bg-[#FFD84D]/10 text-[#FFD84D] border-[#FFD84D]/20">
                Active
              </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Rate Configuration Card */}
          <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Rate Configuration</CardTitle>
              <CardDescription>Set your pricing boundaries for each vehicle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vehicle Selector */}
              <div className="space-y-2">
                <Label>Select Vehicle</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rate Display */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800 rounded-xl">
                  <p className="text-sm text-zinc-500 mb-1">Current Manual Rate</p>
                  <p className="text-2xl font-mono text-zinc-400">${manualRate}/day</p>
                </div>
                <div className="p-4 bg-zinc-800 rounded-xl border border-[#FFD84D]/30">
                  <p className="text-sm text-[#FFD84D] mb-1">SmartRate Current</p>
                  <p className="text-3xl font-mono text-[#FFD84D]">${currentRate}/day</p>
                  {currentRate > manualRate ? (
                    <div className="flex items-center gap-1 text-green-500 text-sm mt-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>+${currentRate - manualRate} vs manual</span>
                    </div>
                  ) : currentRate < manualRate ? (
                    <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                      <TrendingDown className="h-4 w-4" />
                      <span>-${manualRate - currentRate} vs manual</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Floor and Ceiling */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="floor">Floor Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="floor"
                      type="number"
                      value={floorPrice}
                      onChange={(e) => setFloorPrice(e.target.value)}
                      className="pl-9 bg-zinc-800 border-zinc-700 font-mono"
                    />
                  </div>
                  <p className="text-xs text-zinc-500">Never go below this</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ceiling">Ceiling Price</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="ceiling"
                      type="number"
                      value={ceilingPrice}
                      onChange={(e) => setCeilingPrice(e.target.value)}
                      className="pl-9 bg-zinc-800 border-zinc-700 font-mono"
                    />
                  </div>
                  <p className="text-xs text-zinc-500">Never exceed this</p>
                </div>
              </div>

              {/* Range Visualization */}
              <div className="space-y-2">
                <Label>Rate Range</Label>
                <div className="relative h-8 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500/30 via-[#FFD84D]/30 to-green-500/30 w-full" />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#FFD84D] rounded-full shadow-lg shadow-[#FFD84D]/50 transition-all duration-300"
                    style={{ left: `calc(${Math.min(Math.max(currentPosition, 0), 100)}% - 8px)` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-zinc-500 font-mono">
                  <span>${floor}</span>
                  <span className="text-[#FFD84D]">${currentRate}</span>
                  <span>${ceiling}</span>
                </div>
              </div>

              <Button 
                onClick={handleSaveSettings}
                disabled={loading}
                className="w-full bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90 font-semibold"
              >
                {loading ? 'Calculating...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>

          {/* Demand Signals */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Demand Signals</h3>
            {signals.map((signal, i) => (
              <Card key={i} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      signal.color === 'green' ? 'bg-green-500/10' : 'bg-[#FFD84D]/10'
                    }`}>
                      <signal.icon className={`h-5 w-5 ${
                        signal.color === 'green' ? 'text-green-500' : 'text-[#FFD84D]'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{signal.title}</span>
                        <Badge className={`text-xs ${
                          signal.color === 'green' 
                            ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                            : 'bg-[#FFD84D]/10 text-[#FFD84D] border-[#FFD84D]/20'
                        }`}>
                          {signal.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400">{signal.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Rate History Chart */}
        <Card className="mt-8 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">14-Day Rate History</CardTitle>
            <CardDescription>
              <span className="inline-flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#FFD84D]" />
                  SmartRate
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-zinc-600" />
                  Manual
                </span>
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-48">
              {rateHistory.map((day, i) => {
                const height = ((day.rate - 50) / 100) * 100
                return (
                  <div key={i} className="flex-1 group relative">
                    <div
                      className={`w-full rounded-t transition-all ${
                        day.isSmartRate ? 'bg-[#FFD84D]' : 'bg-zinc-600'
                      } group-hover:opacity-80`}
                      style={{ height: `${height}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs whitespace-nowrap shadow-xl">
                        <p className="font-mono text-[#FFD84D]">${day.rate}/day</p>
                        <p className="text-zinc-400">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        <p className="text-zinc-500">{day.reason}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-zinc-500 mt-2">
              <span>14 days ago</span>
              <span>Today</span>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Comparison */}
        <Card className="mt-8 bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-[#FFD84D]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-6">
              <div>
                <p className="text-zinc-400 mb-1">Last 30 days with SmartRate</p>
                <p className="text-3xl font-mono text-white">$1,840</p>
              </div>
              <div className="text-center">
                <ChevronRight className="h-8 w-8 text-zinc-600" />
              </div>
              <div>
                <p className="text-zinc-400 mb-1">Estimated without SmartRate</p>
                <p className="text-3xl font-mono text-zinc-500">$1,290</p>
              </div>
              <div className="text-right">
                <p className="text-zinc-400 mb-1">Additional Earnings</p>
                <p className="text-4xl font-mono text-green-500">+$550</p>
                <p className="text-sm text-green-500/70">+42.6% increase</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
