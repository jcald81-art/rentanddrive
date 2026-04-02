"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  UserCircle, Search, MoreVertical, Mail, Phone, 
  Calendar, CheckCircle2, AlertTriangle, Eye, Star, Ban
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

interface Renter {
  id: string
  email: string
  full_name: string
  phone: string
  avatar_url: string
  drivers_license_verified: boolean
  identity_verified: boolean
  referral_code: string
  created_at: string
  bookings_count?: number
  total_spent?: number
}

export default function RentersManagement() {
  const [renters, setRenters] = useState<Renter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchRenters = async () => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching renters:', error)
      } else {
        // Enrich with booking counts
        const enrichedRenters = await Promise.all((data || []).map(async (renter) => {
          const { data: bookings } = await supabase
            .from('bookings')
            .select('total_amount')
            .eq('renter_id', renter.id)

          const totalSpent = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0

          return {
            ...renter,
            bookings_count: bookings?.length || 0,
            total_spent: totalSpent,
          }
        }))

        setRenters(enrichedRenters)
      }
      setLoading(false)
    }

    fetchRenters()
  }, [])

  const handleImpersonate = (renterId: string) => {
    localStorage.setItem('rad_impersonating_user_id', renterId)
    localStorage.setItem('rad_user_mode', 'renter')
    window.location.href = '/renter/suite'
  }

  const filteredRenters = renters.filter(renter => 
    renter.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    renter.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    renter.phone?.includes(searchQuery)
  )

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Renters</h1>
          <p className="text-white/50 mt-1">{renters.length} total renters</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search renters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 w-64"
            />
          </div>
        </div>
      </div>

      {/* Renters Table */}
      <Card className="bg-[#151515] border-white/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50">Renter</TableHead>
                <TableHead className="text-white/50">Contact</TableHead>
                <TableHead className="text-white/50 text-center">Bookings</TableHead>
                <TableHead className="text-white/50">Total Spent</TableHead>
                <TableHead className="text-white/50">Verification</TableHead>
                <TableHead className="text-white/50">Referral Code</TableHead>
                <TableHead className="text-white/50">Joined</TableHead>
                <TableHead className="text-white/50 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="animate-pulse text-white/40">Loading renters...</div>
                  </TableCell>
                </TableRow>
              ) : filteredRenters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-white/40">
                    No renters found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRenters.map((renter) => (
                  <TableRow key={renter.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                          <UserCircle className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{renter.full_name || 'Unnamed'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-white/70 text-sm">
                          <Mail className="h-3.5 w-3.5" />
                          {renter.email}
                        </div>
                        {renter.phone && (
                          <div className="flex items-center gap-1.5 text-white/50 text-sm">
                            <Phone className="h-3.5 w-3.5" />
                            {renter.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Calendar className="h-4 w-4 text-white/40" />
                        <span className="text-white">{renter.bookings_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-white font-medium">${(renter.total_spent || 0).toFixed(2)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renter.identity_verified ? (
                          <Badge className="bg-green-500/10 text-green-400 border-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            ID
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-400 border-0">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Unverified
                          </Badge>
                        )}
                        {renter.drivers_license_verified && (
                          <Badge className="bg-blue-500/10 text-blue-400 border-0">
                            DL
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-white/50 text-sm font-mono">{renter.referral_code || '-'}</span>
                    </TableCell>
                    <TableCell className="text-white/50 text-sm">
                      {new Date(renter.created_at).toLocaleDateString()}
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
                            <Link href={`/platform-management/renters/${renter.id}`} className="cursor-pointer">
                              <UserCircle className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleImpersonate(renter.id)}
                            className="cursor-pointer text-[#FF4D4D]"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View as User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer">
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-amber-500">
                            <Ban className="h-4 w-4 mr-2" />
                            Suspend Renter
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
