'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, differenceInDays, addDays } from 'date-fns'
import { Calendar as CalendarIcon, Zap, Shield, Clock, TrendingUp, Sparkles, AlertTriangle, Check } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DateRange } from 'react-day-picker'

interface PricingCalculatorProps {
  vehicleId: string
  dailyRate: number
  instantBook: boolean
}

interface AvailabilityStatus {
  available: boolean
  conflictingBookings?: number
  nextAvailable?: string
}

interface RADPricingInsight {
  recommendation: 'good_deal' | 'fair_price' | 'premium_rate'
  message: string
  demandLevel: 'low' | 'medium' | 'high'
  suggestedAction?: string
}

export function PricingCalculator({ vehicleId, dailyRate, instantBook }: PricingCalculatorProps) {
  const router = useRouter()
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), 1),
    to: addDays(new Date(), 4),
  })
  const [availability, setAvailability] = useState<AvailabilityStatus | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [radInsight, setRadInsight] = useState<RADPricingInsight | null>(null)
  const [loadingInsight, setLoadingInsight] = useState(false)

  // Check real-time availability when dates change
  useEffect(() => {
    async function checkAvailability() {
      if (!dateRange?.from || !dateRange?.to) {
        setAvailability(null)
        return
      }

      setCheckingAvailability(true)
      try {
        const res = await fetch('/api/vehicles/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleId,
            startDate: dateRange.from.toISOString(),
            endDate: dateRange.to.toISOString(),
          }),
        })
        if (res.ok) {
          const data = await res.json()
          setAvailability(data)
        }
      } catch (err) {
        console.error('Failed to check availability:', err)
      } finally {
        setCheckingAvailability(false)
      }
    }

    checkAvailability()
  }, [vehicleId, dateRange?.from, dateRange?.to])

  // Fetch RAD AI pricing insight
  useEffect(() => {
    async function fetchRADInsight() {
      if (!dateRange?.from || !dateRange?.to) {
        setRadInsight(null)
        return
      }

      setLoadingInsight(true)
      try {
        const res = await fetch('/api/rad/pricing-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleId,
            dailyRate,
            startDate: dateRange.from.toISOString(),
            endDate: dateRange.to.toISOString(),
          }),
        })
        if (res.ok) {
          const data = await res.json()
          setRadInsight(data)
        }
      } catch (err) {
        console.error('Failed to fetch RAD insight:', err)
      } finally {
        setLoadingInsight(false)
      }
    }

    fetchRADInsight()
  }, [vehicleId, dailyRate, dateRange?.from, dateRange?.to])

  const pricing = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) {
      return null
    }

    const days = differenceInDays(dateRange.to, dateRange.from)
    if (days <= 0) return null

    const subtotal = dailyRate * days
    const cleaningFee = 25
    const platformFee = Math.round(subtotal * 0.1)
    const total = subtotal + cleaningFee + platformFee

    // Estimate Turo price (typically 15-20% higher)
    const turoEstimate = Math.round(total * 1.15)
    const savings = turoEstimate - total

    return {
      days,
      subtotal,
      cleaningFee,
      platformFee,
      total,
      turoEstimate,
      savings,
    }
  }, [dateRange, dailyRate])

  const handleBookNow = () => {
    if (!dateRange?.from || !dateRange?.to) return
    if (availability && !availability.available) return

    const params = new URLSearchParams({
      start_date: format(dateRange.from, 'yyyy-MM-dd'),
      end_date: format(dateRange.to, 'yyyy-MM-dd'),
    })

    router.push(`/book/${vehicleId}?${params.toString()}`)
  }

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-foreground">${dailyRate}</span>
            <span className="text-muted-foreground">/day</span>
          </div>
          {instantBook && (
            <div className="flex items-center gap-1 text-sm text-primary">
              <Zap className="size-4" />
              Instant Book
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal h-auto py-3',
                !dateRange && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-3 size-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Trip dates</span>
                <span className="text-sm font-medium">
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
                      </>
                    ) : (
                      format(dateRange.from, 'MMM d, yyyy')
                    )
                  ) : (
                    'Select dates'
                  )}
                </span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              disabled={{ before: new Date() }}
            />
          </PopoverContent>
        </Popover>

        {/* Real-time Availability Status */}
        {dateRange?.from && dateRange?.to && (
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-lg text-sm",
            checkingAvailability && "bg-muted animate-pulse",
            availability?.available && "bg-green-50 text-green-700 border border-green-200",
            availability && !availability.available && "bg-red-50 text-red-700 border border-red-200"
          )}>
            {checkingAvailability ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span>Checking availability...</span>
              </>
            ) : availability?.available ? (
              <>
                <Check className="size-4" />
                <span>Available for your dates</span>
              </>
            ) : availability ? (
              <>
                <AlertTriangle className="size-4" />
                <span>Not available — {availability.nextAvailable ? `next open: ${availability.nextAvailable}` : 'Try different dates'}</span>
              </>
            ) : null}
          </div>
        )}

        {/* RAD AI Pricing Insight */}
        {dateRange?.from && dateRange?.to && (
          <div className={cn(
            "rounded-lg p-3 border",
            loadingInsight && "bg-muted animate-pulse",
            radInsight?.recommendation === 'good_deal' && "bg-green-50 border-green-200",
            radInsight?.recommendation === 'fair_price' && "bg-blue-50 border-blue-200",
            radInsight?.recommendation === 'premium_rate' && "bg-amber-50 border-amber-200"
          )}>
            {loadingInsight ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="size-4 animate-pulse" />
                <span>RAD is analyzing this rate...</span>
              </div>
            ) : radInsight ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className={cn(
                    "size-4",
                    radInsight.recommendation === 'good_deal' && "text-green-600",
                    radInsight.recommendation === 'fair_price' && "text-blue-600",
                    radInsight.recommendation === 'premium_rate' && "text-amber-600"
                  )} />
                  <span className="text-sm font-medium">RAD Pricing Insight</span>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    radInsight.demandLevel === 'high' && "border-red-300 text-red-600",
                    radInsight.demandLevel === 'medium' && "border-amber-300 text-amber-600",
                    radInsight.demandLevel === 'low' && "border-green-300 text-green-600"
                  )}>
                    <TrendingUp className="size-3 mr-1" />
                    {radInsight.demandLevel} demand
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{radInsight.message}</p>
                {radInsight.suggestedAction && (
                  <p className="text-xs font-medium text-primary">{radInsight.suggestedAction}</p>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Pricing Breakdown */}
        {pricing && (
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                ${dailyRate} x {pricing.days} days
              </span>
              <span className="text-foreground">${pricing.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cleaning fee</span>
              <span className="text-foreground">${pricing.cleaningFee}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform fee (10%)</span>
              <span className="text-foreground">${pricing.platformFee}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${pricing.total}</span>
            </div>

            {/* Savings vs Turo */}
            <div className="mt-3 rounded-md bg-primary/10 p-3">
              <p className="text-center text-sm">
                <span className="font-semibold text-primary">
                  Save ${pricing.savings}
                </span>{' '}
                <span className="text-muted-foreground">vs Turo estimate</span>
              </p>
            </div>
          </div>
        )}

        {!pricing && (
          <p className="text-center text-sm text-muted-foreground">
            Select dates to see pricing
          </p>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-3">
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={handleBookNow}
          disabled={!pricing}
        >
          {instantBook ? (
            <>
              <Zap className="size-4" />
              Book Instantly
            </>
          ) : (
            'Request to Book'
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          You won&apos;t be charged yet
        </p>

        {/* Trust signals */}
        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="size-3" />
            <span>Insured</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            <span>24/7 Support</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
