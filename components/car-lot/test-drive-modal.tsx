'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, MapPin, Car, Clock, Loader2, CheckCircle } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface TestDriveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listingId: string
  vehicleName: string
  vehicleImage?: string
}

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
]

export function TestDriveModal({
  open,
  onOpenChange,
  listingId,
  vehicleName,
  vehicleImage
}: TestDriveModalProps) {
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1))
  const [time, setTime] = useState('10:00')
  const [pickupAddress, setPickupAddress] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [confirmationData, setConfirmationData] = useState<{
    lyft_confirmation: string
    lyft_pickup_time: string
    igloo_pin: string | null
    vehicle_address: string
  } | null>(null)

  const handleSubmit = async () => {
    if (!date || !time || !pickupAddress) return

    setLoading(true)
    try {
      const preferredDateTime = new Date(date)
      const [hours, minutes] = time.split(':')
      preferredDateTime.setHours(parseInt(hours), parseInt(minutes))

      const res = await fetch('/api/test-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          preferred_datetime: preferredDateTime.toISOString(),
          pickup_address: pickupAddress,
          message_to_host: message
        })
      })

      if (res.ok) {
        const data = await res.json()
        setConfirmationData({
          lyft_confirmation: data.concierge_ride.confirmation_code,
          lyft_pickup_time: data.concierge_ride.pickup_time,
          igloo_pin: data.igloo_pin,
          vehicle_address: data.vehicle_address
        })
        setSuccess(true)
      }
    } catch (error) {
      console.error('Failed to schedule test drive:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSuccess(false)
    setConfirmationData(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {success && confirmationData ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" />
                Test Drive Scheduled!
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                <Car className="h-12 w-12 mx-auto mb-2 text-green-600" />
                <p className="font-bold text-lg">{vehicleName}</p>
                <p className="text-sm text-muted-foreground">
                  {date && format(date, 'EEEE, MMMM d')} at {time}
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">LYFT CONFIRMATION</p>
                  <p className="font-mono font-bold text-lg">{confirmationData.lyft_confirmation}</p>
                  <p className="text-sm text-muted-foreground">
                    Pickup at {new Date(confirmationData.lyft_pickup_time).toLocaleTimeString()}
                  </p>
                </div>

                {confirmationData.igloo_pin && (
                  <div className="p-3 bg-[#CC0000]/10 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">LOCKBOX PIN</p>
                    <p className="font-mono font-bold text-2xl text-[#CC0000]">
                      {confirmationData.igloo_pin}
                    </p>
                  </div>
                )}

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">VEHICLE LOCATION</p>
                  <p className="text-sm">{confirmationData.vehicle_address}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Check your email and SMS for full details. The host has been notified.
              </p>

              <Button className="w-full" onClick={handleClose}>
                Done
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Schedule Test Drive</DialogTitle>
              <DialogDescription>
                We&apos;ll send a Lyft to pick you up and bring you to the {vehicleName}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Date Picker */}
              <div className="space-y-2">
                <Label>Preferred Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : 'Select a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Picker */}
              <div className="space-y-2">
                <Label>Preferred Time</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot.replace(':00', ':00 AM').replace('13', '1').replace('14', '2').replace('15', '3').replace('16', '4').replace('17', '5')}
                        {parseInt(slot) >= 12 && slot !== '12:00' ? ' PM' : parseInt(slot) < 12 ? '' : ' PM'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pickup Address */}
              <div className="space-y-2">
                <Label htmlFor="pickup">Your Pickup Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pickup"
                    placeholder="Enter your address for Lyft pickup"
                    className="pl-10"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                  />
                </div>
              </div>

              {/* Message to Host */}
              <div className="space-y-2">
                <Label htmlFor="message">Message to Host (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="I'm interested in purchasing this vehicle..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Info */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>2-hour test drive rental at 50% off</span>
                </div>
              </div>

              <Button 
                className="w-full bg-[#CC0000] hover:bg-[#AA0000]"
                onClick={handleSubmit}
                disabled={!date || !time || !pickupAddress || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule Test Drive'
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
