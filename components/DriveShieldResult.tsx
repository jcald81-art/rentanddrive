'use client'

import { useState } from 'react'
import { CheckCircle2, AlertTriangle, Clock, Shield, Download, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface FlaggedAngle {
  angle: string
  confidence: number
  description: string
  preImageUrl?: string
  postImageUrl?: string
}

interface DriveShieldResultProps {
  clean: boolean
  flaggedAngles: FlaggedAngle[]
  analyzedAt: string
  onDispute?: () => void
  onAccept?: () => void
  disputed?: boolean
}

export function DriveShieldResult({
  clean,
  flaggedAngles,
  analyzedAt,
  onDispute,
  onAccept,
  disputed = false,
}: DriveShieldResultProps) {
  const [isDisputing, setIsDisputing] = useState(false)

  const formattedDate = new Date(analyzedAt).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  // DISPUTED STATE
  if (disputed) {
    return (
      <Card className="border-muted bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4 p-4 bg-muted rounded-lg">
            <Clock className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="font-semibold text-foreground">Dispute Submitted — Under Review</p>
              <p className="text-sm text-muted-foreground">
                Our team is reviewing your dispute. Average resolution time: 24-48 hours.
              </p>
            </div>
          </div>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">Need help?</p>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // CLEAN STATE
  if (clean) {
    return (
      <Card className="border-[#22C55E]/30 bg-[#22C55E]/5">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="mb-4 inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#22C55E]/20">
              <CheckCircle2 className="h-10 w-10 text-[#22C55E]" />
            </div>
            <h3 className="text-2xl font-bold text-[#22C55E] mb-2">No New Damage Detected</h3>
            <p className="text-muted-foreground mb-4">
              DriveShield analysis complete — all 6 angles compared
            </p>
            <Badge variant="outline" className="font-mono text-xs">
              Analyzed {formattedDate}
            </Badge>
          </div>
          <div className="flex justify-center pt-4 border-t border-border">
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-2" />
              View Full Report
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // DAMAGE DETECTED STATE
  return (
    <Card className="border-[#EF4444]/30 bg-[#EF4444]/5">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 p-4 bg-[#EF4444]/10 rounded-lg border border-[#EF4444]/20">
          <AlertTriangle className="h-6 w-6 text-[#EF4444]" />
          <div>
            <p className="font-semibold text-[#EF4444]">Potential New Damage Detected</p>
            <p className="text-sm text-muted-foreground">
              {flaggedAngles.length} angle{flaggedAngles.length > 1 ? 's' : ''} flagged for review
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Flagged Angles Comparison */}
        {flaggedAngles.map((flagged, index) => (
          <div key={index} className="border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-muted/50 border-b border-border">
              <span className="font-semibold">{flagged.angle}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-[#FFD84D]/10 text-[#FFD84D] border-[#FFD84D]/30">
                  Under Review
                </Badge>
                <span className="text-sm font-mono text-[#EF4444]">
                  {Math.round(flagged.confidence * 100)}% confidence
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-0">
              {/* Before Image */}
              <div className="p-4 border-r border-border">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Before</p>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  {flagged.preImageUrl ? (
                    <img
                      src={flagged.preImageUrl}
                      alt={`${flagged.angle} before`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Pre-rental photo</span>
                  )}
                </div>
              </div>
              {/* After Image */}
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">After</p>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-[#EF4444]/30">
                  {flagged.postImageUrl ? (
                    <img
                      src={flagged.postImageUrl}
                      alt={`${flagged.angle} after`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Post-rental photo</span>
                  )}
                </div>
              </div>
            </div>
            <div className="p-3 bg-muted/30 border-t border-border">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">AI Analysis:</span> {flagged.description}
              </p>
            </div>
          </div>
        ))}

        {/* Timestamp */}
        <div className="text-center">
          <Badge variant="outline" className="font-mono text-xs">
            Analyzed {formattedDate}
          </Badge>
        </div>

        {/* Notice */}
        <div className="p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground text-center">
            <Shield className="h-4 w-4 inline mr-1" />
            Host has been notified. Security deposit hold applied.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-[#FFD84D] text-[#FFD84D] hover:bg-[#FFD84D]/10"
            onClick={() => {
              setIsDisputing(true)
              onDispute?.()
            }}
            disabled={isDisputing}
          >
            {isDisputing ? 'Submitting Dispute...' : 'Dispute This Finding'}
          </Button>
          <Button
            className="flex-1 bg-[#EF4444] hover:bg-[#DC2626] text-white"
            onClick={onAccept}
          >
            Accept and Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
