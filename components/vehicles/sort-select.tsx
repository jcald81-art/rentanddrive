'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface SortSelectProps {
  defaultValue?: string
}

function SortSelectInner({ defaultValue = 'price_asc' }: SortSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', e.target.value)
    router.push(`/vehicles?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-muted-foreground">Sort by:</label>
      <select
        id="sort"
        name="sort"
        defaultValue={defaultValue}
        onChange={handleChange}
        className="text-sm border rounded-md px-2 py-1 bg-background"
      >
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="rating">Highest Rated</option>
        <option value="newest">Newest</option>
      </select>
    </div>
  )
}

export function SortSelect({ defaultValue }: SortSelectProps) {
  return (
    <Suspense fallback={<div className="h-8 w-40 animate-pulse rounded bg-muted" />}>
      <SortSelectInner defaultValue={defaultValue} />
    </Suspense>
  )
}
