'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Snowflake, Tornado, Waves, CloudLightning, Wind, CloudFog, CloudRain, Thermometer, Car, Construction, TrafficCone, AlertTriangle, Siren, Fuel, Lock, Check, Bell, MessageSquare, Moon, MapPin, RotateCcw, Settings } from 'lucide-react'

interface AlertPreferences {
  masterEnabled: boolean
  weather: {
    winterStorm: boolean
    tornado: boolean
    flashFlood: boolean
    severeThunderstorm: boolean
    highWind: boolean
    denseFog: boolean
    rain: boolean
    extremeHeat: boolean
  }
  traffic: {
    accidents: boolean
    roadClosures: boolean
    construction: boolean
    trafficJams: boolean
    laneClosures: boolean
    emergencyVehicles: boolean
    brokenDownVehicles: boolean
  }
  threshold: 'major' | 'balanced' | 'everything'
  minimumDelayMinutes: number
  notificationMethod: {
    weather: 'push+app' | 'sms' | 'app-only'
    traffic: 'push' | 'app-only' | 'off'
  }
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
  }
  repeatInterval: number
  snoozeUntil: string | null
  radius: {
    weatherMiles: number
    trafficMiles: number
  }
}

const defaultPreferences: AlertPreferences = {
  masterEnabled: true,
  weather: {
    winterStorm: true,
    tornado: true,
    flashFlood: true,
    severeThunderstorm: true,
    highWind: true,
    denseFog: true,
    rain: true,
    extremeHeat: true
  },
  traffic: {
    accidents: true,
    roadClosures: true,
    construction: true,
    trafficJams: true,
    laneClosures: true,
    emergencyVehicles: true,
    brokenDownVehicles: true
  },
  threshold: 'balanced',
  minimumDelayMinutes: 5,
  notificationMethod: {
    weather: 'push+app',
    traffic: 'push'
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00'
  },
  repeatInterval: 10,
  snoozeUntil: null,
  radius: {
    weatherMiles: 10,
    trafficMiles: 1
  }
}

export default function AlertPreferencesPage() {
  const [preferences, setPreferences] = useState<AlertPreferences>(defaultPreferences)
  const [showMasterOffDialog, setShowMasterOffDialog] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/renter/alert-preferences')
      if (res.ok) {
        const data = await res.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async (newPrefs: AlertPreferences) => {
    // Enforce tornado always true
    newPrefs.weather.tornado = true
    
    setPreferences(newPrefs)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    
    try {
      await fetch('/api/renter/alert-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrefs)
      })
    } catch (error) {
      console.error('Failed to save preferences:', error)
    }
  }

  const handleMasterToggle = (enabled: boolean) => {
    if (!enabled) {
      setShowMasterOffDialog(true)
    } else {
      savePreferences({ ...preferences, masterEnabled: true })
    }
  }

  const confirmMasterOff = () => {
    savePreferences({ ...preferences, masterEnabled: false })
    setShowMasterOffDialog(false)
  }

  const updateWeather = (key: keyof AlertPreferences['weather'], value: boolean) => {
    if (key === 'tornado') return // Cannot disable tornado
    savePreferences({
      ...preferences,
      weather: { ...preferences.weather, [key]: value }
    })
  }

  const updateTraffic = (key: keyof AlertPreferences['traffic'], value: boolean) => {
    savePreferences({
      ...preferences,
      traffic: { ...preferences.traffic, [key]: value }
    })
  }

  const resetToDefaults = () => {
    savePreferences(defaultPreferences)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#FFD84D]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Alert Preferences</h1>
          <p className="text-gray-400">Control exactly what you hear about and how. You can change these anytime during your rental.</p>
          {saved && (
            <div className="mt-2 flex items-center gap-2 text-green-500 text-sm">
              <Check className="h-4 w-4" />
              Saved automatically
            </div>
          )}
        </div>

        {/* Master Toggle */}
        <Card className="bg-[#1a1a1a] border-[#FFD84D] mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-lg font-semibold text-white">All Alerts</Label>
                <p className="text-sm text-gray-400 mt-1">Master control for all notifications</p>
              </div>
              <Switch
                checked={preferences.masterEnabled}
                onCheckedChange={handleMasterToggle}
                className="data-[state=checked]:bg-[#FFD84D]"
              />
            </div>
            {!preferences.masterEnabled && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Alerts are disabled. Life-safety alerts (tornado) will still be sent.
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-3">Individual controls below let you tune alerts without turning everything off</p>
          </CardContent>
        </Card>

        {/* Weather Alerts */}
        <Card className="bg-[#1a1a1a] border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CloudLightning className="h-5 w-5 text-[#FFD84D]" />
              Weather Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'winterStorm', icon: Snowflake, label: 'Winter Storm / Blizzard', desc: 'Snow, ice, and dangerous winter conditions' },
              { key: 'tornado', icon: Tornado, label: 'Tornado Warning', desc: 'Immediate tornado threat', locked: true },
              { key: 'flashFlood', icon: Waves, label: 'Flash Flood Warning', desc: 'Rapidly rising water on roadways' },
              { key: 'severeThunderstorm', icon: CloudLightning, label: 'Severe Thunderstorm', desc: 'Lightning, large hail, damaging winds' },
              { key: 'highWind', icon: Wind, label: 'High Wind Advisory', desc: 'Dangerous wind speeds affecting driving' },
              { key: 'denseFog', icon: CloudFog, label: 'Dense Fog Advisory', desc: 'Visibility below 1/4 mile' },
              { key: 'rain', icon: CloudRain, label: 'Rain / Winter Mix', desc: 'General precipitation alerts' },
              { key: 'extremeHeat', icon: Thermometer, label: 'Extreme Heat', desc: 'Heat index above 105°F' },
            ].map(({ key, icon: Icon, label, desc, locked }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <Label className="text-white">{label}</Label>
                      {locked && <Lock className="h-3 w-3 text-gray-500" />}
                    </div>
                    <p className="text-xs text-gray-500">{desc}</p>
                    {locked && <p className="text-xs text-[#FFD84D] mt-1">Life-safety alert — cannot be disabled</p>}
                  </div>
                </div>
                <Switch
                  checked={preferences.weather[key as keyof AlertPreferences['weather']]}
                  onCheckedChange={(v) => updateWeather(key as keyof AlertPreferences['weather'], v)}
                  disabled={locked}
                  className="data-[state=checked]:bg-[#FFD84D]"
                />
              </div>
            ))}
            <p className="text-xs text-gray-500 pt-2">Powered by NOAA National Weather Service — official US government data</p>
          </CardContent>
        </Card>

        {/* Traffic Alerts */}
        <Card className="bg-[#1a1a1a] border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrafficCone className="h-5 w-5 text-[#FFD84D]" />
              Traffic Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'accidents', icon: Car, label: 'Accidents', desc: 'Collisions reported ahead on your route' },
              { key: 'roadClosures', icon: Construction, label: 'Road Closures', desc: 'Full road closures and detours' },
              { key: 'construction', icon: Construction, label: 'Construction Zones', desc: 'Active work zones causing slowdowns' },
              { key: 'trafficJams', icon: TrafficCone, label: 'Traffic Jams', desc: 'Significant congestion causing major delays' },
              { key: 'laneClosures', icon: TrafficCone, label: 'Lane Closures', desc: 'Partial lane restrictions' },
              { key: 'emergencyVehicles', icon: Siren, label: 'Emergency Vehicles', desc: 'Active emergency response on road' },
              { key: 'brokenDownVehicles', icon: Fuel, label: 'Broken Down Vehicles', desc: 'Stalled vehicles in travel lanes' },
            ].map(({ key, icon: Icon, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <Label className="text-white">{label}</Label>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.traffic[key as keyof AlertPreferences['traffic']]}
                  onCheckedChange={(v) => updateTraffic(key as keyof AlertPreferences['traffic'], v)}
                  className="data-[state=checked]:bg-[#FFD84D]"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alert Threshold */}
        <Card className="bg-[#1a1a1a] border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Alert Sensitivity</CardTitle>
            <CardDescription>How sensitive should traffic alerts be?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {[
                { value: 'major', label: 'Major Only', color: 'bg-green-500' },
                { value: 'balanced', label: 'Balanced', color: 'bg-yellow-500' },
                { value: 'everything', label: 'Everything', color: 'bg-red-500' },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => savePreferences({ ...preferences, threshold: value as AlertPreferences['threshold'] })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    preferences.threshold === value
                      ? 'bg-[#FFD84D] text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full ${color} mr-2`} />
                  {label}
                </button>
              ))}
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Minimum delay to alert me:</Label>
              <Select
                value={String(preferences.minimumDelayMinutes)}
                onValueChange={(v) => savePreferences({ ...preferences, minimumDelayMinutes: Number(v) })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {[2, 5, 10, 15, 20].map((min) => (
                    <SelectItem key={min} value={String(min)} className="text-white">{min} minutes</SelectItem>
                  ))}
                  <SelectItem value="0" className="text-white">Don&apos;t filter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Method */}
        <Card className="bg-[#1a1a1a] border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#FFD84D]" />
              Notification Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-400 text-sm">Weather Alerts</Label>
              <Select
                value={preferences.notificationMethod.weather}
                onValueChange={(v) => savePreferences({
                  ...preferences,
                  notificationMethod: { ...preferences.notificationMethod, weather: v as AlertPreferences['notificationMethod']['weather'] }
                })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="push+app" className="text-white">Push + In-app banner</SelectItem>
                  <SelectItem value="sms" className="text-white">SMS only (Extreme/Severe)</SelectItem>
                  <SelectItem value="app-only" className="text-white">In-app only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Traffic Alerts</Label>
              <Select
                value={preferences.notificationMethod.traffic}
                onValueChange={(v) => savePreferences({
                  ...preferences,
                  notificationMethod: { ...preferences.notificationMethod, traffic: v as AlertPreferences['notificationMethod']['traffic'] }
                })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="push" className="text-white">Push notification</SelectItem>
                  <SelectItem value="app-only" className="text-white">In-app only</SelectItem>
                  <SelectItem value="off" className="text-white">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card className="bg-[#1a1a1a] border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Moon className="h-5 w-5 text-[#FFD84D]" />
              Quiet Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white">Enable Quiet Hours</Label>
              <Switch
                checked={preferences.quietHours.enabled}
                onCheckedChange={(v) => savePreferences({
                  ...preferences,
                  quietHours: { ...preferences.quietHours, enabled: v }
                })}
                className="data-[state=checked]:bg-[#FFD84D]"
              />
            </div>
            {preferences.quietHours.enabled && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label className="text-gray-400 text-sm">Start</Label>
                  <input
                    type="time"
                    value={preferences.quietHours.startTime}
                    onChange={(e) => savePreferences({
                      ...preferences,
                      quietHours: { ...preferences.quietHours, startTime: e.target.value }
                    })}
                    className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-gray-400 text-sm">End</Label>
                  <input
                    type="time"
                    value={preferences.quietHours.endTime}
                    onChange={(e) => savePreferences({
                      ...preferences,
                      quietHours: { ...preferences.quietHours, endTime: e.target.value }
                    })}
                    className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-[#FFD84D]">Life-safety alerts (tornado, flash flood) always override quiet hours</p>
          </CardContent>
        </Card>

        {/* Alert Radius */}
        <Card className="bg-[#1a1a1a] border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#FFD84D]" />
              Alert Radius
            </CardTitle>
            <CardDescription>How far ahead should we watch for incidents?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-400 text-sm">Weather Alerts</Label>
              <Select
                value={String(preferences.radius.weatherMiles)}
                onValueChange={(v) => savePreferences({
                  ...preferences,
                  radius: { ...preferences.radius, weatherMiles: Number(v) }
                })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {[5, 10, 25, 50].map((miles) => (
                    <SelectItem key={miles} value={String(miles)} className="text-white">{miles} miles</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Traffic Alerts</Label>
              <Select
                value={String(preferences.radius.trafficMiles)}
                onValueChange={(v) => savePreferences({
                  ...preferences,
                  radius: { ...preferences.radius, trafficMiles: Number(v) }
                })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {[0.5, 1, 3, 5].map((miles) => (
                    <SelectItem key={miles} value={String(miles)} className="text-white">{miles} miles</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Repeat / Snooze */}
        <Card className="bg-[#1a1a1a] border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Repeat &amp; Snooze</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-400 text-sm">Don&apos;t repeat the same alert more than:</Label>
              <Select
                value={String(preferences.repeatInterval)}
                onValueChange={(v) => savePreferences({ ...preferences, repeatInterval: Number(v) })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {[5, 10, 30, 60].map((min) => (
                    <SelectItem key={min} value={String(min)} className="text-white">Every {min} min</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sticky Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-gray-800 p-4">
          <div className="container mx-auto max-w-2xl flex gap-3">
            <Button
              variant="ghost"
              onClick={resetToDefaults}
              className="flex-1 text-gray-400 hover:text-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button
              onClick={() => savePreferences(preferences)}
              className="flex-1 bg-[#FFD84D] text-black hover:bg-[#FFD84D]/90 font-semibold"
            >
              {saved ? <><Check className="h-4 w-4 mr-2" /> Saved</> : 'Save Preferences'}
            </Button>
          </div>
        </div>

        {/* Master Off Confirmation Dialog */}
        <Dialog open={showMasterOffDialog} onOpenChange={setShowMasterOffDialog}>
          <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white" title="Disable All Alerts?">
            <DialogHeader>
              <DialogTitle className="text-white">Disable All Alerts?</DialogTitle>
              <DialogDescription className="text-gray-400">
                Turning off all alerts means you won&apos;t receive safety warnings including tornadoes, flash floods, or major accidents ahead.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">
                <strong>Exception:</strong> Tornado warnings will still be sent as a life-safety measure.
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowMasterOffDialog(false)} className="text-gray-400">
                Cancel
              </Button>
              <Button onClick={confirmMasterOff} className="bg-red-500 hover:bg-red-600 text-white">
                Yes, Disable Alerts
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
