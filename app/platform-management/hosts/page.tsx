"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, Search, Eye, MoreVertical, Mail, Phone, 
  Car, Calendar, DollarSign, Shield, Ban, CheckCircle2 
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

interface Host {
  id: string
  email: string
  full_name: string
  phone: string
  avatar_url: string
  is_host: boolean
  stripe_connect_id: string
  mfa_enabled: boolean
  referral_code: string
  referral_count: number
  created_at: string
  vehicles_count?: number
  bookings_count?: number
  total_earnings?: number
}

export default function HostsManagement() {
  const [hosts, setHosts] = useState<Host[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)

  useEffect(() => {
    // Check if we're impersonating
    const impersonating = localStorage.getItem('rad_impersonating_user_id')
    if (impersonating) {
      setImpersonatingId(impersonating)
    }

    const fetchHosts = async () => {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_host', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching hosts:', error)
      } else {
        // Enrich with vehicle and booking counts
        const enrichedHosts = await Promise.all((data || []).map(async (host) => {
          const { count: vehiclesCount } = await supabase
            .from('vehicles')
            .select('*', { count: 'exact', head: true })
            .eq('host_id', host.id)

          const { count: bookingsCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('host_id', host.id)

          return {
            ...host,
            vehicles_count: vehiclesCount || 0,
            bookings_count: bookingsCount || 0,
          }
        }))

        setHosts(enrichedHosts)
      }
      setLoading(false)
    }

    fetchHosts()
  }, [])

  const handleImpersonate = (hostId: string) => {
    localStorage.setItem('rad_impersonating_user_id', hostId)
    localStorage.setItem('rad_user_mode', 'host')
    window.location.href = '/host/dashboard'
  }

  const exitImpersonation = () => {
    localStorage.removeItem('rad_impersonating_user_id')
    setImpersonatingId(null)
    window.location.reload()
  }

  const filteredHosts = hosts.filter(host => 
    host.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    host.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    host.phone?.includes(searchQuery)
  )

  return (
    <div className="p-6 md:p-8">
      {/* Impersonation Banner */}
      {impersonatingId && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-amber-400" />
            <p className="text-amber-400 font-medium">
              Currently viewing as user: {hosts.find(h => h.id === impersonatingId)?.full_name || impersonatingId}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exitImpersonation}
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            Exit Impersonation
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Hosts</h1>
          <p className="text-white/50 mt-1">{hosts.length} total hosts</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search hosts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40 w-64"
            />
          </div>
        </div>
      </div>

      {/* Hosts Table */}
      <Card className="bg-[#151515] border-white/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50">Host</TableHead>
                <TableHead className="text-white/50">Contact</TableHead>
                <TableHead className="text-white/50 text-center">Vehicles</TableHead>
                <TableHead className="text-white/50 text-center">Bookings</TableHead>
                <TableHead className="text-white/50">Status</TableHead>
                <TableHead className="text-white/50 text-center">Referrals</TableHead>
                <TableHead className="text-white/50">Joined</TableHead>
                <TableHead className="text-white/50 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="animate-pulse text-white/40">Loading hosts...</div>
                  </TableCell>
                </TableRow>
              ) : filteredHosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-white/40">
                    No hosts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredHosts.map((host) => (
                  <TableRow key={host.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FF4D4D]/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-[#FF4D4D]" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{host.full_name || 'Unnamed'}</p>
                          <p className="text-white/50 text-xs">{host.referral_code || 'No code'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-white/70 text-sm">
                          <Mail className="h-3.5 w-3.5" />
                          {host.email}
                        </div>
                        {host.phone && (
                          <div className="flex items-center gap-1.5 text-white/50 text-sm">
                            <Phone className="h-3.5 w-3.5" />
                            {host.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Car className="h-4 w-4 text-white/40" />
                        <span className="text-white">{host.vehicles_count}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Calendar className="h-4 w-4 text-white/40" />
                        <span className="text-white">{host.bookings_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {host.stripe_connect_id ? (
                          <Badge className="bg-green-500/10 text-green-400 border-0">
                            <DollarSign className="h-3 w-3 mr-1" />
                            Stripe
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-400 border-0">
                            No Payout
                          </Badge>
                        )}
                        {host.mfa_enabled && (
                          <Badge className="bg-blue-500/10 text-blue-400 border-0">
                            <Shield className="h-3 w-3 mr-1" />
                            MFA
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-white">{host.referral_count || 0}</span>
                    </TableCell>
                    <TableCell className="text-white/50 text-sm">
                      {new Date(host.created_at).toLocaleDateString()}
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
                            <Link href={`/platform-management/hosts/${host.id}`} className="cursor-pointer">
                              <Users className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleImpersonate(host.id)}
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
                            Suspend Host
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
