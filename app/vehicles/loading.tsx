import { VehicleGridSkeleton } from '@/components/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function VehiclesLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>

      {/* Hero search skeleton */}
      <div className="bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-20 w-full max-w-4xl mx-auto rounded-lg" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters sidebar skeleton */}
          <aside className="w-full lg:w-72 space-y-4">
            <Skeleton className="h-6 w-20" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
            <Skeleton className="h-6 w-16 mt-4" />
            <Skeleton className="h-10 w-full" />
            <div className="space-y-3 mt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-10" />
                </div>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-40" />
            </div>
            <VehicleGridSkeleton count={6} />
          </div>
        </div>
      </div>
    </div>
  )
}
