'use client'

import { useState } from 'react'
import { DollarSign, Package, TrendingUp, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STATS = [
  { label: 'Total Merch Sales', value: '$340', icon: DollarSign, color: 'text-green-400' },
  { label: 'Orders This Month', value: '12', icon: Package, color: 'text-blue-400' },
  { label: 'Best Seller', value: 'Dad Hat — 7 sold', icon: Award, color: 'text-[#FFD84D]' },
  { label: 'Your Earnings (80%)', value: '$272', icon: TrendingUp, color: 'text-green-400' },
]

const ORDERS = [
  { date: '2024-01-15', customer: 'J***n M.', product: 'Dad Hat', size: null, status: 'Delivered', tracking: '1Z999AA10123456784' },
  { date: '2024-01-14', customer: 'S***a K.', product: 'T-Shirt', size: 'L', status: 'Shipped', tracking: '1Z999AA10123456783' },
  { date: '2024-01-13', customer: 'M***e R.', product: 'Hoodie', size: 'XL', status: 'Printed', tracking: null },
  { date: '2024-01-12', customer: 'A***x T.', product: 'Coffee Mug', size: null, status: 'Processing', tracking: null },
  { date: '2024-01-11', customer: 'C***s B.', product: 'Dad Hat', size: null, status: 'Delivered', tracking: '1Z999AA10123456781' },
]

const PRODUCTS = [
  { name: 'Dad Hat', sold: 7, revenue: 244.93, profit: 95.48 },
  { name: 'T-Shirt', sold: 4, revenue: 119.96, profit: 53.36 },
  { name: 'Coffee Mug', sold: 3, revenue: 59.97, profit: 26.46 },
  { name: 'Hoodie', sold: 2, revenue: 119.98, profit: 44.86 },
  { name: 'Sticker Pack', sold: 5, revenue: 49.95, profit: 24.16 },
]

const STATUS_COLORS: Record<string, string> = {
  Processing: 'bg-yellow-500/20 text-yellow-400',
  Printed: 'bg-blue-500/20 text-blue-400',
  Shipped: 'bg-purple-500/20 text-purple-400',
  Delivered: 'bg-green-500/20 text-green-400',
}

export default function MerchDashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Merch Dashboard</h1>
          <p className="text-zinc-400">Track your merchandise sales and earnings</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {STATS.map(stat => (
            <Card key={stat.label} className="border-zinc-800 bg-zinc-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">{stat.label}</p>
                    <p className={`text-2xl font-bold font-mono mt-1 ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-50`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Orders Table */}
        <Card className="border-zinc-800 bg-zinc-900 mb-8">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <p className="text-sm text-zinc-400">
              Printful handles fulfillment automatically
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-sm text-zinc-400">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">Size</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Tracking</th>
                  </tr>
                </thead>
                <tbody>
                  {ORDERS.map((order, idx) => (
                    <tr key={idx} className="border-b border-zinc-800 last:border-0">
                      <td className="py-3 text-sm">{order.date}</td>
                      <td className="py-3 text-sm">{order.customer}</td>
                      <td className="py-3 text-sm">{order.product}</td>
                      <td className="py-3 text-sm text-zinc-400">{order.size || '—'}</td>
                      <td className="py-3">
                        <Badge className={STATUS_COLORS[order.status]}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm font-mono text-zinc-400">
                        {order.tracking ? (
                          <a href="#" className="text-blue-400 hover:underline">
                            {order.tracking.slice(0, 10)}...
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Product Performance */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {PRODUCTS.map(product => (
                <div
                  key={product.name}
                  className="flex items-center justify-between rounded-lg bg-zinc-800 p-4"
                >
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-zinc-400">{product.sold} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-zinc-300">${product.revenue.toFixed(2)} revenue</p>
                    <p className="font-mono text-green-400">${product.profit.toFixed(2)} profit</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
