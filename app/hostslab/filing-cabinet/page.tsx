'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  FolderArchive,
  Search,
  Download,
  Share2,
  FileText,
  Shield,
  ClipboardCheck,
  Car,
  AlertTriangle,
  UserCheck,
  ExternalLink,
  Calendar,
  Eye,
} from 'lucide-react'

interface Document {
  id: string
  name: string
  type: string
  vehicle?: { make: string; model: string; year: number }
  created_at: string
  expires_at?: string
  status?: string
  url?: string
}

export default function FilingCabinetPage() {
  const [search, setSearch] = useState('')
  const [insurancePolicies, setInsurancePolicies] = useState<Document[]>([])
  const [inspections, setInspections] = useState<Document[]>([])
  const [tripRecords, setTripRecords] = useState<Document[]>([])
  const [vinReports, setVinReports] = useState<Document[]>([])
  const [recalls, setRecalls] = useState<Document[]>([])
  const [verifications, setVerifications] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/hostslab/documents/insurance').then(r => r.json()),
      fetch('/api/hostslab/documents/inspections').then(r => r.json()),
      fetch('/api/hostslab/documents/trips').then(r => r.json()),
      fetch('/api/hostslab/documents/vin-reports').then(r => r.json()),
      fetch('/api/hostslab/documents/recalls').then(r => r.json()),
      fetch('/api/hostslab/documents/verifications').then(r => r.json()),
    ])
      .then(([ins, insp, trips, vin, rec, ver]) => {
        if (ins.documents) setInsurancePolicies(ins.documents)
        if (insp.documents) setInspections(insp.documents)
        if (trips.documents) setTripRecords(trips.documents)
        if (vin.documents) setVinReports(vin.documents)
        if (rec.documents) setRecalls(rec.documents)
        if (ver.documents) setVerifications(ver.documents)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isExpiringSoon = (date: string | undefined) => {
    if (!date) return false
    const expiry = new Date(date)
    const now = new Date()
    const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays > 0 && diffDays <= 30
  }

  const isExpired = (date: string | undefined) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  const DocumentCard = ({ doc, type }: { doc: Document; type: string }) => (
    <div className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{doc.name}</span>
          </div>
          {doc.vehicle && (
            <p className="text-sm text-muted-foreground">
              {doc.vehicle.year} {doc.vehicle.make} {doc.vehicle.model}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(doc.created_at)}
            </span>
            {doc.expires_at && (
              <>
                <span>|</span>
                <span className={
                  isExpired(doc.expires_at) ? 'text-red-600' :
                  isExpiringSoon(doc.expires_at) ? 'text-amber-600' : ''
                }>
                  Expires: {formatDate(doc.expires_at)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {doc.status && (
            <Badge className={
              doc.status === 'active' || doc.status === 'valid' ? 'bg-green-500' :
              doc.status === 'pending' ? 'bg-amber-500' :
              doc.status === 'expired' || doc.status === 'open' ? 'bg-red-500' : ''
            }>
              {doc.status}
            </Badge>
          )}
          {isExpiringSoon(doc.expires_at) && !isExpired(doc.expires_at) && (
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              Expiring Soon
            </Badge>
          )}
          {isExpired(doc.expires_at) && (
            <Badge variant="destructive">Expired</Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t">
        <Button variant="outline" size="sm" className="flex-1">
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const filterDocuments = (docs: Document[]) => {
    if (!search) return docs
    const s = search.toLowerCase()
    return docs.filter(d => 
      d.name.toLowerCase().includes(s) ||
      d.vehicle?.make.toLowerCase().includes(s) ||
      d.vehicle?.model.toLowerCase().includes(s)
    )
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Mock data for display
  const mockInsurance = insurancePolicies.length > 0 ? insurancePolicies : [
    { id: '1', name: 'Commercial Auto Policy', type: 'insurance', vehicle: { make: 'Subaru', model: 'Outback', year: 2023 }, created_at: '2024-01-01', expires_at: '2024-12-31', status: 'active' },
    { id: '2', name: 'Commercial Auto Policy', type: 'insurance', vehicle: { make: 'Toyota', model: 'Tacoma', year: 2022 }, created_at: '2024-01-01', expires_at: '2024-02-15', status: 'active' },
  ]

  const mockInspections = inspections.length > 0 ? inspections : [
    { id: '1', name: 'Pre-Rental Inspection', type: 'inspection', vehicle: { make: 'Subaru', model: 'Outback', year: 2023 }, created_at: '2024-01-10', status: 'valid' },
    { id: '2', name: 'Post-Trip Inspection', type: 'inspection', vehicle: { make: 'Toyota', model: 'Tacoma', year: 2022 }, created_at: '2024-01-08', status: 'valid' },
  ]

  const mockTrips = tripRecords.length > 0 ? tripRecords : [
    { id: '1', name: 'Trip Record #1234', type: 'trip', vehicle: { make: 'Subaru', model: 'Outback', year: 2023 }, created_at: '2024-01-12' },
    { id: '2', name: 'Trip Record #1233', type: 'trip', vehicle: { make: 'Tesla', model: 'Model Y', year: 2024 }, created_at: '2024-01-10' },
  ]

  const mockVin = vinReports.length > 0 ? vinReports : [
    { id: '1', name: 'Carfax VIN Report', type: 'vin', vehicle: { make: 'Subaru', model: 'Outback', year: 2023 }, created_at: '2023-12-01', status: 'valid' },
  ]

  const mockRecalls = recalls.length > 0 ? recalls : [
    { id: '1', name: 'NHTSA Recall #24V-123', type: 'recall', vehicle: { make: 'Toyota', model: 'Tacoma', year: 2022 }, created_at: '2024-01-05', status: 'open' },
  ]

  const mockVerifications = verifications.length > 0 ? verifications : [
    { id: '1', name: 'Driver License Verification', type: 'verification', created_at: '2024-01-01', status: 'valid' },
  ]

  const categories = [
    { id: 'insurance', label: 'Insurance Policies', icon: Shield, docs: mockInsurance, count: mockInsurance.length },
    { id: 'inspections', label: 'Inspections', icon: ClipboardCheck, docs: mockInspections, count: mockInspections.length },
    { id: 'trips', label: 'Trip Records', icon: Car, docs: mockTrips, count: mockTrips.length },
    { id: 'vin', label: 'VIN Reports', icon: FileText, docs: mockVin, count: mockVin.length },
    { id: 'recalls', label: 'NHTSA Recalls', icon: AlertTriangle, docs: mockRecalls, count: mockRecalls.length },
    { id: 'verifications', label: 'Driver Verifications', icon: UserCheck, docs: mockVerifications, count: mockVerifications.length },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#CC0000] rounded-lg">
            <FolderArchive className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">The Filing Cabinet</h1>
            <p className="text-muted-foreground">All your documents organized and accessible</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Document Categories */}
      <Tabs defaultValue="insurance">
        <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <TabsTrigger 
                key={cat.id}
                value={cat.id}
                className="data-[state=active]:bg-[#CC0000] data-[state=active]:text-white"
              >
                <Icon className="h-4 w-4 mr-2" />
                {cat.label}
                <Badge variant="secondary" className="ml-2">
                  {cat.count}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-6">
            {filterDocuments(cat.docs).length === 0 ? (
              <Card className="py-12">
                <div className="text-center text-muted-foreground">
                  <FolderArchive className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No documents found</p>
                </div>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterDocuments(cat.docs).map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} type={cat.id} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
