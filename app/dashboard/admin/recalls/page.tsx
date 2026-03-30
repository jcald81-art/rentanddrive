'use client'

import { useState, useEffect } from 'react'
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  RefreshCw, 
  Search,
  ExternalLink,
  Car,
  Ban,
  CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface VehicleWithRecalls {
  id: string
  make: string
  model: string
  year: number
  vin: string
  is_approved: boolean
  host_id: string
  host_name: string
  last_recall_check: string
  recall_severity: 'CRITICAL' | 'WARNING' | 'INFO' | null
  recalls: Array<{
    id: string
    nhtsa_campaign_id: string
    component: string
    summary: string
    consequence: string
    remedy: string
    severity: string
    is_open: boolean
    recall_date: string
  }>
}

export default function AdminRecallsPage() {
  const [vehicles, setVehicles] = useState<VehicleWithRecalls[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('critical')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithRecalls | null>(null)

  useEffect(() => {
    fetchVehiclesWithRecalls()
  }, [])

  async function fetchVehiclesWithRecalls() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/recalls')
      if (res.ok) {
        const data = await res.json()
        setVehicles(data.vehicles || [])
      }
    } catch (error) {
      console.error('[AdminRecalls] Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function runRecallCheck(vehicleId: string, vin: string) {
    setIsRefreshing(true)
    try {
      await fetch(`/api/nhtsa/recalls/${vin}`)
      await fetchVehiclesWithRecalls()
    } catch (error) {
      console.error('[AdminRecalls] Error refreshing:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  async function forceVehicleOffline(vehicleId: string) {
    try {
      await fetch(`/api/admin/vehicles/${vehicleId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          is_approved: false,
          reason: 'Forced offline due to open safety recall'
        })
      })
      await fetchVehiclesWithRecalls()
    } catch (error) {
      console.error('[AdminRecalls] Error forcing offline:', error)
    }
  }

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = searchQuery === '' || 
      v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.host_name?.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === 'critical') return matchesSearch && v.recall_severity === 'CRITICAL'
    if (activeTab === 'warning') return matchesSearch && v.recall_severity === 'WARNING'
    if (activeTab === 'info') return matchesSearch && v.recall_severity === 'INFO'
    return matchesSearch && v.recalls?.length > 0
  })

  const criticalCount = vehicles.filter(v => v.recall_severity === 'CRITICAL').length
  const warningCount = vehicles.filter(v => v.recall_severity === 'WARNING').length
  const infoCount = vehicles.filter(v => v.recall_severity === 'INFO').length

  const severityBadge = (severity: string | null) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Critical</Badge>
      case 'WARNING':
        return <Badge className="bg-yellow-100 text-yellow-800 gap-1"><AlertTriangle className="h-3 w-3" />Warning</Badge>
      case 'INFO':
        return <Badge variant="secondary" className="gap-1"><Info className="h-3 w-3" />Info</Badge>
      default:
        return <Badge variant="outline">None</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recall Management</h1>
          <p className="text-muted-foreground">Monitor and manage vehicle safety recalls</p>
        </div>
        <Button variant="outline" onClick={fetchVehiclesWithRecalls} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Refresh All
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Recalls</p>
                <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warning Recalls</p>
                <p className="text-3xl font-bold text-yellow-600">{warningCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Info Notices</p>
                <p className="text-3xl font-bold text-blue-600">{infoCount}</p>
              </div>
              <Info className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vehicles Monitored</p>
                <p className="text-3xl font-bold">{vehicles.length}</p>
              </div>
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by make, model, VIN, or host..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs and Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="critical" className="gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Critical ({criticalCount})
          </TabsTrigger>
          <TabsTrigger value="warning" className="gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Warning ({warningCount})
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            Info ({infoCount})
          </TabsTrigger>
          <TabsTrigger value="all">All Recalls</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Recalls</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Check</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{vehicle.vin}</TableCell>
                    <TableCell>{vehicle.host_name}</TableCell>
                    <TableCell>{severityBadge(vehicle.recall_severity)}</TableCell>
                    <TableCell>{vehicle.recalls?.length || 0}</TableCell>
                    <TableCell>
                      {vehicle.is_approved ? (
                        <Badge variant="outline" className="text-green-600">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Offline</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {vehicle.last_recall_check 
                        ? new Date(vehicle.last_recall_check).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedVehicle(vehicle)}
                            >
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </DialogTitle>
                              <DialogDescription>
                                VIN: {vehicle.vin}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              {vehicle.recalls?.map((recall, idx) => (
                                <div 
                                  key={idx}
                                  className={cn(
                                    'p-4 rounded-lg border',
                                    recall.severity === 'CRITICAL' && 'bg-red-50 border-red-200',
                                    recall.severity === 'WARNING' && 'bg-yellow-50 border-yellow-200',
                                    recall.severity === 'INFO' && 'bg-blue-50 border-blue-200'
                                  )}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <span className="font-medium">{recall.component}</span>
                                    {severityBadge(recall.severity)}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">{recall.summary}</p>
                                  {recall.consequence && (
                                    <p className="text-sm"><strong>Risk:</strong> {recall.consequence}</p>
                                  )}
                                  {recall.remedy && (
                                    <p className="text-sm"><strong>Fix:</strong> {recall.remedy}</p>
                                  )}
                                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>Date: {recall.recall_date}</span>
                                    <a 
                                      href={`https://www.nhtsa.gov/recalls?nhtsaId=${recall.nhtsa_campaign_id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-primary hover:underline"
                                    >
                                      NHTSA: {recall.nhtsa_campaign_id}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runRecallCheck(vehicle.id, vehicle.vin)}
                          disabled={isRefreshing}
                        >
                          <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
                        </Button>
                        {vehicle.is_approved && vehicle.recall_severity === 'CRITICAL' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => forceVehicleOffline(vehicle.id)}
                          >
                            <Ban className="h-3 w-3 mr-1" />
                            Force Offline
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredVehicles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {isLoading ? 'Loading...' : 'No vehicles with recalls found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
