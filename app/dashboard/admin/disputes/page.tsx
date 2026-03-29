'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  AlertTriangle, 
  MessageSquare,
  DollarSign,
  Calendar,
  Car,
  User,
  Clock,
  CheckCircle,
  ImageIcon,
  FileText
} from 'lucide-react'

interface Dispute {
  id: string
  booking_id: string
  booking_number: string
  vehicle_name: string
  vehicle_thumbnail: string | null
  renter: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  host: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  total_amount: number
  start_date: string
  end_date: string
  dispute_reason: string
  dispute_created_at: string
  stripe_dispute_id: string | null
  status: string
  admin_notes: string | null
  damage_photos: string[]
  messages: Array<{
    id: string
    sender: string
    sender_role: string
    message: string
    created_at: string
  }>
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [resolution, setResolution] = useState('refund_renter')
  const [refundAmount, setRefundAmount] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchDisputes()
  }, [])

  async function fetchDisputes() {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/disputes')
      if (response.ok) {
        const data = await response.json()
        setDisputes(data.disputes || [])
      }
    } catch (error) {
      console.error('Failed to fetch disputes:', error)
    }
    setLoading(false)
  }

  async function resolveDispute() {
    if (!selectedDispute) return
    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/disputes/${selectedDispute.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution,
          refund_amount: resolution === 'split' ? parseFloat(refundAmount) : null,
          admin_note: adminNote,
        }),
      })
      if (response.ok) {
        setResolveOpen(false)
        setDetailOpen(false)
        setResolution('refund_renter')
        setRefundAmount('')
        setAdminNote('')
        fetchDisputes()
      }
    } catch (error) {
      console.error('Failed to resolve dispute:', error)
    }
    setProcessing(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const openDisputes = disputes.filter(d => d.status === 'disputed')
  const resolvedDisputes = disputes.filter(d => d.status !== 'disputed')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dispute Management</h1>
        <p className="text-muted-foreground">Resolve booking disputes and process refunds</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{openDisputes.length}</div>
            <p className="text-xs text-muted-foreground">Requires resolution</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedDisputes.length}</div>
            <p className="text-xs text-muted-foreground">Successfully handled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunded</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(resolvedDisputes.reduce((sum, d) => sum + d.total_amount, 0) * 0.3)}
            </div>
            <p className="text-xs text-muted-foreground">Estimated refunds</p>
          </CardContent>
        </Card>
      </div>

      {/* Open Disputes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Open Disputes ({openDisputes.length})
          </CardTitle>
          <CardDescription>These disputes require your attention</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : openDisputes.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium">No open disputes!</p>
              <p className="text-sm text-muted-foreground">All disputes have been resolved</p>
            </div>
          ) : (
            <div className="space-y-4">
              {openDisputes.map((dispute) => (
                <div 
                  key={dispute.id} 
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    setSelectedDispute(dispute)
                    setDetailOpen(true)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-20 h-14 bg-muted rounded overflow-hidden flex-shrink-0">
                        {dispute.vehicle_thumbnail ? (
                          <img 
                            src={dispute.vehicle_thumbnail} 
                            alt={dispute.vehicle_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{dispute.vehicle_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Booking #{dispute.booking_number} • {formatDate(dispute.start_date)} - {formatDate(dispute.end_date)}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {dispute.renter.name}
                          </span>
                          <span>vs</span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {dispute.host.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(dispute.total_amount)}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(dispute.dispute_created_at)}
                      </div>
                    </div>
                  </div>
                  {dispute.dispute_reason && (
                    <p className="mt-3 text-sm bg-red-50 text-red-800 p-2 rounded">
                      {dispute.dispute_reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispute Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedDispute && (
            <>
              <DialogHeader>
                <DialogTitle>Dispute: {selectedDispute.vehicle_name}</DialogTitle>
                <DialogDescription>
                  Booking #{selectedDispute.booking_number} • {formatCurrency(selectedDispute.total_amount)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Parties */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Renter</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={selectedDispute.renter.avatar || undefined} />
                        <AvatarFallback>{selectedDispute.renter.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedDispute.renter.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedDispute.renter.email}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Host</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={selectedDispute.host.avatar || undefined} />
                        <AvatarFallback>{selectedDispute.host.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedDispute.host.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedDispute.host.email}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Dispute Reason */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Dispute Reason
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedDispute.dispute_reason || 'No reason provided'}</p>
                  </CardContent>
                </Card>

                {/* Damage Photos */}
                {selectedDispute.damage_photos?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Damage Photos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-2">
                        {selectedDispute.damage_photos.map((photo, index) => (
                          <div key={index} className="aspect-square bg-muted rounded overflow-hidden">
                            <img src={photo} alt={`Damage ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Communication Thread */}
                {selectedDispute.messages?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Communication Thread
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {selectedDispute.messages.map((msg) => (
                          <div key={msg.id} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">
                                {msg.sender}
                                <Badge variant="outline" className="ml-2 text-xs capitalize">
                                  {msg.sender_role}
                                </Badge>
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(msg.created_at)}
                              </span>
                            </div>
                            <p className="text-sm">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Admin Notes */}
                {selectedDispute.admin_notes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Admin Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedDispute.admin_notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter className="mt-6">
                {selectedDispute.stripe_dispute_id && (
                  <Button variant="outline" asChild>
                    <a 
                      href={`https://dashboard.stripe.com/disputes/${selectedDispute.stripe_dispute_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View in Stripe
                    </a>
                  </Button>
                )}
                <Button
                  className="bg-[#CC0000] hover:bg-[#CC0000]/90"
                  onClick={() => setResolveOpen(true)}
                >
                  Resolve Dispute
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolution Dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Choose how to resolve this dispute. Refunds will be processed through Stripe.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <RadioGroup value={resolution} onValueChange={setResolution}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="refund_renter" id="refund_renter" />
                <Label htmlFor="refund_renter" className="flex-1 cursor-pointer">
                  <span className="font-medium">Full Refund to Renter</span>
                  <p className="text-sm text-muted-foreground">
                    Refund {formatCurrency(selectedDispute?.total_amount || 0)} to the renter
                  </p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="pay_host" id="pay_host" />
                <Label htmlFor="pay_host" className="flex-1 cursor-pointer">
                  <span className="font-medium">Pay Host in Full</span>
                  <p className="text-sm text-muted-foreground">
                    No refund - host receives full payment
                  </p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="split" id="split" />
                <Label htmlFor="split" className="flex-1 cursor-pointer">
                  <span className="font-medium">Split / Partial Refund</span>
                  <p className="text-sm text-muted-foreground">
                    Specify a custom refund amount
                  </p>
                </Label>
              </div>
            </RadioGroup>

            {resolution === 'split' && (
              <div className="space-y-2">
                <Label htmlFor="refund_amount">Refund Amount to Renter</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="refund_amount"
                    type="number"
                    placeholder="0.00"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="pl-10"
                    max={selectedDispute?.total_amount}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin_note">Admin Note (Internal)</Label>
              <Textarea
                id="admin_note"
                placeholder="Document your decision..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#CC0000] hover:bg-[#CC0000]/90"
              onClick={resolveDispute}
              disabled={processing || (resolution === 'split' && !refundAmount)}
            >
              {processing ? 'Processing...' : 'Confirm Resolution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
