import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Become a Host | RentAndDrive',
  description: 'Complete your host profile to start earning with your vehicles',
}

export default function HostOnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
