'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Shield, 
  Wrench, 
  Sparkles, 
  Car, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'

interface SafetyStandardsProps {
  onAgree: () => void
  onBack?: () => void
  isLoading?: boolean
}

export function SafetyStandards({ onAgree, onBack, isLoading = false }: SafetyStandardsProps) {
  const [agreed, setAgreed] = useState(false)
  const [acknowledgedItems, setAcknowledgedItems] = useState<Record<string, boolean>>({
    maintenance: false,
    cleanliness: false,
    exclusivity: false,
  })

  const allAcknowledged = Object.values(acknowledgedItems).every(Boolean)

  const toggleItem = (key: string) => {
    setAcknowledgedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const standards = [
    {
      key: 'maintenance',
      icon: Wrench,
      title: 'Vehicle Maintenance',
      description: 'Keep your car well maintained so your guests stay safe on the road. You will be required to pass an annual inspection to list your car.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      key: 'cleanliness',
      icon: Sparkles,
      title: 'Cleanliness & Fuel',
      description: 'Clean and refuel your car before every trip so your guests have an enjoyable experience.',
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
    },
    {
      key: 'exclusivity',
      icon: Car,
      title: 'Platform Exclusivity',
      description: 'To maintain a consistent experience, RentAndDrive asks that you do not list the same car on other sharing platforms while it is active on RAD.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 border-border">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 mx-auto bg-[#CC0000]/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-[#CC0000]" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Safety & Quality Standards
          </CardTitle>
          <CardDescription className="text-base">
            At RAD, we&apos;re committed to providing a safe and high-quality experience for all guests. Please review and acknowledge our standards.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Standards List */}
          <div className="space-y-4">
            {standards.map((standard) => (
              <div 
                key={standard.key}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  acknowledgedItems[standard.key] 
                    ? 'border-green-500 bg-green-500/5' 
                    : 'border-border hover:border-[#CC0000]/30'
                }`}
                onClick={() => toggleItem(standard.key)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${standard.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <standard.icon className={`h-6 w-6 ${standard.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-foreground">{standard.title}</h3>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        acknowledgedItems[standard.key]
                          ? 'border-green-500 bg-green-500'
                          : 'border-muted-foreground/30'
                      }`}>
                        {acknowledgedItems[standard.key] && (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {standard.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-700">Important Notice</p>
                <p className="text-sm text-amber-600 mt-1">
                  Failure to meet these standards may result in reduced visibility, suspension, or removal from the RAD platform. We take guest safety seriously.
                </p>
              </div>
            </div>
          </div>

          {/* Final Agreement */}
          <div 
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              agreed ? 'border-[#CC0000] bg-[#CC0000]/5' : 'border-border'
            }`}
            onClick={() => setAgreed(!agreed)}
          >
            <div className="flex items-center gap-3">
              <Checkbox 
                id="agree" 
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
                className="data-[state=checked]:bg-[#CC0000] data-[state=checked]:border-[#CC0000]"
              />
              <label htmlFor="agree" className="text-sm font-medium text-foreground cursor-pointer">
                I have read and agree to RAD&apos;s Safety & Quality Standards. I understand that my listing may be removed if I fail to maintain these standards.
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onBack && (
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                Back
              </Button>
            )}
            <Button
              onClick={onAgree}
              disabled={!allAcknowledged || !agreed || isLoading}
              className="flex-1 bg-[#CC0000] hover:bg-[#CC0000]/90 text-white font-medium h-12"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Agree and Continue
                </>
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to uphold RAD&apos;s commitment to safety and quality.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
