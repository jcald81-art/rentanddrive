'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Download,
  CreditCard,
  Wallet,
  Bot,
  Car,
  Receipt
} from 'lucide-react'

interface FinancialData {
  booking_revenue: number
  platform_fees: number
  vin_check_sales: number
  agent_costs: number
  net_profit: number
  revenue_per_vehicle: number
  cost_per_booking: number
  stripe_balance: number
  pending_payouts: number
  monthly_breakdown: Array<{
    month: string
    booking_revenue: number
    platform_fees: number
    vin_checks: number
    agent_costs: number
    net: number
  }>
  top_vehicles: Array<{
    id: string
    name: string
    revenue: number
    bookings: number
  }>
}

export default function FinancialsPage() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('this_month')

  useEffect(() => {
    fetchFinancials()
  }, [period])

  async function fetchFinancials() {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/financials?period=${period}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch financials:', error)
    }
    setLoading(false)
  }

  async function exportCSV() {
    try {
      const response = await fetch(`/api/admin/financials/export?period=${period}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `rent-and-drive-financials-${period}.csv`
        a.click()
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-muted rounded mb-6" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
          <p className="text-muted-foreground">Revenue breakdown and platform economics</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Booking Revenue</CardTitle>
            <Receipt className="h-4 w-4 text-[#CC0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data?.booking_revenue || 0)}</div>
            <p className="text-xs text-muted-foreground">Total booking value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees (10%)</CardTitle>
            <DollarSign className="h-4 w-4 text-[#CC0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data?.platform_fees || 0)}</div>
            <p className="text-xs text-muted-foreground">Your commission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIN Check Sales</CardTitle>
            <CreditCard className="h-4 w-4 text-[#CC0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data?.vin_check_sales || 0)}</div>
            <p className="text-xs text-muted-foreground">$4.99 per report</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Agent Costs</CardTitle>
            <Bot className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">-{formatCurrency(data?.agent_costs || 0)}</div>
            <p className="text-xs text-muted-foreground">Claude, GPT, Gemini</p>
          </CardContent>
        </Card>
      </div>

      {/* Net Profit and Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-[#CC0000]/10 to-[#CC0000]/5 border-[#CC0000]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#CC0000]">{formatCurrency(data?.net_profit || 0)}</div>
            <p className="text-xs text-muted-foreground">After all costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue per Vehicle</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data?.revenue_per_vehicle || 0)}</div>
            <p className="text-xs text-muted-foreground">Average per vehicle</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Booking</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data?.cost_per_booking || 0)}</div>
            <p className="text-xs text-muted-foreground">Agent + processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stripe Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data?.stripe_balance || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Pending: {formatCurrency(data?.pending_payouts || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>Revenue and costs by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Month</th>
                  <th className="text-right py-3 px-4 font-medium">Booking Revenue</th>
                  <th className="text-right py-3 px-4 font-medium">Platform Fees</th>
                  <th className="text-right py-3 px-4 font-medium">VIN Checks</th>
                  <th className="text-right py-3 px-4 font-medium">Agent Costs</th>
                  <th className="text-right py-3 px-4 font-medium">Net</th>
                </tr>
              </thead>
              <tbody>
                {data?.monthly_breakdown?.map((month) => (
                  <tr key={month.month} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{month.month}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(month.booking_revenue)}</td>
                    <td className="text-right py-3 px-4 text-green-600">{formatCurrency(month.platform_fees)}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(month.vin_checks)}</td>
                    <td className="text-right py-3 px-4 text-red-600">-{formatCurrency(month.agent_costs)}</td>
                    <td className="text-right py-3 px-4 font-semibold">{formatCurrency(month.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Vehicles */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Vehicles</CardTitle>
          <CardDescription>Highest revenue generators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.top_vehicles?.map((vehicle, index) => (
              <div key={vehicle.id} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{vehicle.name}</p>
                    <p className="text-sm text-muted-foreground">{vehicle.bookings} bookings</p>
                  </div>
                </div>
                <p className="font-semibold text-[#CC0000]">{formatCurrency(vehicle.revenue)}</p>
              </div>
            ))}
            {(!data?.top_vehicles || data.top_vehicles.length === 0) && (
              <p className="text-center text-muted-foreground py-4">No vehicle data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
