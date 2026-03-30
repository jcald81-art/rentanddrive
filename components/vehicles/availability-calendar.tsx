'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { DateRange } from 'react-day-picker'

interface AvailabilityCalendarProps {
  vehicleId: string
}

interface Booking {
  start_date: string
  end_date: string
}

export function AvailabilityCalendar({ vehicleId }: AvailabilityCalendarProps) {
  const [bookedDates, setBookedDates] = useState<Date[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBookings() {
      const supabase = createClient()

      const { data } = await supabase
        .from('bookings')
        .select('start_date, end_date')
        .eq('vehicle_id', vehicleId)
        .in('status', ['confirmed', 'pending'])
        .gte('end_date', new Date().toISOString())

      if (data) {
        const dates: Date[] = []
        data.forEach((booking: Booking) => {
          const start = new Date(booking.start_date)
          const end = new Date(booking.end_date)
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            dates.push(new Date(d))
          }
        })
        setBookedDates(dates)
      }

      setLoading(false)
    }

    fetchBookings()
  }, [vehicleId])

  const isDateBooked = (date: Date) => {
    return bookedDates.some(
      (bookedDate) => bookedDate.toDateString() === date.toDateString()
    )
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <h2 className="text-lg font-semibold text-foreground">Availability</h2>
        <p className="text-sm text-muted-foreground">
          Green dates are available for booking
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <Calendar
            mode="single"
            numberOfMonths={2}
            disabled={(date) => date < new Date() || isDateBooked(date)}
            modifiers={{
              booked: bookedDates,
            }}
            modifiersClassNames={{
              booked: 'bg-muted text-muted-foreground line-through',
            }}
            className="rounded-md border"
          />
        )}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="size-4 rounded bg-background border" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-4 rounded bg-muted" />
            <span className="text-muted-foreground">Booked</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
