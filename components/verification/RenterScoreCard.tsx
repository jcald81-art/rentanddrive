"use client"

import { useState, useEffect } from "react"
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface ScoreBreakdown {
  category: string
  points: number
  maxPoints: number
  details: string
}

interface VerificationStatus {
  status: string
  score: number | null
  tier: string | null
  recommendation: string | null
  breakdown: ScoreBreakdown[] | null
  stripeStatus: string | null
  checkrStatus: string | null
  mvrStatus: string | null
  isUnder25: boolean
  under25Surcharge: number
  verifiedAt: string | null
  expiresAt: string | null
  blockReason: string | null
  appealSubmitted: boolean
}

const TIER_CONFIG = {
  green: {
    label: "Excellent",
    color: "bg-green-500",
    textColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: CheckCircle,
    description: "Instant approval for all vehicles",
  },
  yellow: {
    label: "Good",
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: Shield,
    description: "Standard approval, some hosts may require additional review",
  },
  red: {
    label: "Review Required",
    color: "bg-orange-500",
    textColor: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    icon: AlertTriangle,
    description: "Manual review required for each booking request",
  },
  auto_deny: {
    label: "Not Eligible",
    color: "bg-red-500",
    textColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: XCircle,
    description: "Unable to rent at this time",
  },
}

export function RenterScoreCard() {
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [breakdownOpen, setBreakdownOpen] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    try {
      const res = await fetch("/api/verify/status")
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      console.error("Failed to fetch verification status:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    )
  }

  if (!status || status.status === "not_started") {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-400" />
            Driver Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">Complete your driver verification to unlock vehicle rentals.</p>
          <Button asChild className="bg-[#CC0000] hover:bg-[#AA0000]">
            <a href="/renter/verify">Start Verification</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Pending states
  if (status.status === "pending" || status.status === "processing") {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Verification In Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>License Verification</span>
              <Badge variant={status.stripeStatus === "verified" ? "default" : "secondary"}>
                {status.stripeStatus === "verified" ? "Complete" : "Pending"}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Driving Record Check</span>
              <Badge variant={status.mvrStatus === "complete" ? "default" : "secondary"}>
                {status.mvrStatus === "complete" ? "Complete" : "Processing (24-48 hrs)"}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-blue-700">We&apos;ll notify you as soon as your verification is complete.</p>
        </CardContent>
      </Card>
    )
  }

  // Blocked/Denied states
  if (status.status === "auto_denied" || status.status === "soft_blocked") {
    const tierConfig = TIER_CONFIG[status.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.auto_deny

    return (
      <Card className={`border ${tierConfig.borderColor} ${tierConfig.bgColor}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <tierConfig.icon className={`h-5 w-5 ${tierConfig.textColor}`} />
            <span className={tierConfig.textColor}>{tierConfig.label}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className={`text-sm ${tierConfig.textColor}`}>{status.blockReason || tierConfig.description}</p>

          {!status.appealSubmitted && (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                If you believe this is an error, you may submit an appeal with additional documentation.
              </p>
              <Button variant="outline" asChild>
                <a href="/renter/verify/appeal">Submit Appeal</a>
              </Button>
            </div>
          )}

          {status.appealSubmitted && (
            <Badge variant="secondary">Appeal Under Review</Badge>
          )}
        </CardContent>
      </Card>
    )
  }

  // Verified state with score
  const tierConfig = TIER_CONFIG[status.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.green
  const TierIcon = tierConfig.icon

  return (
    <Card className={`border ${tierConfig.borderColor}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TierIcon className={`h-5 w-5 ${tierConfig.textColor}`} />
            RAD Rentability Score
          </CardTitle>
          <Badge className={`${tierConfig.color} text-white`}>{tierConfig.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Display */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle cx="40" cy="40" r="35" stroke="#e5e7eb" strokeWidth="6" fill="none" />
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke={status.score && status.score >= 80 ? "#22c55e" : status.score && status.score >= 60 ? "#eab308" : "#f97316"}
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${((status.score || 0) / 100) * 220} 220`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{status.score || 0}</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-600">{tierConfig.description}</p>
            {status.isUnder25 && (
              <p className="text-xs text-orange-600 mt-1">Under-25 surcharge: ${status.under25Surcharge}/day</p>
            )}
          </div>
        </div>

        {/* Score Breakdown */}
        {status.breakdown && status.breakdown.length > 0 && (
          <Collapsible open={breakdownOpen} onOpenChange={setBreakdownOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span>Score Breakdown</span>
                {breakdownOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {status.breakdown.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.category}</span>
                    <span className="font-medium">
                      {item.points}/{item.maxPoints}
                    </span>
                  </div>
                  <Progress value={(item.points / item.maxPoints) * 100} className="h-1.5" />
                  <p className="text-xs text-slate-500">{item.details}</p>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Verification Details */}
        <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
          {status.verifiedAt && (
            <p>
              Verified: {new Date(status.verifiedAt).toLocaleDateString()}
            </p>
          )}
          {status.expiresAt && (
            <p>
              Expires: {new Date(status.expiresAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
