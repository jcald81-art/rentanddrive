'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, AlertTriangle, Shield, Car, FileSearch, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface ReportOption {
  type: 'basic' | 'premium' | 'bundle'
  name: string
  price: string
  priceCents: number
  features: string[]
  popular?: boolean
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    type: 'basic',
    name: 'Basic History',
    price: '$9.99',
    priceCents: 999,
    features: ['Accident history', 'Title check', 'Theft records'],
  },
  {
    type: 'premium',
    name: 'Premium Report',
    price: '$19.99',
    priceCents: 1999,
    features: ['Everything in Basic', 'Market value', 'Ownership history', 'Odometer check'],
    popular: true,
  },
  {
    type: 'bundle',
    name: 'Full Bundle',
    price: '$29.99',
    priceCents: 2999,
    features: ['Everything in Premium', 'Open recalls', 'Detailed specs', 'Lien check'],
  },
]

interface VinReportSummary {
  is_clean: boolean
  accident_count: number
  title_status: string
  theft_record: boolean
  odometer_rollback: boolean
  last_reported_mileage: number | null
  owner_count: number | null
  recall_count: number
  market_value?: { base: number; low: number; high: number }
  specifications?: Record<string, string>
  flags: {
    has_accidents: boolean
    has_salvage_title: boolean
    has_theft_record: boolean
    has_odometer_rollback: boolean
    has_open_recalls: boolean
    has_active_liens: boolean
  }
}

interface VinCheckWidgetProps {
  vin: string
  vehicleId?: string
  userId?: string
  onReportComplete?: (report: VinReportSummary) => void
  existingReport?: VinReportSummary | null
}

function CheckoutForm({ 
  clientSecret, 
  onSuccess, 
  onCancel 
}: { 
  clientSecret: string
  onSuccess: (paymentIntentId: string) => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsLoading(true)
    setError(null)

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    })

    if (submitError) {
      setError(submitError.message || 'Payment failed')
      setIsLoading(false)
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent.id)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isLoading} className="flex-1">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Pay Now
        </Button>
      </div>
    </form>
  )
}

function ReportResults({ summary }: { summary: VinReportSummary }) {
  const StatusItem = ({ 
    label, 
    isGood, 
    value 
  }: { 
    label: string
    isGood: boolean
    value: string 
  }) => (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {isGood ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-red-600" />
        )}
        <span className={cn(
          "text-sm font-medium",
          isGood ? "text-green-600" : "text-red-600"
        )}>
          {value}
        </span>
      </div>
    </div>
  )

  return (
    <Card className={cn(
      "border-2",
      summary.is_clean ? "border-green-500" : "border-amber-500"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {summary.is_clean ? (
            <Shield className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          )}
          <CardTitle className="text-lg">
            {summary.is_clean ? 'Clean History' : 'Issues Found'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-0">
        <StatusItem 
          label="Accident History" 
          isGood={summary.accident_count === 0}
          value={summary.accident_count === 0 ? 'None found' : `${summary.accident_count} reported`}
        />
        <StatusItem 
          label="Title Status" 
          isGood={summary.title_status === 'clean'}
          value={summary.title_status === 'clean' ? 'Clean title' : 'Salvage/Rebuilt'}
        />
        <StatusItem 
          label="Theft Record" 
          isGood={!summary.theft_record}
          value={summary.theft_record ? 'Record found' : 'No record'}
        />
        <StatusItem 
          label="Odometer" 
          isGood={!summary.odometer_rollback}
          value={summary.odometer_rollback ? 'Rollback detected' : 'Verified'}
        />
        {summary.last_reported_mileage && (
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Last Mileage</span>
            <span className="text-sm font-medium">
              {summary.last_reported_mileage.toLocaleString()} miles
            </span>
          </div>
        )}
        {summary.owner_count !== null && (
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Previous Owners</span>
            <span className="text-sm font-medium">{summary.owner_count}</span>
          </div>
        )}
        {summary.recall_count > 0 && (
          <StatusItem 
            label="Open Recalls" 
            isGood={false}
            value={`${summary.recall_count} active`}
          />
        )}
        {summary.market_value && (
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">Market Value</span>
            <span className="text-sm font-medium text-primary">
              ${summary.market_value.low.toLocaleString()} - ${summary.market_value.high.toLocaleString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function VinCheckWidget({ 
  vin, 
  vehicleId, 
  userId, 
  onReportComplete,
  existingReport 
}: VinCheckWidgetProps) {
  const [selectedType, setSelectedType] = useState<ReportOption['type'] | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [report, setReport] = useState<VinReportSummary | null>(existingReport || null)
  const [error, setError] = useState<string | null>(null)

  const handleSelectReport = async (type: ReportOption['type']) => {
    setSelectedType(type)
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/vin-check/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vin,
          report_type: type,
          vehicle_id: vehicleId,
          user_id: userId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment')
      }

      setClientSecret(data.clientSecret)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSelectedType(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setIsLoading(true)
    setClientSecret(null)

    try {
      const response = await fetch('/api/vin-check/payment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get report')
      }

      setReport(data.summary)
      onReportComplete?.(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve report')
    } finally {
      setIsLoading(false)
      setSelectedType(null)
    }
  }

  if (report) {
    return <ReportResults summary={report} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Car className="h-4 w-4" />
        <span>VIN: {vin}</span>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {clientSecret && selectedType ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSearch className="h-5 w-5" />
              Complete Purchase
            </CardTitle>
            <CardDescription>
              {REPORT_OPTIONS.find(o => o.type === selectedType)?.name} - {REPORT_OPTIONS.find(o => o.type === selectedType)?.price}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm 
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onCancel={() => {
                  setClientSecret(null)
                  setSelectedType(null)
                }}
              />
            </Elements>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {REPORT_OPTIONS.map((option) => (
            <Card 
              key={option.type}
              className={cn(
                "relative cursor-pointer transition-all hover:border-primary",
                option.popular && "border-primary"
              )}
              onClick={() => !isLoading && handleSelectReport(option.type)}
            >
              {option.popular && (
                <Badge className="absolute -top-2 right-4 bg-primary">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{option.name}</CardTitle>
                <div className="text-2xl font-bold text-primary">{option.price}</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {option.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full mt-4" 
                  disabled={isLoading && selectedType === option.type}
                  variant={option.popular ? 'default' : 'outline'}
                >
                  {isLoading && selectedType === option.type ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Get Report'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        Verified vehicles earn up to 30% more bookings. Reports powered by VinAudit.
      </p>
    </div>
  )
}
