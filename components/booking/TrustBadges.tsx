'use client'

import { Shield, Radio, Lock, CreditCard } from 'lucide-react'

export function TrustBadges() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold text-sm mb-3">Your booking is protected</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-start gap-2">
          <Shield className="size-4 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium">CarFidelity Certified</p>
            <p className="text-xs text-muted-foreground">Every vehicle inspected</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Radio className="size-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium">RAD Fleet GPS</p>
            <p className="text-xs text-muted-foreground">Real-time tracking</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Lock className="size-4 text-purple-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium">Secure Checkout</p>
            <p className="text-xs text-muted-foreground">256-bit encryption</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <CreditCard className="size-4 text-orange-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium">Stripe Payments</p>
            <p className="text-xs text-muted-foreground">PCI compliant</p>
          </div>
        </div>
      </div>
    </div>
  )
}
