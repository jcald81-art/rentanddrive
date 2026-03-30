import { Logo } from '@/components/logo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh flex">
      {/* Left side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        {children}
      </div>
      
      {/* Right side - Branding panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 bg-[#0D0D0D] text-white flex-col justify-between p-12">
        <div>
          <Logo size="lg" linkTo="/" />
        </div>
        
        <div className="space-y-6">
          <blockquote className="text-2xl font-medium leading-relaxed text-balance">
            &ldquo;Book direct and save 10% vs Turo. Your keys, your savings.&rdquo;
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="h-px bg-[#CC0000] w-12" />
            <p className="text-white/60 text-sm">
              Peer-to-peer car rental in Reno, Nevada
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-white/80">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#CC0000]">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>No middleman fees</span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#CC0000]">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Insurance included</span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#CC0000]">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>24/7 roadside assistance</span>
          </div>
        </div>
      </div>
    </div>
  )
}
