"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  CalendarCheck, Search, MoreVertical, Car, UserCircle,
  DollarSign, CheckCircle2, Clock, XCircle, AlertTriangle, Eye
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Booking {
  id: string
  renter_id: string
  vehicle_id: string
  host_id: string
  start_date: string
  end_date: string
  total_amount: number
  status: string
  payment_status: string
  created_at: string
  vehicle?: {
    make: string
    model: string
    year: number
  }
  renter?: {
    full_name: string
    email: string
  }
  host?: {
    full_name: string
    email: string
  }
}

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const fetchBookings = async () => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicle:vehicles(make, model, year),
          renter:profiles!bookings_renter_id_fkey(full_name, email),
          host:profiles!bookings_host_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching bookings:', error)
      } else {
        setBookings(data || [])
      }
      setLoading(false)
    }

    fetchBookings()
  }, [])

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    const supabase = createClient()
    
    await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId)

    setBookings(bookings.map(b => 
      b.id === bookingId ? { ...b, status: newStatus } : b
    ))
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      `${booking.vehicle?.year} ${booking.vehicle?.make} ${booking.vehicle?.model}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.renter?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.host?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/10 text-green-400 border-0"><CheckCircle2 className="h-3 w-3 mr-1" />Confirmed</Badge>
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-400 border-0"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-400 border-0"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>
      case 'completed':
        return <Badge className="bg-blue-500/10 text-blue-400 border-0"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>
      case 'active':
        return <Badge className="bg-purple-500/10 text-purple-400 border-0"><Car className="h-3 w-3 mr-1" />Active</Badge>
      default:
        return <Badge className="bg-white/10 text-white/50 border-0">{status}</Badge>
    }
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <p className="text-white/50 mt-1">{bookings.length} total bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 rounded-lg p-1">
            {['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize ${
                  statusFilter === status
                    ? 'bg-[#FF4D4D] text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 w-64"
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <Card className="bg-[#151515] border-white/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50">Vehicle</TableHead>
                <TableHead className="text-white/50">Renter</TableHead>
                <TableHead className="text-white/50">Host</TableHead>
                <TableHead className="text-white/50">Dates</TableHead>
                <TableHead className="text-white/50">Amount</TableHead>
                <TableHead className="text-white/50">Status</TableHead>
                <TableHead className="text-white/50">Created</TableHead>
                <TableHead className="text-white/50 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="animate-pulse text-white/40">Loading bookings...</div>
                  </TableCell>
                </TableRow>
              ) : filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-white/40">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-white/40" />
                        <span className="text-white">
                          {booking.vehicle?.year} {booking.vehicle?.make} {booking.vehicle?.model}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4 text-purple-400" />
                        <span className="text-white">{booking.renter?.full_name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-white/70">{booking.host?.full_name || 'Unknown'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="text-white">{new Date(booking.start_date).toLocaleDateString()}</p>
                        <p className="text-white/50">to {new Date(booking.end_date).toLocaleDateString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-white font-medium">
                        <DollarSign className="h-3.5 w-3.5 text-green-400" />
                        {(booking.total_amount || 0).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(booking.status)}
                    </TableCell>
                    <TableCell className="text-white/50 text-sm">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/50 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={`/platform-management/bookings/${booking.id}`} className="cursor-pointer">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {booking.status === 'pending' && (
                            <DropdownMenuItem 
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="cursor-pointer text-green-500"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Confirm Booking
                            </DropdownMenuItem>
                          )}
                          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                            <DropdownMenuItem 
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              className="cursor-pointer text-red-500"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Booking
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="cursor-pointer text-amber-500">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Flag for Review
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
    </div>
  )
}
