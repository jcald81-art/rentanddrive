'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Loader2,
  Search,
  Mail
} from 'lucide-react'
import Image from 'next/image'

interface Verification {
  id: string
  user_id: string
  license_front_url: string
  license_back_url: string
  license_number: string
  license_state: string
  license_expiry: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  created_at: string
  reviewed_at: string | null
  user_email: string
  user_name: string
}

export default function VerificationsDashboard() {
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchVerifications()
  }, [])

  async function fetchVerifications() {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('driver_verifications')
      .select(`
        *,
        profiles:user_id (
          full_name
        )
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      // Get user emails from auth.users via a separate query
      const userIds = data.map(v => v.user_id)
      
      const mappedData = data.map(v => ({
        ...v,
        user_email: v.user_id, // Placeholder - would need admin API for real email
        user_name: v.profiles?.full_name || 'Unknown User',
      }))
      
      setVerifications(mappedData)
    }
    setLoading(false)
  }

  async function handleApprove(verification: Verification) {
    setProcessing(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('driver_verifications')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', verification.id)

    if (!error) {
      // Update profiles table
      await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', verification.user_id)

      // Send approval email via API
      await fetch('/api/notifications/verification-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: verification.user_id,
          status: 'approved',
        }),
      })

      fetchVerifications()
      setSelectedVerification(null)
    }
    setProcessing(false)
  }

  async function handleReject() {
    if (!selectedVerification || !rejectionReason) return
    setProcessing(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('driver_verifications')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', selectedVerification.id)

    if (!error) {
      // Send rejection email via API
      await fetch('/api/notifications/verification-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedVerification.user_id,
          status: 'rejected',
          reason: rejectionReason,
        }),
      })

      fetchVerifications()
      setSelectedVerification(null)
      setShowRejectModal(false)
      setRejectionReason('')
    }
    setProcessing(false)
  }

  const filteredVerifications = verifications.filter(v =>
    v.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.license_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.license_state.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pendingCount = verifications.filter(v => v.status === 'pending').length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#CC0000]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Driver Verifications</h1>
            <p className="text-muted-foreground">
              Review and approve driver license verifications
            </p>
          </div>
          {pendingCount > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 text-lg px-4 py-2">
              {pendingCount} Pending Review
            </Badge>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Verifications</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, license..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVerifications.map((verification) => (
                  <TableRow key={verification.id}>
                    <TableCell className="font-medium">
                      {verification.user_name}
                    </TableCell>
                    <TableCell className="font-mono">
                      {verification.license_number}
                    </TableCell>
                    <TableCell>{verification.license_state}</TableCell>
                    <TableCell>
                      {new Date(verification.license_expiry).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(verification.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {verification.status === 'pending' && (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      {verification.status === 'approved' && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                      )}
                      {verification.status === 'rejected' && (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejected
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVerification(verification)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredVerifications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No verifications found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail Modal */}
        <Dialog open={!!selectedVerification && !showRejectModal} onOpenChange={() => setSelectedVerification(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Verification Details</DialogTitle>
              <DialogDescription>
                Review the driver&apos;s license photos and information
              </DialogDescription>
            </DialogHeader>
            
            {selectedVerification && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">License Front</Label>
                    <div className="mt-2 relative aspect-[1.6/1] border rounded-lg overflow-hidden">
                      <Image
                        src={selectedVerification.license_front_url}
                        alt="License front"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">License Back</Label>
                    <div className="mt-2 relative aspect-[1.6/1] border rounded-lg overflow-hidden">
                      <Image
                        src={selectedVerification.license_back_url}
                        alt="License back"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    <p className="font-medium">{selectedVerification.user_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">License Number</Label>
                    <p className="font-mono font-medium">{selectedVerification.license_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">State</Label>
                    <p className="font-medium">{selectedVerification.license_state}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Expiry</Label>
                    <p className="font-medium">
                      {new Date(selectedVerification.license_expiry).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedVerification.status === 'rejected' && selectedVerification.rejection_reason && (
                  <div className="p-4 bg-destructive/10 rounded-lg">
                    <Label className="text-sm text-destructive">Rejection Reason</Label>
                    <p className="mt-1">{selectedVerification.rejection_reason}</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              {selectedVerification?.status === 'pending' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectModal(true)}
                    disabled={processing}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedVerification)}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </>
              )}
              {selectedVerification?.status !== 'pending' && (
                <Button variant="outline" onClick={() => setSelectedVerification(null)}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Modal */}
        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Verification</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting this verification. The user will be notified.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Rejection Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="e.g., License photo is blurry, License is expired..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason || processing}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Reject & Notify User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
