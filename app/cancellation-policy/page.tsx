import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Clock, DollarSign, AlertTriangle, Car, Calendar, HeartHandshake, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Cancellation Policy | Rent and Drive',
  description: 'Understand our cancellation and refund policy for vehicle rentals on Rent and Drive.',
}

export default function CancellationPolicyPage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="mr-2 size-4" />
            Back to Home
          </Link>
        </Button>

        <h1 className="mb-2 text-4xl font-bold">Cancellation Policy</h1>
        <p className="mb-8 text-muted-foreground">Last updated: {lastUpdated}</p>

        {/* Free Cancellation Banner */}
        <Card className="mb-8 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Clock className="size-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Free Cancellation Window
              </h2>
              <p className="text-green-700 dark:text-green-300">
                Cancel your booking for a full refund up to 48 hours before your scheduled pickup time.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Tiers */}
        <div className="mb-12 space-y-4">
          <h2 className="mb-4 text-2xl font-semibold">Cancellation Fees</h2>
          
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    48+ hours
                  </Badge>
                  before pickup
                </CardTitle>
                <span className="font-semibold text-green-600">Full Refund</span>
              </div>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="space-y-1">
                <li>Full refund including all fees and security deposit</li>
                <li>No cancellation fee applied</li>
                <li>Refund processed within 3-7 business days</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                    24-48 hours
                  </Badge>
                  before pickup
                </CardTitle>
                <span className="font-semibold text-yellow-600">Partial Refund</span>
              </div>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="space-y-1">
                <li>Refund of total minus one day&apos;s rental rate</li>
                <li>Security deposit refunded in full</li>
                <li>All add-on fees refunded in full</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                    Under 24 hours
                  </Badge>
                  before pickup
                </CardTitle>
                <span className="font-semibold text-orange-600">50% Refund</span>
              </div>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="space-y-1">
                <li>50% refund of rental total</li>
                <li>Security deposit refunded in full</li>
                <li>Add-on fees refunded in full</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Badge variant="destructive">No-Show</Badge>
                  did not pick up within 2 hours
                </CardTitle>
                <span className="font-semibold text-destructive">No Refund</span>
              </div>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="space-y-1">
                <li>No refund on rental total</li>
                <li>Security deposit released after vehicle inspection</li>
                <li>Booking marked as completed (no-show)</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Additional Policies */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="size-5 text-primary" />
                Early Return
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                No automatic refund for early returns. Contact RAD Support — host approval is 
                required for any partial refund on early returns.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartHandshake className="size-5 text-primary" />
                Host Cancellations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-2">If your host cancels for any reason:</p>
              <ul className="space-y-1 text-sm">
                <li>Full refund of all charges within 24 hours</li>
                <li>$25 RAD credit applied to your account automatically</li>
                <li>Rebooking assistance from RAD Concierge</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="size-5 text-primary" />
                Vehicle Issues at Pickup
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="mb-2">
                If the vehicle is unavailable, unsafe, or significantly different from the listing:
              </p>
              <ul className="space-y-1 text-sm">
                <li>Full refund</li>
                <li>$50 RAD credit applied to your account</li>
                <li className="font-medium">Do NOT check in — contact RAD Concierge before the trip starts</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-primary" />
                Extenuating Circumstances
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Natural disasters, severe weather, serious illness, or death in immediate family — 
                contact RAD Support with documentation. We review all requests on a case-by-case basis.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Refund Timing */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="size-5 text-primary" />
              Refund Timing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-1 text-sm text-muted-foreground">Card Refunds</p>
                <p className="font-semibold">3-7 business days</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-1 text-sm text-muted-foreground">Crypto Refunds</p>
                <p className="font-semibold">24-48 hours</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-1 text-sm text-muted-foreground">Security Deposit Release</p>
                <p className="font-semibold">Within 24 hours</p>
                <p className="text-xs text-muted-foreground">After confirmed completion + clean inspection</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disputes */}
        <Card className="mt-8 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="size-5 text-primary" />
              Disputes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              All disputes must be initiated within <strong>72 hours</strong> of trip end. 
              Eagle Eye GPS records and Surveyor inspection reports are used in all dispute resolutions.
            </p>
            <p className="mt-4">
              Need help?{' '}
              <a href="mailto:support@rentanddrive.net" className="text-primary hover:underline">
                Contact RAD Support
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-12 text-center">
          <div className="flex justify-center gap-4">
            <Link href="/terms" className="text-sm text-primary hover:underline">
              Terms of Service
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/privacy" className="text-sm text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
