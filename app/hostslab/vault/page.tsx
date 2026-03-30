'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  Vault,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  CreditCard,
  Shield,
  Car,
  PieChart,
  BarChart3,
} from 'lucide-react'

interface EarningsSummary {
  thisMonth: number
  lastMonth: number
  changePercent: number
  projected30Days: number
}

interface VehicleRevenue {
  vehicle_id: string
  vehicle_name: string
  revenue: number
  trips: number
  avgPerTrip: number
}

interface PayoutHistory {
  id: string
  amount: number
  status: 'completed' | 'pending' | 'processing'
  payout_date: string
  stripe_id: string
}

interface InsuranceRevenue {
  total: number
  protection_fees: number
  claims_deducted: number
}

interface UpcomingPayout {
  amount: number
  expected_date: string
  bookings_count: number
}

export default function VaultPage() {
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null)
  const [vehicleRevenue, setVehicleRevenue] = useState<VehicleRevenue[]>([])
  const [payouts, setPayouts] = useState<PayoutHistory[]>([])
  const [insurance, setInsurance] = useState<InsuranceRevenue | null>(null)
  const [upcomingPayout, setUpcomingPayout] = useState<UpcomingPayout | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/hostslab/vault/earnings').then(r => r.json()),
      fetch('/api/hostslab/vault/vehicles').then(r => r.json()),
      fetch('/api/hostslab/vault/payouts').then(r => r.json()),
      fetch('/api/hostslab/vault/insurance').then(r => r.json()),
    ])
      .then(([earningsData, vehiclesData, payoutsData, insuranceData]) => {
        if (earningsData.summary) setEarnings(earningsData.summary)
        if (vehiclesData.vehicles) setVehicleRevenue(vehiclesData.vehicles)
        if (payoutsData.payouts) setPayouts(payoutsData.payouts)
        if (payoutsData.upcoming) setUpcomingPayout(payoutsData.upcoming)
        if (insuranceData) setInsurance(insuranceData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(cents / 100)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const downloadCSV = () => {
    // Generate CSV for tax purposes
    const headers = ['Date', 'Vehicle', 'Amount', 'Type']
    const rows = payouts.map(p => [
      formatDate(p.payout_date),
      'All Vehicles',
      (p.amount / 100).toFixed(2),
      'Payout',
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rent-and-drive-earnings-${new Date().getFullYear()}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Default mock data
  const displayEarnings = earnings || {
    thisMonth: 485000,
    lastMonth: 425000,
    changePercent: 14,
    projected30Days: 520000,
  }

  const displayVehicles = vehicleRevenue.length > 0 ? vehicleRevenue : [
    { vehicle_id: '1', vehicle_name: '2023 Subaru Outback', revenue: 185000, trips: 8, avgPerTrip: 23125 },
    { vehicle_id: '2', vehicle_name: '2022 Toyota Tacoma', revenue: 165000, trips: 6, avgPerTrip: 27500 },
    { vehicle_id: '3', vehicle_name: '2024 Tesla Model Y', revenue: 135000, trips: 5, avgPerTrip: 27000 },
  ]

  const displayPayouts = payouts.length > 0 ? payouts : [
    { id: '1', amount: 185000, status: 'completed' as const, payout_date: '2024-01-15', stripe_id: 'po_xxx1' },
    { id: '2', amount: 165000, status: 'completed' as const, payout_date: '2024-01-08', stripe_id: 'po_xxx2' },
    { id: '3', amount: 142500, status: 'completed' as const, payout_date: '2024-01-01', stripe_id: 'po_xxx3' },
    { id: '4', amount: 135000, status: 'pending' as const, payout_date: '2024-01-22', stripe_id: 'po_xxx4' },
  ]

  const displayInsurance = insurance || {
    total: 48500,
    protection_fees: 52000,
    claims_deducted: 3500,
  }

  const displayUpcoming = upcomingPayout || {
    amount: 135000,
    expected_date: '2024-01-22',
    bookings_count: 5,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#CC0000] rounded-lg">
            <Vault className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">The Vault</h1>
            <p className="text-muted-foreground">Earnings dashboard and financial overview</p>
          </div>
        </div>
        <Button variant="outline" onClick={downloadCSV}>
          <Download className="h-4 w-4 mr-2" />
          Tax Summary CSV
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">This Month</p>
                <p className="text-3xl font-bold">{formatCurrency(displayEarnings.thisMonth)}</p>
              </div>
              <DollarSign className="h-10 w-10 opacity-50" />
            </div>
            <div className="flex items-center gap-1 mt-2 text-green-100">
              {displayEarnings.changePercent > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4" />
                  <span>+{displayEarnings.changePercent}% vs last month</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4" />
                  <span>{displayEarnings.changePercent}% vs last month</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Calendar className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(displayEarnings.lastMonth)}</p>
                <p className="text-sm text-muted-foreground">Last Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(displayEarnings.projected30Days)}</p>
                <p className="text-sm text-muted-foreground">Projected (30 Days)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Next Payout</p>
                <p className="text-2xl font-bold">{formatCurrency(displayUpcoming.amount)}</p>
                <p className="text-xs text-amber-100 mt-1">
                  {formatDate(displayUpcoming.expected_date)} ({displayUpcoming.bookings_count} bookings)
                </p>
              </div>
              <CreditCard className="h-10 w-10 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by Vehicle */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-[#CC0000]" />
              <CardTitle>Revenue by Vehicle</CardTitle>
            </div>
            <CardDescription>This month&apos;s earnings breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayVehicles.map((vehicle) => {
                const totalRevenue = displayVehicles.reduce((sum, v) => sum + v.revenue, 0)
                const percentage = Math.round((vehicle.revenue / totalRevenue) * 100)
                
                return (
                  <div key={vehicle.vehicle_id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{vehicle.vehicle_name}</span>
                      <span className="font-bold">{formatCurrency(vehicle.revenue)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#CC0000] rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12">{percentage}%</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{vehicle.trips} trips</span>
                      <span>|</span>
                      <span>{formatCurrency(vehicle.avgPerTrip)} avg/trip</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Insurance Revenue */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#CC0000]" />
              <CardTitle>Insurance Revenue</CardTitle>
            </div>
            <CardDescription>Protection fees and claims</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-green-600">
                  {formatCurrency(displayInsurance.total)}
                </p>
                <p className="text-muted-foreground">Net Insurance Revenue</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-sm text-muted-foreground mb-1">Protection Fees</p>
                  <p className="text-xl font-bold text-green-600">
                    +{formatCurrency(displayInsurance.protection_fees)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-sm text-muted-foreground mb-1">Claims Deducted</p>
                  <p className="text-xl font-bold text-red-600">
                    -{formatCurrency(displayInsurance.claims_deducted)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#CC0000]" />
            <CardTitle>Stripe Payout Schedule</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Stripe ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayPayouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>{formatDate(payout.payout_date)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(payout.amount)}</TableCell>
                  <TableCell>
                    <Badge className={
                      payout.status === 'completed' ? 'bg-green-500' :
                      payout.status === 'pending' ? 'bg-amber-500' : 'bg-blue-500'
                    }>
                      {payout.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {payout.stripe_id}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
