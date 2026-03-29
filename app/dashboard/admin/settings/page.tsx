'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  DollarSign, 
  Calendar,
  Shield,
  AlertTriangle,
  Save,
  Bitcoin,
  Bike,
  Truck,
  RefreshCw
} from 'lucide-react'

interface PlatformSettings {
  platform_fee_percent: number
  security_deposit_default: number
  min_trip_duration_days: number
  max_advance_booking_days: number
  maintenance_mode: boolean
  feature_crypto_payments: boolean
  feature_motorcycles: boolean
  feature_rvs: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    platform_fee_percent: 10,
    security_deposit_default: 500,
    min_trip_duration_days: 1,
    max_advance_booking_days: 90,
    maintenance_mode: false,
    feature_crypto_payments: false,
    feature_motorcycles: false,
    feature_rvs: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
    setLoading(false)
  }

  async function saveSettings() {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
    setSaving(false)
  }

  const updateSetting = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
          <p className="text-muted-foreground">Configure platform-wide settings and feature flags</p>
        </div>
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="bg-[#CC0000] hover:bg-[#CC0000]/90"
        >
          {saving ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Pricing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#CC0000]" />
            Pricing & Fees
          </CardTitle>
          <CardDescription>Configure platform fees and default pricing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="platform_fee">Platform Fee Percentage</Label>
              <div className="relative">
                <Input
                  id="platform_fee"
                  type="number"
                  value={settings.platform_fee_percent}
                  onChange={(e) => updateSetting('platform_fee_percent', parseFloat(e.target.value) || 0)}
                  className="pr-8"
                  min={0}
                  max={50}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Fee taken from each booking. Current: {settings.platform_fee_percent}%
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="security_deposit">Default Security Deposit</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="security_deposit"
                  type="number"
                  value={settings.security_deposit_default}
                  onChange={(e) => updateSetting('security_deposit_default', parseFloat(e.target.value) || 0)}
                  className="pl-10"
                  min={0}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Default hold amount for damage protection
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#CC0000]" />
            Booking Rules
          </CardTitle>
          <CardDescription>Set booking duration and advance window limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="min_trip">Minimum Trip Duration</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="min_trip"
                  type="number"
                  value={settings.min_trip_duration_days}
                  onChange={(e) => updateSetting('min_trip_duration_days', parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum rental period allowed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_advance">Maximum Advance Booking</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="max_advance"
                  type="number"
                  value={settings.max_advance_booking_days}
                  onChange={(e) => updateSetting('max_advance_booking_days', parseInt(e.target.value) || 30)}
                  min={7}
                  max={365}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
              <p className="text-xs text-muted-foreground">
                How far in advance users can book
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card className={settings.maintenance_mode ? 'border-amber-500 bg-amber-50' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${settings.maintenance_mode ? 'text-amber-500' : 'text-muted-foreground'}`} />
            Maintenance Mode
          </CardTitle>
          <CardDescription>
            Temporarily disable bookings while performing maintenance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">
                When enabled, new bookings are blocked and users see a maintenance message
              </p>
            </div>
            <Switch
              checked={settings.maintenance_mode}
              onCheckedChange={(checked) => updateSetting('maintenance_mode', checked)}
            />
          </div>
          {settings.maintenance_mode && (
            <Badge className="mt-4 bg-amber-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Maintenance Mode Active
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#CC0000]" />
            Feature Flags
          </CardTitle>
          <CardDescription>Enable or disable platform features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Bitcoin className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Cryptocurrency Payments</p>
                <p className="text-sm text-muted-foreground">Accept BTC, ETH, and USDC for bookings</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-amber-600 border-amber-600">Beta</Badge>
              <Switch
                checked={settings.feature_crypto_payments}
                onCheckedChange={(checked) => updateSetting('feature_crypto_payments', checked)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bike className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Motorcycle Listings</p>
                <p className="text-sm text-muted-foreground">Allow hosts to list motorcycles</p>
              </div>
            </div>
            <Switch
              checked={settings.feature_motorcycles}
              onCheckedChange={(checked) => updateSetting('feature_motorcycles', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">RV/Camper Listings</p>
                <p className="text-sm text-muted-foreground">Allow hosts to list RVs and campers</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600">Active</Badge>
              <Switch
                checked={settings.feature_rvs}
                onCheckedChange={(checked) => updateSetting('feature_rvs', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <p className="font-medium">Clear All Test Data</p>
              <p className="text-sm text-muted-foreground">
                Remove all bookings, vehicles, and users marked as test
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Clear Test Data
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <p className="font-medium">Export All Data</p>
              <p className="text-sm text-muted-foreground">
                Download complete platform data for backup
              </p>
            </div>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
