'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, AlertCircle, AlertTriangle, Info, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RecallBadge } from './recall-badge'
import { cn } from '@/lib/utils'

interface Recall {
  nhtsa_campaign_id: string
  component: string
  summary: string
  consequence: string
  remedy: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  is_open: boolean
  recall_date: string
  manufacturer: string
}

interface Complaint {
  component: string
  total_complaints: number
  sample_complaints: Array<{
    summary: string
    date: string
    crash: boolean
    injury: boolean
  }>
}

interface RecallPanelProps {
  vin: string
  vehicleId?: string
  className?: string
}

export function RecallPanel({ vin, vehicleId, className }: RecallPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [recalls, setRecalls] = useState<Recall[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!vin) return
      
      setIsLoading(true)
      setError(null)

      try {
        // Fetch recalls
        const recallsRes = await fetch(`/api/nhtsa/recalls/${vin}`)
        if (recallsRes.ok) {
          const recallsData = await recallsRes.json()
          setRecalls(recallsData.recalls || [])
        }

        // Fetch complaints
        const complaintsRes = await fetch(`/api/nhtsa/complaints/${vin}`)
        if (complaintsRes.ok) {
          const complaintsData = await complaintsRes.json()
          setComplaints(complaintsData.top_components || [])
        }
      } catch (err) {
        setError('Failed to load safety data')
        console.error('[RecallPanel] Error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [vin])

  const severityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const severityBg = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-50 border-red-200'
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  const criticalCount = recalls.filter(r => r.severity === 'CRITICAL').length
  const warningCount = recalls.filter(r => r.severity === 'WARNING').length
  const infoCount = recalls.filter(r => r.severity === 'INFO').length
  const highestSeverity = criticalCount > 0 ? 'CRITICAL' : warningCount > 0 ? 'WARNING' : infoCount > 0 ? 'INFO' : null

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Safety & Recall History</CardTitle>
            <RecallBadge severity={highestSeverity} recallCount={recalls.length} showTooltip={false} size="sm" />
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {!isExpanded && recalls.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {recalls.length} recall{recalls.length > 1 ? 's' : ''} found - click to see details
          </p>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Recalls Section */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              NHTSA Recalls ({recalls.length})
            </h4>
            
            {recalls.length === 0 ? (
              <div className="bg-green-50 text-green-800 p-4 rounded-lg text-sm">
                No open recalls found for this vehicle. This VIN has been verified against the NHTSA database.
              </div>
            ) : (
              <div className="space-y-3">
                {recalls.map((recall, index) => (
                  <div 
                    key={recall.nhtsa_campaign_id || index}
                    className={cn('p-4 rounded-lg border', severityBg(recall.severity))}
                  >
                    <div className="flex items-start gap-3">
                      {severityIcon(recall.severity)}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{recall.component}</span>
                          <Badge variant="outline" className="text-xs">
                            {recall.is_open ? 'Open' : 'Completed'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{recall.summary}</p>
                        
                        {recall.consequence && (
                          <div className="text-sm">
                            <span className="font-medium">Risk: </span>
                            <span className="text-muted-foreground">{recall.consequence}</span>
                          </div>
                        )}
                        
                        {recall.remedy && (
                          <div className="text-sm">
                            <span className="font-medium">Fix: </span>
                            <span className="text-muted-foreground">{recall.remedy}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>Date: {recall.recall_date || 'N/A'}</span>
                          {recall.nhtsa_campaign_id && (
                            <a 
                              href={`https://www.nhtsa.gov/recalls?nhtsaId=${recall.nhtsa_campaign_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              NHTSA: {recall.nhtsa_campaign_id}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Complaints Section */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Top Owner Complaints
            </h4>
            
            {complaints.length === 0 ? (
              <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
                No significant complaints reported for this vehicle model.
              </div>
            ) : (
              <div className="space-y-3">
                {complaints.slice(0, 5).map((complaint, index) => (
                  <div key={index} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{complaint.component}</span>
                      <Badge variant="secondary" className="text-xs">
                        {complaint.total_complaints} complaints
                      </Badge>
                    </div>
                    {complaint.sample_complaints.length > 0 && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {complaint.sample_complaints[0].summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2 border-t">
            Data provided by NHTSA (National Highway Traffic Safety Administration)
          </p>
        </CardContent>
      )}
    </Card>
  )
}
