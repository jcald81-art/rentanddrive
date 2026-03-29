'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, differenceInDays, addDays } from 'date-fns'
import { Calendar as CalendarIcon, Zap, Shield, Clock } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { DateRange } from 'react-day-picker'

interface PricingCalculatorProps {
  vehicleId: string
  dailyRate: number
  instantBook: boolean
}

export function PricingCalculator({ vehicleId, dailyRate, instantBook }: PricingCalculatorProps) {
  const router = useRouter()
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), 1),
    to: addDays(new Date(), 4),
  })

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
