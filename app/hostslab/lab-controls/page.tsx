'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Settings,
  User,
  Bell,
  Bot,
  Radar,
  CreditCard,
  Lock,
  Palette,
  RefreshCw,
  Save,
  MessageSquare,
  DollarSign,
  Shield,
  Activity,
  Gamepad2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

interface AgentSettings {
  name: string
  displayName: string
  customName: string
  icon: React.ReactNode
  defaultName: string
}

interface NotificationSettings {
  email_booking_confirmation: boolean
  email_trip_reminders: boolean
  email_review_alerts: boolean
  email_weekly_report: boolean
  sms_booking_alerts: boolean
  sms_trip_start: boolean
  sms_eagle_alerts: boolean
  sms_urgent_only: boolean
  push_all: boolean
}

interface EagleDevice {
  id: string
  imei: string
  vehicle_name: string
  status: 'connected' | 'disconnected' | 'pending'
  last_seen: string
}

const DEFAULT_AGENTS: AgentSettings[] = [
  { name: 'securelink', displayName: 'SecureLink', customName: '', icon: <MessageSquare className="h-5 w-5" />, defaultName: 'SecureLink' },
  { name: 'dollar', displayName: 'Dollar', customName: '', icon: <DollarSign className="h-5 w-5" />, defaultName: 'Dollar' },
  { name: 'shield', displayName: 'Shield', customName: '', icon: <Shield className="h-5 w-5" />, defaultName: 'Shield' },
  { name: 'commandcontrol', displayName: 'Command&Control', customName: '', icon: <Radar className="h-5 w-5" />, defaultName: 'Command&Control' },
  { name: 'pulse', displayName: 'Pulse', customName: '', icon: <Activity className="h-5 w-5" />, defaultName: 'Pulse' },
  { name: 'funtime', displayName: 'Funtime', customName: '', icon: <Gamepad2 className="h-5 w-5" />, defaultName: 'Funtime' },
]

export default function LabControlsPage() {
  const [agents, setAgents] = useState<AgentSettings[]>(DEFAULT_AGENTS)
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_booking_confirmation: true,
    email_trip_reminders: true,
    email_review_alerts: true,
    email_weekly_report: true,
    sms_booking_alerts: true,
    sms_trip_start: false,
    sms_eagle_alerts: true,
    sms_urgent_only: false,
    push_all: true,
  })
  const [devices, setDevices] = useState<EagleDevice[]>([])
  const [theme, setTheme] = useState('system')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/hostslab/settings/agents').then(r => r.json()),
      fetch('/api/hostslab/settings/notifications').then(r => r.json()),
      fetch('/api/hostslab/settings/devices').then(r => r.json()),
    ])
      .then(([agentsData, notifData, devicesData]) => {
        if (agentsData.agents) {
          setAgents(DEFAULT_AGENTS.map(a => ({
            ...a,
            customName: agentsData.agents[a.name] || '',
          })))
        }
        if (notifData.settings) setNotifications(notifData.settings)
        if (devicesData.devices) setDevices(devicesData.devices)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const saveAgentName = async (agentName: string, customName: string) => {
    setSaving(agentName)
    try {
      await fetch('/api/hostslab/settings/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentName, customName }),
      })
      setAgents(prev => prev.map(a => 
        a.name === agentName ? { ...a, customName } : a
      ))
    } catch (err) {
      console.error('Failed to save agent name:', err)
    } finally {
      setSaving(null)
    }
  }

  const resetAgentName = (agentName: string) => {
    saveAgentName(agentName, '')
    setAgents(prev => prev.map(a => 
      a.name === agentName ? { ...a, customName: '' } : a
    ))
  }

  const saveNotifications = async () => {
    setSaving('notifications')
    try {
      await fetch('/api/hostslab/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications),
      })
    } catch (err) {
      console.error('Failed to save notifications:', err)
    } finally {
      setSaving(null)
    }
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Mock devices
  const displayDevices = devices.length > 0 ? devices : [
    { id: '1', imei: 'A1B2C3D4E5F6', vehicle_name: '2023 Subaru Outback', status: 'connected' as const, last_seen: new Date().toISOString() },
    { id: '2', imei: 'G7H8I9J0K1L2', vehicle_name: '2022 Toyota Tacoma', status: 'connected' as const, last_seen: new Date(Date.now() - 3600000).toISOString() },
    { id: '3', imei: 'M3N4O5P6Q7R8', vehicle_name: '2024 Tesla Model Y', status: 'pending' as const, last_seen: '' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#CC0000] rounded-lg">
          <Settings className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Lab Controls</h1>
          <p className="text-muted-foreground">Customize your HostsLab experience</p>
        </div>
      </div>

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents">
            <Bot className="h-4 w-4 mr-2" />
            R&D Agents
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="eagle">
            <Radar className="h-4 w-4 mr-2" />
            Eagle Devices
          </TabsTrigger>
          <TabsTrigger value="payout">
            <CreditCard className="h-4 w-4 mr-2" />
            Payout
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Lock className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="theme">
            <Palette className="h-4 w-4 mr-2" />
            Theme
          </TabsTrigger>
        </TabsList>

        {/* Agent Names */}
        <TabsContent value="agents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>R&D Agent Names</CardTitle>
              <CardDescription>
                Personalize your AI agents with custom names. Available at Lab Level 5+.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {agents.map((agent) => (
                <div 
                  key={agent.name}
                  className="flex items-center gap-4 p-4 rounded-lg border"
                >
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    {agent.icon}
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={`agent-${agent.name}`} className="text-sm font-medium">
                      {agent.defaultName}
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id={`agent-${agent.name}`}
                        placeholder={agent.defaultName}
                        value={agent.customName}
                        onChange={(e) => setAgents(prev => prev.map(a => 
                          a.name === agent.name ? { ...a, customName: e.target.value } : a
                        ))}
                        className="max-w-xs"
                      />
                      <Button
                        size="sm"
                        disabled={saving === agent.name}
                        onClick={() => saveAgentName(agent.name, agent.customName)}
                      >
                        {saving === agent.name ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                      {agent.customName && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resetAgentName(agent.name)}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                  {agent.customName && (
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Customized
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control how and when you receive updates from HostsLab.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div>
                <h3 className="font-medium mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  {[
                    { key: 'email_booking_confirmation', label: 'Booking confirmations', desc: 'When a new booking is made' },
                    { key: 'email_trip_reminders', label: 'Trip reminders', desc: 'Upcoming trip notifications' },
                    { key: 'email_review_alerts', label: 'Review alerts', desc: 'When you receive a new review' },
                    { key: 'email_weekly_report', label: 'Weekly report', desc: 'Weekly earnings and performance summary' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => setNotifications(prev => ({
                          ...prev,
                          [item.key]: checked,
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* SMS Notifications */}
              <div className="pt-6 border-t">
                <h3 className="font-medium mb-4">SMS Notifications</h3>
                <div className="space-y-4">
                  {[
                    { key: 'sms_booking_alerts', label: 'Booking alerts', desc: 'SMS for new bookings' },
                    { key: 'sms_trip_start', label: 'Trip start notifications', desc: 'When a renter picks up vehicle' },
                    { key: 'sms_eagle_alerts', label: 'Eagle alerts', desc: 'Critical fleet alerts (speeding, geofence)' },
                    { key: 'sms_urgent_only', label: 'Urgent only mode', desc: 'Only receive critical/emergency SMS' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => setNotifications(prev => ({
                          ...prev,
                          [item.key]: checked,
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t">
                <Button onClick={saveNotifications} disabled={saving === 'notifications'}>
                  {saving === 'notifications' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Eagle Devices */}
        <TabsContent value="eagle" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Eagle Device Management</CardTitle>
                  <CardDescription>
                    Manage your Bouncie GPS tracking devices.
                  </CardDescription>
                </div>
                <Button>
                  <Radar className="h-4 w-4 mr-2" />
                  Add Device
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {displayDevices.map((device) => (
                  <div 
                    key={device.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        device.status === 'connected' ? 'bg-green-100 dark:bg-green-900/30' :
                        device.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30' :
                        'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        <Radar className={`h-5 w-5 ${
                          device.status === 'connected' ? 'text-green-600' :
                          device.status === 'pending' ? 'text-amber-600' :
                          'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{device.vehicle_name}</p>
                        <p className="text-sm text-muted-foreground font-mono">IMEI: {device.imei}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className={
                          device.status === 'connected' ? 'bg-green-500' :
                          device.status === 'pending' ? 'bg-amber-500' :
                          'bg-red-500'
                        }>
                          {device.status}
                        </Badge>
                        {device.last_seen && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last seen: {formatTime(device.last_seen)}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payout Settings */}
        <TabsContent value="payout" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout Settings</CardTitle>
              <CardDescription>
                Manage your Stripe payout preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Stripe Connected</p>
                    <p className="text-sm text-muted-foreground">
                      Your payouts are automatically deposited to your bank account.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Payout Schedule</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger className="w-full max-w-xs mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Minimum Payout</Label>
                  <Select defaultValue="100">
                    <SelectTrigger className="w-full max-w-xs mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No minimum</SelectItem>
                      <SelectItem value="50">$50</SelectItem>
                      <SelectItem value="100">$100</SelectItem>
                      <SelectItem value="250">$250</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Manage in Stripe Dashboard
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy */}
        <TabsContent value="privacy" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Controls</CardTitle>
              <CardDescription>
                Manage your data and privacy settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: 'show_leaderboard', label: 'Show on leaderboard', desc: 'Display your profile on the Break Room leaderboard' },
                { key: 'allow_spotlight', label: 'Allow Host Spotlight', desc: 'Be featured as Host of the Week' },
                { key: 'share_stats', label: 'Share anonymous stats', desc: 'Help improve HostsLab with anonymous usage data' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}

              <div className="pt-6 border-t">
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Request Data Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme */}
        <TabsContent value="theme" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Lab Theme</CardTitle>
              <CardDescription>
                Customize the appearance of your HostsLab dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'light', name: 'Light', preview: 'bg-white border' },
                  { id: 'dark', name: 'Dark', preview: 'bg-slate-900 border-slate-700' },
                  { id: 'system', name: 'System', preview: 'bg-gradient-to-r from-white to-slate-900' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setTheme(option.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      theme === option.id ? 'border-[#CC0000]' : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <div className={`h-20 rounded-lg mb-2 ${option.preview}`} />
                    <p className="font-medium">{option.name}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
