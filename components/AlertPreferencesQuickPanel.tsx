'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { X, Settings, Bell, BellOff, Snowflake, Tornado, Waves, CloudLightning, Car, Construction, TrafficCone, Lock } from 'lucide-react'
import Link from 'next/link'

interface QuickPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AlertPreferencesQuickPanel({ isOpen, onClose }: QuickPanelProps) {
  const [preferences, setPreferences] = useState({
    masterEnabled: true,
    weather: {
      winterStorm: true,
      tornado: true,
      flashFlood: true,
      severeThunderstorm: true
    },
    traffic: {
      accidents: true,
      roadClosures: true,
      construction: true,
      trafficJams: true
    }
  })

  useEffect(() => {
    if (isOpen) {
      fetchPreferences()
    }
  }, [isOpen])

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/renter/alert-preferences')
      if (res.ok) {
        const data = await res.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
    }
  }

  const savePreferences = async (newPrefs: typeof preferences) => {
    newPrefs.weather.tornado = true // Always true
    setPreferences(newPrefs)
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

  const snoozeAll = async () => {
    const snoozeUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    try {
      await fetch('/api/renter/alert-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...preferences, snoozeUntil })
      })
      onClose()
    } catch (error) {
      console.error('Failed to snooze:', error)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-80 bg-[#0a0a0a] border-l border-gray-800 z-50 overflow-y-auto animate-in slide-in-from-right">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Quick Settings</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Master Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#FFD84D] mb-6">
            <div className="flex items-center gap-2">
              {preferences.masterEnabled ? (
                <Bell className="h-5 w-5 text-[#FFD84D]" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-500" />
              )}
              <Label className="text-white font-medium">All Alerts</Label>
            </div>
            <Switch
              checked={preferences.masterEnabled}
              onCheckedChange={(v) => savePreferences({ ...preferences, masterEnabled: v })}
              className="data-[state=checked]:bg-[#FFD84D]"
            />
          </div>

          {/* Weather Toggles */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Weather</h3>
            <div className="space-y-3">
              {[
                { key: 'winterStorm', icon: Snowflake, label: 'Winter Storm' },
                { key: 'tornado', icon: Tornado, label: 'Tornado', locked: true },
                { key: 'flashFlood', icon: Waves, label: 'Flash Flood' },
                { key: 'severeThunderstorm', icon: CloudLightning, label: 'Severe Storm' },
              ].map(({ key, icon: Icon, label, locked }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-white">{label}</span>
                    {locked && <Lock className="h-3 w-3 text-gray-600" />}
                  </div>
                  <Switch
                    checked={preferences.weather[key as keyof typeof preferences.weather]}
                    onCheckedChange={(v) => savePreferences({
                      ...preferences,
                      weather: { ...preferences.weather, [key]: v }
                    })}
                    disabled={locked}
                    className="data-[state=checked]:bg-[#FFD84D] scale-90"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Toggles */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Traffic</h3>
            <div className="space-y-3">
              {[
                { key: 'accidents', icon: Car, label: 'Accidents' },
                { key: 'roadClosures', icon: Construction, label: 'Road Closures' },
                { key: 'construction', icon: Construction, label: 'Construction' },
                { key: 'trafficJams', icon: TrafficCone, label: 'Traffic Jams' },
              ].map(({ key, icon: Icon, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-white">{label}</span>
                  </div>
                  <Switch
                    checked={preferences.traffic[key as keyof typeof preferences.traffic]}
                    onCheckedChange={(v) => savePreferences({
                      ...preferences,
                      traffic: { ...preferences.traffic, [key]: v }
                    })}
                    className="data-[state=checked]:bg-[#FFD84D] scale-90"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={snoozeAll}
              variant="outline"
              className="w-full border-gray-700 text-white hover:bg-gray-800"
            >
              Snooze all for 30 min
            </Button>
            <Link href="/renter/settings/alerts" className="block">
              <Button
                variant="ghost"
                className="w-full text-[#FFD84D] hover:text-[#FFD84D]/80 hover:bg-[#FFD84D]/10"
              >
                <Settings className="h-4 w-4 mr-2" />
                Full Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
