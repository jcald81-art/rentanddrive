"use client"

import { Shield, AlertTriangle, CheckCircle, XCircle, Info, ThumbsUp, ThumbsDown, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

interface ScoreBreakdown {
  category: string
  points: number
  maxPoints: number
  details: string
}

interface RenterVerification {
  score: number | null
  tier: "green" | "yellow" | "red" | "auto_deny" | null
  recommendation: string | null
  breakdown: ScoreBreakdown[] | null
  isUnder25: boolean
  under25Surcharge: number
  yearsLicensed: number | null
  completedTrips: number
  verifiedAt: string | null
  flags: string[]
}

interface HostScorePanelProps {
  renterName: string
  renterVerification: RenterVerification
  vehicleValue: number // For risk assessment context
  onApprove: () => void
  onDecline: () => void
  onRequestMore: () => void
  loading?: boolean
}

const TIER_CONFIG = {
  green: {
    label: "Low Risk",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: CheckCircle,
    hostMessage: "This renter has an excellent driving history. Recommended for approval.",
  },
  yellow: {
    label: "Medium Risk",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: Shield,
    hostMessage: "This renter has a generally good record with some minor items. Review flags before approving.",
  },
  red: {
    label: "Higher Risk",
    color: "bg-orange-500",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    icon: AlertTriangle,
    hostMessage: "This renter has some concerns in their driving history. Careful review recommended.",
  },
  auto_deny: {
    label: "High Risk",
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: XCircle,
    hostMessage: "This renter does not meet minimum requirements. Decline recommended.",
  },
}

export function HostScorePanel({
  renterName,
  renterVerification,
  vehicleValue,
  onApprove,
  onDecline,
  onRequestMore,
  loading,
}: HostScorePanelProps) {
  const tier = renterVerification.tier || "yellow"
  const config = TIER_CONFIG[tier]
  const TierIcon = config.icon

  // Risk assessment based on vehicle value
  const isHighValueVehicle = vehicleValue >= 50000
  const showHighValueWarning = isHighValueVehicle && (tier === "yellow" || tier === "red")

  return (
    <Card className={`border-2 ${config.borderColor}`}>
      <CardHeader className={`${config.bgColor} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TierIcon className={`h-5 w-5 ${config.textColor}`} />
            <span className={config.textColor}>Renter Risk Assessment</span>
          </CardTitle>
          <Badge className={`${config.color} text-white`}>{config.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Renter Summary */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{renterName}</p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              {renterVerification.completedTrips > 0 && (
                <span>{renterVerification.completedTrips} completed trips</span>
              )}
              {renterVerification.yearsLicensed && (
                <span>{renterVerification.yearsLicensed}+ years licensed</span>
              )}
            </div>
          </div>

          {/* Score Circle */}
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="5" fill="none" />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke={tier === "green" ? "#22c55e" : tier === "yellow" ? "#eab308" : tier === "red" ? "#f97316" : "#ef4444"}
                strokeWidth="5"
                fill="none"
                strokeDasharray={`${((renterVerification.score || 0) / 100) * 176} 176`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold">{renterVerification.score || "—"}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Recommendation */}
        <div className={`p-3 rounded-lg ${config.bgColor}`}>
          <p className={`text-sm ${config.textColor}`}>{config.hostMessage}</p>
        </div>

        {/* Flags */}
        {renterVerification.flags && renterVerification.flags.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Items to Consider
            </p>
            <ul className="text-sm text-slate-600 space-y-1 pl-5 list-disc">
              {renterVerification.flags.map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          </div>
        )}

        {/* High Value Warning */}
        {showHighValueWarning && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-700 flex items-center gap-2">
              <Info className="h-4 w-4" />
              High-value vehicle (${vehicleValue.toLocaleString()}). Consider extra caution.
            </p>
          </div>
        )}

        {/* Under 25 Notice */}
        {renterVerification.isUnder25 && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-700">
              Renter is under 25. Under-25 surcharge of ${renterVerification.under25Surcharge}/day will be applied.
            </p>
          </div>
        )}

        {/* Score Breakdown */}
        {renterVerification.breakdown && renterVerification.breakdown.length > 0 && (
          <TooltipProvider>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Score Breakdown</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {renterVerification.breakdown.slice(0, 4).map((item, idx) => (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded cursor-help">
                        <span className="text-slate-600 truncate">{item.category}</span>
                        <span className="font-medium">
                          {item.points}/{item.maxPoints}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{item.details}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </TooltipProvider>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={onDecline} variant="outline" className="flex-1 gap-2" disabled={loading}>
            <ThumbsDown className="h-4 w-4" />
            Decline
          </Button>
          <Button onClick={onRequestMore} variant="outline" className="flex-1 gap-2" disabled={loading}>
            <Clock className="h-4 w-4" />
            Request Info
          </Button>
          <Button
            onClick={onApprove}
            className={`flex-1 gap-2 ${tier === "auto_deny" ? "bg-slate-400" : "bg-green-600 hover:bg-green-700"}`}
            disabled={loading || tier === "auto_deny"}
          >
            <ThumbsUp className="h-4 w-4" />
            Approve
          </Button>
        </div>

        {tier === "auto_deny" && (
          <p className="text-xs text-center text-slate-500">
            This renter does not meet minimum requirements. Contact support if you believe this is an error.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
