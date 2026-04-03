export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-white/10 bg-[#0a0a0a]">
        <div className="p-6">
          <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </nav>
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-[#e50914]/20 rounded-lg animate-pulse" />
          </div>

          {/* Stats grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#151820] border border-white/10 rounded-xl p-6">
                <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-4" />
                <div className="h-8 w-16 bg-white/20 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Content grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#151820] border border-white/10 rounded-xl p-6">
              <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-4" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
            <div className="bg-[#151820] border border-white/10 rounded-xl p-6">
              <div className="h-6 w-24 bg-white/10 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
