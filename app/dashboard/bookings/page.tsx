'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Calendar, 
  Search, 
  DollarSign,
  Check,
  X,
  Eye,
  Clock,
  Car,
  User,
  Filter,
} from 'lucide-react'

interface HostBooking {
  id: string
  renter: {
    id: string
    full_name: string
    avatar_url?: string
    email: string
  }
  vehicle: {
    id: string
    make: string
    model: string
    year: number
  }
  start_date: string
  end_date: string
  status: string
  total_amount: number
  host_payout: number
  instant_book: boolean
  created_at: string
}

export default function HostBookingsPage() {
  const [bookings, setBookings] = useState<HostBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState<HostBooking | null>(null)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showDeclineDialog, setShowDeclineDialog] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [statusFilter])

  async function fetchBookings() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      
      const res = await fetch(`/api/host/bookings?${params}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function approveBooking(bookingId: string) {
    setProcessing(true)
    try {
      const res = await fetch(`/api/host/bookings/${bookingId}/approve`, { method: 'POST' })
      if (res.ok) {
        fetchBookings()
        setShowApproveDialog(false)
        setSelectedBooking(null)
      }
    } catch (error) {
      console.error('Failed to approve booking:', error)
    } finally {
      setProcessing(false)
    }
  }

  async function declineBooking(bookingId: string) {
    setProcessing(true)
    try {
      const res = await fetch(`/api/host/bookings/${bookingId}/decline`, { method: 'POST' })
      if (res.ok) {
        fetchBookings()
        setShowDeclineDialog(false)
        setSelectedBooking(null)
      }
    } catch (error) {
      console.error('Failed to decline booking:', error)
    } finally {
      setProcessing(false)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      booking.renter.full_name.toLowerCase().includes(query) ||
      booking.vehicle.make.toLowerCase().includes(query) ||
      booking.vehicle.model.toLowerCase().includes(query)
    )
  })

  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const activeCount = bookings.filter(b => b.status === 'active' || b.status === 'confirmed').length
  const totalRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.host_payout, 0)

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    disputed: 'bg-orange-100 text-orange-800',
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bookings</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Active Trips</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${(totalRevenue / 100).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by renter or vehicle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Renter</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No bookings found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                          {booking.renter.avatar_url ? (
                            <img
                              src={booking.renter.avatar_url}
                              alt={booking.renter.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-medium">
                              {booking.renter.full_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{booking.renter.full_name}</p>
                          <p className="text-xs text-muted-foreground">{booking.renter.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(booking.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        <p className="text-muted-foreground">
                          to {new Date(booking.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-green-600">
                        ${(booking.host_payout / 100).toFixed(2)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[booking.status]}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {booking.status === 'pending' && !booking.instant_book && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => {
                                setSelectedBooking(booking)
                                setShowApproveDialog(true)
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => {
                                setSelectedBooking(booking)
                                setShowDeclineDialog(true)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Link href={`/dashboard/bookings/${booking.id}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Booking</DialogTitle>
            <DialogDescription>
              Confirm this booking for {selectedBooking?.renter.full_name}? The renter will be notified and payment will be processed.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-medium">
                {selectedBooking.vehicle.year} {selectedBooking.vehicle.make} {selectedBooking.vehicle.model}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(selectedBooking.start_date).toLocaleDateString()} - {new Date(selectedBooking.end_date).toLocaleDateString()}
              </p>
              <p className="text-sm font-medium text-green-600 mt-2">
                Your payout: ${(selectedBooking.host_payout / 100).toFixed(2)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => selectedBooking && approveBooking(selectedBooking.id)}
              disabled={processing}
            >
              {processing ? 'Approving...' : 'Approve Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline this booking? The renter will be notified and can book another vehicle.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedBooking && declineBooking(selectedBooking.id)}
              disabled={processing}
            >
              {processing ? 'Declining...' : 'Decline Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
