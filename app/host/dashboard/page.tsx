import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Car as CarIcon } from 'lucide-react'

export default async function HostDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?role=host')
  }

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b bg-[#0D0D0D] text-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Image 
                src="/images/logo.jpg" 
                alt="Rent and Drive" 
                width={160}
                height={40}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <span className="text-xs bg-[#D62828] px-2 py-0.5 rounded font-medium">HOST SUITE</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Switch to Renter Suite */}
            <Link href="/renter/suite">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 gap-2">
                <CarIcon className="h-4 w-4" />
                Renter Suite
              </Button>
            </Link>
            <form action={handleSignOut}>
              <Button variant="outline" size="sm" type="submit" className="border-white/20 text-white hover:bg-white/10">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Host Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.user_metadata?.full_name || 'Host'}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="border rounded-lg p-6">
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-3xl font-semibold">$0.00</p>
            </div>
            <div className="border rounded-lg p-6">
              <p className="text-sm text-muted-foreground">Active Listings</p>
              <p className="text-3xl font-semibold">0</p>
            </div>
            <div className="border rounded-lg p-6">
              <p className="text-sm text-muted-foreground">Pending Bookings</p>
              <p className="text-3xl font-semibold">0</p>
            </div>
            <div className="border rounded-lg p-6">
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <p className="text-3xl font-semibold">--</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="border rounded-lg p-6 space-y-2">
              <h3 className="font-medium">List a Vehicle</h3>
              <p className="text-sm text-muted-foreground">Add a new car to your fleet</p>
              <Button asChild className="w-full mt-4 bg-[#D62828] hover:bg-[#D62828]/90">
                <Link href="/host/vehicles/new">Add vehicle</Link>
              </Button>
            </div>
            <div className="border rounded-lg p-6 space-y-2">
              <h3 className="font-medium">Manage Bookings</h3>
              <p className="text-sm text-muted-foreground">View and respond to booking requests</p>
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/host/bookings">View bookings</Link>
              </Button>
            </div>
            <div className="border rounded-lg p-6 space-y-2">
              <h3 className="font-medium">Earnings & Payouts</h3>
              <p className="text-sm text-muted-foreground">Track your income and payouts</p>
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/host/earnings">View earnings</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
