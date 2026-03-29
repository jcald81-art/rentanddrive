import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function HostDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#D62828] rounded-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
              >
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <path d="M9 17h6" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            </div>
            <span className="font-semibold">Rent and Drive</span>
            <span className="text-xs bg-[#D62828] px-2 py-0.5 rounded">HOST</span>
          </div>
          <form action={handleSignOut}>
            <Button variant="outline" size="sm" type="submit" className="border-white/20 text-white hover:bg-white/10">
              Sign out
            </Button>
          </form>
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
