'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface CheckoutButtonProps {
  rentalId: string
  amount: number // in cents
  vehicleLabel: string
  renterId?: string
  hostId?: string
  vehicleId?: string
  startDate?: string
  endDate?: string
  className?: string
}

export default function CheckoutButton({
  rentalId,
  amount,
  vehicleLabel,
  renterId,
  hostId,
  vehicleId,
  startDate,
  endDate,
  className,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rentalId,
          renterId,
          hostId,
          vehicleId,
          startDate,
          endDate,
          totalAmount: amount,
          vehicleLabel,
        }),
      })

      const data = await response.json()

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        console.error('No checkout URL returned')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setIsLoading(false)
    }
  }

  const displayAmount = (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      className={`bg-[#1a1a2e] hover:bg-[#16213e] text-[#f4d03f] font-semibold ${className}`}
      style={{ fontFamily: 'DM Sans, sans-serif' }}
    >
      {isLoading ? 'Processing...' : `Book Now — ${displayAmount}`}
    </Button>
  )
}
