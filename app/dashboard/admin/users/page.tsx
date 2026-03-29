'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { 
  Search, 
  UserCheck, 
  UserX, 
  Shield,
  Mail,
  Phone,
  Calendar,
  Car,
  MapPin,
  FileText,
  AlertTriangle
} from 'lucide-react'

interface User {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  avatar_url: string | null
  role: string
  is_verified: boolean
  verification_status: string | null
  total_bookings: number
  total_spent: number
  total_earned: number
  created_at: string
}

interface UserDetail extends User {
  driver_license_url: string | null
  driver_license_expiry: string | null
  address: string | null
  bookings: Array<{
    id: string
    vehicle_name: string
    total_amount: number
    status: string
    created_at: string
  }>
  vehicles: Array<{
    id: string
    name: string
    is_active: boolean
    total_bookings: number
  }>
}

export default function UsersManagementPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState(searchParams.get('filter') || 'all')
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [banReason, setBanReason] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [roleFilter])

  async function fetchUsers() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (roleFilter !== 'all') params.set('filter', roleFilter)
      if (search) params.set('search', search)
      
      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
    setLoading(false)
  }

  async function viewUserDetail(userId: string) {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedUser(data)
        setUserDialogOpen(true)
      }
    } catch (error) {
      console.error('Failed to fetch user detail:', error)
    }
  }

  async function banUser() {
    if (!selectedUser) return
    try {
      await fetch(`/api/admin/users/${selectedUser.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: banReason }),
      })
      setBanDialogOpen(false)
      setUserDialogOpen(false)
      setBanReason('')
      fetchUsers()
    } catch (error) {
      console.error('Failed to ban user:', error)
    }
  }

  async function promoteToHost(userId: string) {
    try {
      await fetch(`/api/admin/users/${userId}/promote`, {
        method: 'POST',
      })
      fetchUsers()
      if (selectedUser?.id === userId) {
        viewUserDetail(userId)
      }
    } catch (error) {
      console.error('Failed to promote user:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">View and manage all platform users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="renter">Renters Only</SelectItem>
            <SelectItem value="host">Hosts Only</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
            <SelectItem value="pending_verification">Pending Verification</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchUsers} variant="outline">
          Search
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">User</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-left py-3 px-4 font-medium">Verified</th>
                    <th className="text-right py-3 px-4 font-medium">Bookings</th>
                    <th className="text-right py-3 px-4 font-medium">Spent/Earned</th>
                    <th className="text-left py-3 px-4 font-medium">Joined</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {(user.full_name || user.email)[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name || 'Unnamed'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={user.role === 'admin' ? 'default' : 'outline'}
                          className={user.role === 'admin' ? 'bg-[#CC0000]' : 'capitalize'}
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {user.is_verified ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="text-right py-3 px-4">{user.total_bookings}</td>
                      <td className="text-right py-3 px-4">
                        {user.role === 'host' 
                          ? formatCurrency(user.total_earned)
                          : formatCurrency(user.total_spent)
                        }
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => viewUserDetail(user.id)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback className="text-xl">
                      {(selectedUser.full_name || selectedUser.email)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl">{selectedUser.full_name || 'Unnamed User'}</DialogTitle>
                    <DialogDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedUser.email}
                      </span>
                      {selectedUser.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedUser.phone}
                        </span>
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* User Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{selectedUser.total_bookings}</p>
                    <p className="text-sm text-muted-foreground">Bookings</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{formatCurrency(selectedUser.total_spent)}</p>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{formatCurrency(selectedUser.total_earned)}</p>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold capitalize">{selectedUser.role}</p>
                    <p className="text-sm text-muted-foreground">Role</p>
                  </div>
                </div>

                {/* Verification Info */}
                {selectedUser.driver_license_url && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Driver License
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm">
                            Expires: {selectedUser.driver_license_expiry 
                              ? formatDate(selectedUser.driver_license_expiry) 
                              : 'Not provided'}
                          </p>
                          <Badge 
                            variant={selectedUser.is_verified ? 'default' : 'secondary'}
                            className={selectedUser.is_verified ? 'bg-green-600' : ''}
                          >
                            {selectedUser.verification_status || 'Pending'}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={selectedUser.driver_license_url} target="_blank" rel="noopener noreferrer">
                            View Document
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Bookings */}
                {selectedUser.bookings?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedUser.bookings.slice(0, 5).map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div>
                              <p className="font-medium">{booking.vehicle_name}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(booking.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(booking.total_amount)}</p>
                              <Badge variant="outline" className="capitalize">{booking.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Vehicles (if host) */}
                {selectedUser.vehicles?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Listed Vehicles
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedUser.vehicles.map((vehicle) => (
                          <div key={vehicle.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div>
                              <p className="font-medium">{vehicle.name}</p>
                              <p className="text-xs text-muted-foreground">{vehicle.total_bookings} bookings</p>
                            </div>
                            <Badge variant={vehicle.is_active ? 'default' : 'secondary'}>
                              {vehicle.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter className="mt-6">
                {selectedUser.role === 'renter' && (
                  <Button 
                    variant="outline" 
                    onClick={() => promoteToHost(selectedUser.id)}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Promote to Host
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  onClick={() => setBanDialogOpen(true)}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Ban User
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban Confirmation Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Ban User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to ban {selectedUser?.full_name || selectedUser?.email}? 
              This will prevent them from logging in or making bookings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Reason for ban (required)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={banUser}
              disabled={!banReason.trim()}
            >
              Confirm Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
