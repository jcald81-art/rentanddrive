'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Shield,
  AlertTriangle,
  FileText,
  DollarSign,
  Car,
  Calendar,
  Search,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react'

interface InsuranceStats {
  total_policies: number
  active_policies: number
  expiring_soon: number
  total_claims: number
  open_claims: number
  claims_paid_this_month: number
  total_coverage_value: number
}

interface Policy {
  id: string
  vehicle_id: string
  vehicle: { year: number; make: string; model: string; license_plate: string }
  host: { full_name: string; email: string }
  policy_number: string
  provider: string
  coverage_type: string
  coverage_amount: number
  deductible: number
  premium_monthly: number
  start_date: string
  end_date: string
  status: string
}

interface Claim {
  id: string
  claim_number: string
  booking_id: string
  vehicle: { year: number; make: string; model: string }
  claimant: { full_name: string }
  incident_date: string
  incident_type: string
  description: string
  estimated_damage: number
  approved_amount: number | null
  status: string
  created_at: string
}

export default function InsuranceDashboardPage() {
  const [stats, setStats] = useState<InsuranceStats | null>(null)
  const [policies, setPolicies] = useState<Policy[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [statsRes, policiesRes, claimsRes] = await Promise.all([
        fetch('/api/admin/insurance/stats'),
        fetch('/api/admin/insurance/policies'),
        fetch('/api/admin/insurance/claims'),
      ])
      
      if (statsRes.ok) setStats(await statsRes.json())
      if (policiesRes.ok) setPolicies((await policiesRes.json()).policies || [])
      if (claimsRes.ok) setClaims((await claimsRes.json()).claims || [])
    } catch (error) {
      console.error('Failed to fetch insurance data:', error)
    }
    setLoading(false)
  }

  async function updateClaimStatus(claimId: string, status: string, approvedAmount?: number) {
    try {
      const res = await fetch(`/api/admin/insurance/claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, approved_amount: approvedAmount }),
      })
      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Failed to update claim:', error)
    }
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'approved':
        return <Badge className="bg-blue-600">Approved</Badge>
      case 'denied':
        return <Badge variant="destructive">Denied</Badge>
      case 'paid':
        return <Badge className="bg-green-600">Paid</Badge>
      case 'expired':
        return <Badge variant="outline">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredPolicies = policies.filter(p => {
    const matchesSearch = searchTerm === '' || 
      p.policy_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.host.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${p.vehicle.year} ${p.vehicle.make} ${p.vehicle.model}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredClaims = claims.filter(c => {
    const matchesSearch = searchTerm === '' || 
      c.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.claimant.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-6" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insurance Dashboard</h1>
          <p className="text-muted-foreground">Manage policies and claims</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_policies || 0}</div>
            <p className="text-xs text-muted-foreground">
              of {stats?.total_policies || 0} total policies
            </p>
          </CardContent>
        </Card>

        <Card className={stats?.expiring_soon ? 'border-amber-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.expiring_soon || 0}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>

        <Card className={stats?.open_claims ? 'border-red-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Claims</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.open_claims || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_claims || 0} total claims
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claims Paid (Month)</CardTitle>
            <DollarSign className="h-4 w-4 text-[#CC0000]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.claims_paid_this_month || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Total coverage: {formatCurrency(stats?.total_coverage_value || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search policies or claims..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="policies">
        <TabsList>
          <TabsTrigger value="policies">Policies ({policies.length})</TabsTrigger>
          <TabsTrigger value="claims">Claims ({claims.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Policies</CardTitle>
              <CardDescription>All vehicle insurance policies on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy #</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPolicies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-mono text-sm">{policy.policy_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          {policy.vehicle.year} {policy.vehicle.make} {policy.vehicle.model}
                        </div>
                      </TableCell>
                      <TableCell>{policy.host.full_name}</TableCell>
                      <TableCell>{policy.provider}</TableCell>
                      <TableCell>{formatCurrency(policy.coverage_amount)}</TableCell>
                      <TableCell>{formatCurrency(policy.premium_monthly)}/mo</TableCell>
                      <TableCell>
                        <span className={new Date(policy.end_date) < new Date(Date.now() + 30*24*60*60*1000) ? 'text-amber-600 font-medium' : ''}>
                          {formatDate(policy.end_date)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(policy.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPolicies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No policies found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claims" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Claims</CardTitle>
              <CardDescription>Review and process damage claims</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim #</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Claimant</TableHead>
                    <TableHead>Incident</TableHead>
                    <TableHead>Est. Damage</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-mono text-sm">{claim.claim_number}</TableCell>
                      <TableCell>
                        {claim.vehicle.year} {claim.vehicle.make} {claim.vehicle.model}
                      </TableCell>
                      <TableCell>{claim.claimant.full_name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium capitalize">{claim.incident_type}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(claim.incident_date)}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(claim.estimated_damage)}</TableCell>
                      <TableCell>
                        {claim.approved_amount !== null ? formatCurrency(claim.approved_amount) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {claim.status === 'pending' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-green-600"
                                onClick={() => updateClaimStatus(claim.id, 'approved', claim.estimated_damage)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-600"
                                onClick={() => updateClaimStatus(claim.id, 'denied')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredClaims.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No claims found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
