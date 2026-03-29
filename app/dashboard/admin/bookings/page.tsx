'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Calendar, 
  Search, 
  Download,
  Flag,
  MoreVertical,
  Eye,
  AlertTriangle,
  MessageSquare,
  RefreshCw,
  DollarSign,
  Users,
  Car,
} from 'lucide-react'

interface AdminBooking {
  id: string
  renter: {
    id: string
    full_name: string
    email: string
  }
  host: {
    id: string
    full_name: string
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
  platform_fee: number
  is_flagged: boolean
  admin_notes?: string
  created_at: string
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null)
  const [showFlagDialog, setShowFlagDialog] = useState(false)
  const [showNotesDialog, setShowNotesDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [statusFilter, dateRange])

  async function fetchBookings() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (dateRange.start) params.set('start_date', dateRange.start)
      if (dateRange.end) params.set('end_date', dateRange.end)
      
      const res = await fetch(`/api/admin/bookings?${params}`)
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

  async function exportToCSV() {
    try {
      const res = await fetch('/api/admin/bookings/export')
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Failed to export:', error)
    }
  }

  async function flagBooking(bookingId: string, flagged: boolean) {
    setProcessing(true)
    try {
      await fetch(`/api/admin/bookings/${bookingId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagged }),
      })
      fetchBookings()
      setShowFlagDialog(false)
    } catch (error) {
      console.error('Failed to flag booking:', error)
    } finally {
      setProcessing(false)
    }
  }

  async function updateAdminNotes(bookingId: string) {
    setProcessing(true)
    try {
      await fetch(`/api/admin/bookings/${bookingId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: adminNotes }),
      })
      fetchBookings()
      setShowNotesDialog(false)
    } catch (error) {
      console.error('Failed to update notes:', error)
    } finally {
      setProcessing(false)
    }
  }

  async function forceStatusChange(bookingId: string) {
    setProcessing(true)
    try {
      await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchBookings()
      setShowStatusDialog(false)
    } catch (error) {
      console.error('Failed to change status:', error)
    } finally {
      setProcessing(false)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      booking.renter.full_name.toLowerCase().includes(query) ||
      booking.renter.email.toLowerCase().includes(query) ||
      booking.host.full_name.toLowerCase().includes(query) ||
      booking.vehicle.make.toLowerCase().includes(query) ||
      booking.vehicle.model.toLowerCase().includes(query) ||
      booking.id.toLowerCase().includes(query)
    )
  })

  const totalBookings = bookings.length
  const totalRevenue = bookings.reduce((sum, b) => sum + b.total_amount, 0)
  const platformFees = bookings.reduce((sum, b) => sum + b.platform_fee, 0)
  const disputedCount = bookings.filter(b => b.status === 'disputed' || b.is_flagged).length

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    disputed: 'bg-orange-100 text-orange-800',
    refunded: 'bg-purple-100 text-purple-800',
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin: All Bookings</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchBookings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBookings}</p>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
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
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${(platformFees / 100).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Platform Fees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{disputedCount}</p>
                <p className="text-sm text-muted-foreground">Disputes/Flagged</p>
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
                  placeholder="Search by renter, host, vehicle, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-[150px]"
              placeholder="Start date"
            />
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-[150px]"
              placeholder="End date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Renter</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Platform Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No bookings found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id} className={booking.is_flagged ? 'bg-orange-50' : ''}>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {booking.id.slice(0, 8)}
                      </code>
                      {booking.is_flagged && (
                        <Flag className="h-3 w-3 text-orange-500 inline ml-1" />
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{booking.renter.full_name}</p>
                      <p className="text-xs text-muted-foreground">{booking.renter.email}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{booking.host.full_name}</p>
                      <p className="text-xs text-muted-foreground">{booking.host.email}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {new Date(booking.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {' - '}
                        {new Date(booking.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">${(booking.total_amount / 100).toFixed(2)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-green-600">${(booking.platform_fee / 100).toFixed(2)}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[booking.status]}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(`/bookings/${booking.id}`, '_blank')}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedBooking(booking)
                            setAdminNotes(booking.admin_notes || '')
                            setShowNotesDialog(true)
                          }}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Add Notes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => {
                            setSelectedBooking(booking)
                            setShowFlagDialog(true)
                          }}>
                            <Flag className="h-4 w-4 mr-2" />
                            {booking.is_flagged ? 'Remove Flag' : 'Flag Booking'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedBooking(booking)
                            setNewStatus(booking.status)
                            setShowStatusDialog(true)
                          }}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Force Status Change
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Flag Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedBooking?.is_flagged ? 'Remove Flag' : 'Flag Booking'}
            </DialogTitle>
            <DialogDescription>
              {selectedBooking?.is_flagged
                ? 'Remove the dispute flag from this booking?'
                : 'Flag this booking for review? This will alert the support team.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlagDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedBooking?.is_flagged ? 'outline' : 'destructive'}
              onClick={() => selectedBooking && flagBooking(selectedBooking.id, !selectedBooking.is_flagged)}
              disabled={processing}
            >
              {processing ? 'Processing...' : selectedBooking?.is_flagged ? 'Remove Flag' : 'Flag Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Notes</DialogTitle>
            <DialogDescription>
              Add internal notes about this booking. Only visible to admins.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter admin notes..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => selectedBooking && updateAdminNotes(selectedBooking.id)}
              disabled={processing}
              className="bg-[#CC0000] hover:bg-[#CC0000]/90"
            >
              {processing ? 'Saving...' : 'Save Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Status Change</DialogTitle>
            <DialogDescription>
              This will override the current booking status. Use with caution.
            </DialogDescription>
          </DialogHeader>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedBooking && forceStatusChange(selectedBooking.id)}
              disabled={processing || !newStatus}
            >
              {processing ? 'Updating...' : 'Change Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
