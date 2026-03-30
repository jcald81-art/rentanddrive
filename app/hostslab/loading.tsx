import { Hosts SuiteCardSkeleton } from '@/components/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function Hosts SuiteLoading() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Skeleton className="h-8 w-40 bg-slate-700" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-24 bg-slate-700" />
            <Skeleton className="h-8 w-8 rounded-full bg-slate-700" />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-700 min-h-screen p-4 hidden lg:block">
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full bg-slate-700" />
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48 bg-slate-700" />
              <Skeleton className="h-6 w-32 bg-slate-700" />
            </div>
            <Hosts SuiteCardSkeleton />
            <div className="grid gap-6 md:grid-cols-2">
              <Hosts SuiteCardSkeleton />
              <Hosts SuiteCardSkeleton />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
