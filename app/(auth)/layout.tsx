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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D62828] rounded-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <path d="M9 17h6" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            </div>
            <span className="text-xl font-semibold">Rent and Drive</span>
          </div>
        </div>
        
        <div className="space-y-6">
          <blockquote className="text-2xl font-medium leading-relaxed text-balance">
            &ldquo;Book direct and save 10% vs Turo. Your keys, your savings.&rdquo;
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="h-px bg-[#D62828] w-12" />
            <p className="text-white/60 text-sm">
              Peer-to-peer car rental in Reno, Nevada
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-white/80">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#D62828]">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>No middleman fees</span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#D62828]">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>Insurance included</span>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#D62828]">
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
