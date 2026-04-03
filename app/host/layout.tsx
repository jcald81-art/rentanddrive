import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Host Dashboard | Rent and Drive',
  description: 'Manage your vehicles, bookings, and earnings on Rent and Drive.',
}

export default function HostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]" suppressHydrationWarning>
      {children}
    </div>
  )
}
