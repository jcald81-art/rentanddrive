'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Car, ArrowLeft } from 'lucide-react'

export default function ListVehiclePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [category, setCategory] = useState('')
  const [dailyRate, setDailyRate] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in?redirect=/list-vehicle')
      } else {
        setIsAuthenticated(true)
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/sign-in?redirect=/list-vehicle')
        return
      }

      const { error: insertError } = await supabase
        .from('vehicles')
        .insert({
          owner_id: user.id,
          make,
          model,
          year: parseInt(year),
          category,
          daily_rate: parseFloat(dailyRate),
          description,
          location,
          status: 'pending_review'
        })

      if (insertError) throw insertError
      router.push('/dashboard?listed=true')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to list vehicle')
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Car className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">List Your Vehicle</h1>
              <p className="text-muted-foreground">Start earning money by sharing your vehicle</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-8 shadow-2xl border border-border">
          {error && (
            <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make" className="text-foreground">Make</Label>
                <Input
                  id="make"
                  placeholder="e.g., Toyota"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model" className="text-foreground">Model</Label>
                <Input
                  id="model"
                  placeholder="e.g., Camry"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year" className="text-foreground">Year</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="e.g., 2022"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-foreground">Category</Label>
                <Select value={category} onValueChange={setCategory} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="rv">RV / Campervan</SelectItem>
                    <SelectItem value="atv">ATV / Side-by-Side</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyRate" className="text-foreground">Daily Rate ($)</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  placeholder="e.g., 75"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  required
                  min="1"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-foreground">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Reno, NV"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your vehicle, features, and any rules for renters..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={isLoading}
                className="resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'List My Vehicle'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            By listing your vehicle, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:text-primary/80">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
