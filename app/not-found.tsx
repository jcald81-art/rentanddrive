import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Radar, Home, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center px-4">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto rounded-full bg-[#CC0000]/20 flex items-center justify-center">
            <Radar className="h-16 w-16 text-[#CC0000]" />
          </div>
        </div>
        
        <h1 className="text-7xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-2">This road leads nowhere</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          Eagle couldn&apos;t locate this page. It may have been moved, deleted, or never existed.
        </p>

        {/* Search Bar */}
        <form action="/vehicles" method="GET" className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              name="q"
              placeholder="Search for a vehicle..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
            />
          </div>
        </form>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-[#CC0000] hover:bg-[#AA0000]">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button variant="outline" asChild className="border-white/20 text-white hover:bg-white/10">
            <Link href="/vehicles">
              <Search className="mr-2 h-4 w-4" />
              Browse Vehicles
            </Link>
          </Button>
        </div>
        
        <p className="text-sm text-slate-500 mt-8">
          Need help? <Link href="/contact" className="text-[#CC0000] hover:underline">Contact Support</Link>
        </p>
      </div>
    </div>
  )
}
