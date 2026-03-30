'use client'

import { useState, useEffect } from 'react'
import { Shield, CheckCircle2, AlertTriangle, Clock, Download, Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Inspection {
  id: string
  date: string
  renterName: string
  vehicleName: string
  prePhotos: number
  postPhotos: number
  result: 'clean' | 'damage' | 'disputed' | 'resolved'
  flaggedAngles?: { angle: string; confidence: number; description: string }[]
  timeline?: { event: string; timestamp: string }[]
}

const MOCK_INSPECTIONS: Inspection[] = [
  {
    id: '1',
    date: '2026-03-28',
    renterName: 'Sarah Johnson',
    vehicleName: '2023 Toyota 4Runner',
    prePhotos: 6,
    postPhotos: 6,
    result: 'clean',
    timeline: [
      { event: 'Pre-inspection submitted', timestamp: '2026-03-25 10:30 AM' },
      { event: 'Post-inspection submitted', timestamp: '2026-03-28 4:15 PM' },
      { event: 'AI analysis complete', timestamp: '2026-03-28 4:15 PM' },
      { event: 'No damage detected', timestamp: '2026-03-28 4:15 PM' },
    ],
  },
  {
    id: '2',
    date: '2026-03-27',
    renterName: 'Mike Chen',
    vehicleName: '2022 Subaru Outback',
    prePhotos: 6,
    postPhotos: 6,
    result: 'damage',
    flaggedAngles: [
      { angle: 'Rear Bumper', confidence: 0.87, description: 'New scratch detected on bumper' },
    ],
    timeline: [
      { event: 'Pre-inspection submitted', timestamp: '2026-03-24 9:00 AM' },
      { event: 'Post-inspection submitted', timestamp: '2026-03-27 6:30 PM' },
      { event: 'AI analysis complete', timestamp: '2026-03-27 6:31 PM' },
      { event: 'Damage detected - Host notified', timestamp: '2026-03-27 6:31 PM' },
    ],
  },
  {
    id: '3',
    date: '2026-03-26',
    renterName: 'Emily Davis',
    vehicleName: '2023 Jeep Wrangler',
    prePhotos: 6,
    postPhotos: 6,
    result: 'disputed',
    flaggedAngles: [
      { angle: 'Driver Side', confidence: 0.72, description: 'Possible new dent on door' },
    ],
    timeline: [
      { event: 'Pre-inspection submitted', timestamp: '2026-03-22 11:00 AM' },
      { event: 'Post-inspection submitted', timestamp: '2026-03-26 2:00 PM' },
      { event: 'Damage flagged', timestamp: '2026-03-26 2:01 PM' },
      { event: 'Renter disputed finding', timestamp: '2026-03-26 2:15 PM' },
      { event: 'Under review', timestamp: '2026-03-26 2:15 PM' },
    ],
  },
  {
    id: '4',
    date: '2026-03-20',
    renterName: 'James Wilson',
    vehicleName: '2021 Ford F-150',
    prePhotos: 6,
    postPhotos: 6,
    result: 'resolved',
    flaggedAngles: [
      { angle: 'Front Bumper', confidence: 0.91, description: 'Crack in bumper cover' },
    ],
    timeline: [
      { event: 'Damage detected', timestamp: '2026-03-20 5:00 PM' },
      { event: 'Claim filed', timestamp: '2026-03-20 5:30 PM' },
      { event: 'Security deposit applied', timestamp: '2026-03-21 10:00 AM' },
      { event: 'Resolved - $450 collected', timestamp: '2026-03-22 2:00 PM' },
    ],
  },
]

const STATS = {
  totalInspections: 47,
  cleanReturns: 44,
  damageClaims: 3,
  disputesWon: 2,
}

function getResultBadge(result: Inspection['result']) {
  switch (result) {
    case 'clean':
      return <Badge className="bg-[#22C55E]/20 text-[#22C55E] border-[#22C55E]/30">Clean</Badge>
    case 'damage':
      return <Badge className="bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30">Damage Detected</Badge>
    case 'disputed':
      return <Badge className="bg-[#FFD84D]/20 text-[#FFD84D] border-[#FFD84D]/30">Disputed</Badge>
    case 'resolved':
      return <Badge className="bg-muted text-muted-foreground">Resolved</Badge>
  }
}

function InspectionDetailModal({ inspection }: { inspection: Inspection }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          View Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" title={`Inspection Report - ${inspection.vehicleName}`}>
        <DialogHeader>
          <DialogTitle>Inspection Report — {inspection.vehicleName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {/* Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Renter:</span>
              <span className="ml-2 font-medium">{inspection.renterName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Date:</span>
              <span className="ml-2 font-mono">{inspection.date}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className="ml-2">{getResultBadge(inspection.result)}</span>
            </div>
          </div>

          {/* 6-Panel Before/After Grid */}
          <div>
            <h4 className="font-semibold mb-3">Photo Comparison</h4>
            <div className="grid grid-cols-3 gap-3">
              {['Front', 'Rear', 'Driver Side', 'Passenger Side', 'Interior', 'Odometer'].map((angle) => (
                <div key={angle} className="border border-border rounded-lg overflow-hidden">
                  <div className="p-2 bg-muted/50 text-xs font-medium text-center">{angle}</div>
                  <div className="grid grid-cols-2 gap-px bg-border">
                    <div className="bg-muted aspect-square flex items-center justify-center text-xs text-muted-foreground">
                      Before
                    </div>
                    <div className="bg-muted aspect-square flex items-center justify-center text-xs text-muted-foreground">
                      After
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Analysis Notes */}
          {inspection.flaggedAngles && inspection.flaggedAngles.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-[#EF4444]">AI Analysis Notes</h4>
              <div className="space-y-2">
                {inspection.flaggedAngles.map((flagged, idx) => (
                  <div key={idx} className="p-3 bg-[#EF4444]/10 rounded-lg border border-[#EF4444]/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{flagged.angle}</span>
                      <span className="text-sm font-mono text-[#EF4444]">
                        {Math.round(flagged.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{flagged.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {inspection.timeline && (
            <div>
              <h4 className="font-semibold mb-3">Timeline</h4>
              <div className="space-y-3">
                {inspection.timeline.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#FFD84D] mt-2" />
                    <div>
                      <p className="text-sm font-medium">{item.event}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download Button */}
          <div className="flex justify-end pt-4 border-t border-border">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download Report PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function HostInspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])

  useEffect(() => {
    // Stub: fetch inspections from API
    setInspections(MOCK_INSPECTIONS)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-lg bg-[#FFD84D]/10">
            <Shield className="h-6 w-6 text-[#FFD84D]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">DriveShield Inspections</h1>
            <p className="text-muted-foreground">AI-powered damage detection for your fleet</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-muted/20 border-muted">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Inspections</p>
              <p className="text-3xl font-bold font-mono">{STATS.totalInspections}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#22C55E]/10 border-[#22C55E]/20">
            <CardContent className="pt-6">
              <p className="text-sm text-[#22C55E]">Clean Returns</p>
              <p className="text-3xl font-bold font-mono text-[#22C55E]">{STATS.cleanReturns}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#EF4444]/10 border-[#EF4444]/20">
            <CardContent className="pt-6">
              <p className="text-sm text-[#EF4444]">Damage Claims</p>
              <p className="text-3xl font-bold font-mono text-[#EF4444]">{STATS.damageClaims}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/20 border-muted">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Disputes Won</p>
              <p className="text-3xl font-bold font-mono">{STATS.disputesWon}</p>
            </CardContent>
          </Card>
        </div>

        {/* Inspections Table */}
        <Card className="bg-muted/10 border-muted">
          <CardHeader>
            <CardTitle>Recent Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Renter</th>
                    <th className="pb-3 font-medium">Vehicle</th>
                    <th className="pb-3 font-medium text-center">Pre</th>
                    <th className="pb-3 font-medium text-center">Post</th>
                    <th className="pb-3 font-medium">Result</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {inspections.map((inspection) => (
                    <tr key={inspection.id} className="border-b border-border/50">
                      <td className="py-4 font-mono">{inspection.date}</td>
                      <td className="py-4">{inspection.renterName}</td>
                      <td className="py-4">{inspection.vehicleName}</td>
                      <td className="py-4 text-center">
                        <Badge variant="outline" className="font-mono">
                          {inspection.prePhotos}/6
                        </Badge>
                      </td>
                      <td className="py-4 text-center">
                        <Badge variant="outline" className="font-mono">
                          {inspection.postPhotos}/6
                        </Badge>
                      </td>
                      <td className="py-4">{getResultBadge(inspection.result)}</td>
                      <td className="py-4 text-right">
                        <InspectionDetailModal inspection={inspection} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
