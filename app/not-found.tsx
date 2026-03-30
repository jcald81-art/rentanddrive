import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Car, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <div className="mb-8">
          <Car className="h-24 w-24 mx-auto text-muted-foreground/50" />
        </div>
        
        <h1 className="text-6xl font-bold text-[#CC0000] mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Looks like this road doesn&apos;t exist. The page you&apos;re looking for may have been moved or deleted.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/vehicles">
              <Search className="mr-2 h-4 w-4" />
              Browse Vehicles
            </Link>
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mt-8">
          Need help? <Link href="mailto:support@rentanddrive.net" className="underline">Contact Support</Link>
        </p>
      </div>
    </div>
  )
}
