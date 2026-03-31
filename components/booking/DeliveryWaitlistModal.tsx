'use client'

import { useState } from 'react'
import { Truck, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createBrowserClient } from '@supabase/ssr'

interface DeliveryWaitlistModalProps {
  vehicleId?: string
  vehicleName?: string
}

export function DeliveryWaitlistModal({ vehicleId, vehicleName }: DeliveryWaitlistModalProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email && !phone) {
      setError('Please enter your email or phone number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error: insertError } = await supabase
        .from('delivery_waitlist')
        .insert({
          email: email || null,
          phone: phone || null,
          vehicle_id: vehicleId || null,
          vehicle_name: vehicleName || null,
        })

      if (insertError) throw insertError

      setSubmitted(true)
    } catch (err) {
      console.error('Failed to join waitlist:', err)
      setError('Failed to join waitlist. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative group cursor-pointer">
          <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-gray-600 bg-gray-800/50 hover:bg-gray-800 transition-colors">
            <div className="flex items-center justify-center size-10 rounded-full bg-amber-500/20">
              <Truck className="size-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">Vehicle Delivery</span>
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 rounded">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-gray-400">We bring the car to you</p>
            </div>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="bg-[#0f172a] border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Truck className="size-6 text-amber-500" />
            Vehicle Delivery Coming Soon
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Skip the pickup entirely. We&apos;ll bring your RAD vehicle directly to your location.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="flex items-center justify-center size-16 rounded-full bg-green-500/20 mx-auto mb-4">
              <CheckCircle2 className="size-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">You&apos;re on the list!</h3>
            <p className="text-gray-400">
              We&apos;ll notify you when vehicle delivery launches in your area.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Delivery Waitlist'
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Launching Q4 2026. Delivery starts at $20.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
