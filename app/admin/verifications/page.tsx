"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Shield, Search, Filter, Eye, AlertTriangle, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Verification {
  id: string
  user_id: string
  status: string
  rentability_score: number | null
  score_tier: string | null
  driver_name: string | null
  license_state: string | null
  stripe_verification_status: string | null
  checkr_status: string | null
  block_reason: string | null
  appeal_submitted: boolean
  created_at: string
  completed_at: string | null
  profiles?: {
    email: string
    first_name: string
    last_name: string
  }
}

const STATUS_CONFIG = {
  verified: { label: "Verified", icon: CheckCircle, color: "bg-green-100 text-green-700" },
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-700" },
  processing: { label: "Processing", icon: RefreshCw, color: "bg-blue-100 text-blue-700" },
  soft_blocked: { label: "Blocked", icon: AlertTriangle, color: "bg-orange-100 text-orange-700" },
  auto_denied: { label: "Denied", icon: XCircle, color: "bg-red-100 text-red-700" },
}

const TIER_COLORS = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-orange-500",
  auto_deny: "bg-red-500",
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tierFilter, setTierFilter] = useState("all")
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchVerifications()
  }, [statusFilter, tierFilter])

  async function fetchVerifications() {
    setLoading(true)

    let query = supabase
      .from("driver_verifications")
      .select(
        `
        *,
        profiles:user_id (email, first_name, last_name)
      `
      )
      .order("created_at", { ascending: false })
      .limit(100)

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter)
    }

    if (tierFilter !== "all") {
      query = query.eq("score_tier", tierFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error("Failed to fetch verifications:", error)
    } else {
      setVerifications(data || [])
    }

    setLoading(false)
  }

  const filteredVerifications = verifications.filter((v) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      v.driver_name?.toLowerCase().includes(search) ||
      v.profiles?.email?.toLowerCase().includes(search) ||
      v.profiles?.first_name?.toLowerCase().includes(search) ||
      v.profiles?.last_name?.toLowerCase().includes(search)
    )
  })

  // Stats
  const stats = {
    total: verifications.length,
    verified: verifications.filter((v) => v.status === "verified").length,
    pending: verifications.filter((v) => v.status === "pending" || v.status === "processing").length,
    blocked: verifications.filter((v) => v.status === "soft_blocked" || v.status === "auto_denied").length,
    appeals: verifications.filter((v) => v.appeal_submitted).length,
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Driver Verifications</h1>
            <p className="text-slate-600">Manage renter verification status and appeals</p>
          </div>
          <Button onClick={fetchVerifications} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-slate-500">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
              <p className="text-sm text-slate-500">Verified</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-sm text-slate-500">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
              <p className="text-sm text-slate-500">Blocked/Denied</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{stats.appeals}</div>
              <p className="text-sm text-slate-500">Appeals</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="soft_blocked">Blocked</SelectItem>
                  <SelectItem value="auto_denied">Denied</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-[150px]">
                  <Shield className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="green">Green (80+)</SelectItem>
                  <SelectItem value="yellow">Yellow (60-79)</SelectItem>
                  <SelectItem value="red">Red (40-59)</SelectItem>
                  <SelectItem value="auto_deny">Auto Deny (&lt;40)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredVerifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No verifications found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVerifications.map((v) => {
                    const statusConfig = STATUS_CONFIG[v.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
                    const StatusIcon = statusConfig.icon

                    return (
                      <TableRow key={v.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {v.driver_name || `${v.profiles?.first_name || ""} ${v.profiles?.last_name || ""}`}
                            </p>
                            <p className="text-sm text-slate-500">{v.profiles?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          {v.appeal_submitted && (
                            <Badge variant="outline" className="ml-2 text-orange-600 border-orange-300">
                              Appeal
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-bold">{v.rentability_score ?? "—"}</span>
                        </TableCell>
                        <TableCell>
                          {v.score_tier ? (
                            <div
                              className={`w-4 h-4 rounded-full ${TIER_COLORS[v.score_tier as keyof typeof TIER_COLORS] || "bg-slate-300"}`}
                            />
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{v.license_state || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-500">
                            {new Date(v.created_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedVerification(v)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Verification Details</DialogTitle>
                              </DialogHeader>
                              {selectedVerification && (
                                <Tabs defaultValue="details">
                                  <TabsList>
                                    <TabsTrigger value="details">Details</TabsTrigger>
                                    <TabsTrigger value="mvr">MVR Records</TabsTrigger>
                                    <TabsTrigger value="actions">Actions</TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="details" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="text-slate-500">Driver Name</p>
                                        <p className="font-medium">{selectedVerification.driver_name || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-slate-500">Score</p>
                                        <p className="font-medium text-lg">{selectedVerification.rentability_score ?? "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-slate-500">Stripe Status</p>
                                        <p className="font-medium">{selectedVerification.stripe_verification_status || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-slate-500">Checkr Status</p>
                                        <p className="font-medium">{selectedVerification.checkr_status || "—"}</p>
                                      </div>
                                      {selectedVerification.block_reason && (
                                        <div className="col-span-2">
                                          <p className="text-slate-500">Block Reason</p>
                                          <p className="font-medium text-red-600">{selectedVerification.block_reason}</p>
                                        </div>
                                      )}
                                    </div>
                                  </TabsContent>
                                  <TabsContent value="mvr">
                                    <p className="text-sm text-slate-500">
                                      MVR records would be displayed here with full violation history.
                                    </p>
                                  </TabsContent>
                                  <TabsContent value="actions" className="space-y-4">
                                    <div className="flex gap-2">
                                      <Button variant="outline" className="gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        Override to Verified
                                      </Button>
                                      <Button variant="outline" className="gap-2 text-red-600">
                                        <XCircle className="h-4 w-4" />
                                        Deny Renter
                                      </Button>
                                    </div>
                                    {selectedVerification.appeal_submitted && (
                                      <div className="p-4 bg-orange-50 rounded-lg">
                                        <p className="font-medium text-orange-700">Appeal Pending</p>
                                        <div className="flex gap-2 mt-2">
                                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                            Approve Appeal
                                          </Button>
                                          <Button size="sm" variant="outline">
                                            Reject Appeal
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </TabsContent>
                                </Tabs>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
