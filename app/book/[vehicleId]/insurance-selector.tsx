'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Spinner } from '@/components/ui/spinner'
import {
  Shield,
  Check,
  X,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface InsurancePlan {
  plan_id: string
  name: 'basic' | 'standard' | 'premium'
  premium_cents: number
  deductible_cents: number
  liability_limit_cents: number
  collision: boolean
  comprehensive: boolean
  roadside_assistance: boolean
  personal_effects: boolean
  uninsured_motorist: boolean
}

interface InsuranceQuote {
  quote_id: string | null
  plans: InsurancePlan[]
  recommended_plan_id: string
  provider: 'roamly' | 'rad_internal'
}

export interface SelectedInsurance {
  plan: InsurancePlan
  quote_id: string | null
  provider: 'roamly' | 'rad_internal'
}

interface InsuranceSelectorProps {
  vehicleId: string
  startDate: string
  endDate: string
  days: number
  selected: SelectedInsurance | null
  onSelect: (insurance: SelectedInsurance) => void
}

// ── Coverage comparison table config ─────────────────────────────────────────

const COVERAGE_ROWS = [
  { key: 'liability',           label: 'Liability Coverage',     render: (p: InsurancePlan) => formatLimit(p.liability_limit_cents) },
  { key: 'deductible',          label: 'Deductible',             render: (p: InsurancePlan) => formatMoney(p.deductible_cents) },
  { key: 'collision',           label: 'Collision Damage',       render: (p: InsurancePlan) => boolIcon(p.collision) },
  { key: 'comprehensive',       label: 'Comprehensive',          render: (p: InsurancePlan) => boolIcon(p.comprehensive) },
  { key: 'roadside',            label: '24/7 Roadside',          render: (p: InsurancePlan) => boolIcon(p.roadside_assistance) },
  { key: 'personal_effects',    label: 'Personal Belongings',    render: (p: InsurancePlan) => boolIcon(p.personal_effects) },
  { key: 'uninsured_motorist',  label: 'Uninsured Motorist',     render: (p: InsurancePlan) => boolIcon(p.uninsured_motorist) },
]

const PLAN_META: Record<string, { label: string; tagline: string; color: string; recommended: boolean }> = {
  basic:    { label: 'Basic',    tagline: 'Liability only',                    color: '#6B7280', recommended: false },
  standard: { label: 'Standard', tagline: 'Most popular for weekend trips',    color: '#CC0000', recommended: true  },
  premium:  { label: 'Premium',  tagline: 'Total peace of mind coverage',      color: '#C4813A', recommended: false },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatMoney(cents: number) {
  if (cents === 0) return '$0'
  if (cents >= 100_00) return `$${Math.round(cents / 100).toLocaleString()}`
  return `$${(cents / 100).toFixed(2)}`
}

function formatLimit(cents: number) {
  if (cents >= 1_000_000_00) return `$${(cents / 100_000_000).toFixed(0)}M`
  if (cents >= 1_000_00) return `$${(cents / 100_000).toFixed(0)}K`
  return formatMoney(cents)
}

function boolIcon(v: boolean) {
  return v
    ? <Check className="h-4 w-4 text-green-600 mx-auto" />
    : <X className="h-4 w-4 text-gray-300 mx-auto" />
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InsuranceSelector({
  vehicleId,
  startDate,
  endDate,
  days,
  selected,
  onSelect,
}: InsuranceSelectorProps) {
  const [quote, setQuote] = useState<InsuranceQuote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    const fetchQuote = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/insurance/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicleId, startDate, endDate }),
        })
        if (!res.ok) throw new Error('Failed to fetch insurance quotes')
        const data = await res.json()

        // Normalise to the shape we need (API returns quotes array)
        const plans: InsurancePlan[] = (data.quotes ?? data.plans ?? []).map((q: Record<string, unknown>) => ({
          plan_id:              (q.plan_id ?? q.coverageType) as string,
          name:                 (q.name ?? q.coverageType) as 'basic' | 'standard' | 'premium',
          premium_cents:        Number(q.premium_cents ?? q.premiumCents ?? 0),
          deductible_cents:     Number(q.deductible_cents ?? (q.deductible ? Number(q.deductible) * 100 : 0)),
          liability_limit_cents: Number(q.liability_limit_cents ?? (q.liabilityLimit ? Number(q.liabilityLimit) * 100 : 0)),
          collision:            Boolean(q.collision ?? q.collisionCoverage),
          comprehensive:        Boolean(q.comprehensive ?? q.comprehensiveCoverage),
          roadside_assistance:  Boolean(q.roadside_assistance ?? q.roadsideAssistance),
          personal_effects:     Boolean(q.personal_effects ?? q.personalEffects),
          uninsured_motorist:   Boolean(q.uninsured_motorist ?? q.uninsuredMotorist),
        })).filter((p: InsurancePlan) => ['basic', 'standard', 'premium'].includes(p.name))

        const norm: InsuranceQuote = {
          quote_id: data.quote_id ?? null,
          plans,
          recommended_plan_id: data.recommended ?? data.recommended_plan_id ?? 'standard',
          provider: data.provider ?? 'rad_internal',
        }
        setQuote(norm)

        // Auto-select recommended if nothing chosen yet
        if (!selected) {
          const recommended = plans.find(p => p.name === norm.recommended_plan_id || p.plan_id === norm.recommended_plan_id)
          if (recommended) {
            onSelect({ plan: recommended, quote_id: norm.quote_id, provider: norm.provider })
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load insurance options')
      } finally {
        setLoading(false)
      }
    }
    fetchQuote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, startDate, endDate])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12 gap-3">
          <Spinner className="h-5 w-5" />
          <span className="text-muted-foreground text-sm">Fetching real-time insurance quotes...</span>
        </CardContent>
      </Card>
    )
  }

  if (error || !quote || quote.plans.length === 0) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex items-center gap-3 py-6 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error ?? 'No insurance quotes available. Please try again.'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#CC0000]" />
              Select Your Coverage
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Protection for your {days}-day trip — coverage starts at pick-up
            </p>
          </div>
          {quote.provider === 'roamly' && (
            <Badge variant="outline" className="text-xs shrink-0">
              Powered by Roamly
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Plan Cards */}
        <div className="grid sm:grid-cols-3 gap-3">
          {quote.plans.map(plan => {
            const meta = PLAN_META[plan.name] ?? PLAN_META.standard
            const isSelected = selected?.plan.plan_id === plan.plan_id || selected?.plan.name === plan.name
            const pricePerDay = Math.round(plan.premium_cents / days / 100)

            return (
              <button
                key={plan.plan_id}
                type="button"
                onClick={() => onSelect({ plan, quote_id: quote.quote_id, provider: quote.provider })}
                className={`relative text-left rounded-xl border-2 p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CC0000] ${
                  isSelected
                    ? 'border-[#CC0000] bg-[#CC0000]/5 shadow-sm'
                    : 'border-border hover:border-muted-foreground/50'
                }`}
              >
                {meta.recommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#CC0000] text-white text-[10px] font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
                    Most Popular
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm" style={{ color: meta.color }}>{meta.label}</span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#CC0000] flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      ${pricePerDay}
                      <span className="text-sm font-normal text-muted-foreground">/day</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatMoney(plan.premium_cents)} total
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-snug">{meta.tagline}</p>

                  <Separator />

                  <ul className="space-y-1.5 text-xs">
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-green-600 shrink-0" />
                      {formatLimit(plan.liability_limit_cents)} liability
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-green-600 shrink-0" />
                      {formatMoney(plan.deductible_cents)} deductible
                    </li>
                    {plan.collision && (
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-green-600 shrink-0" />
                        Collision damage
                      </li>
                    )}
                    {plan.roadside_assistance && (
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-green-600 shrink-0" />
                        24/7 Roadside
                      </li>
                    )}
                    {plan.comprehensive && (
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-green-600 shrink-0" />
                        Comprehensive
                      </li>
                    )}
                    {plan.personal_effects && (
                      <li className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-green-600 shrink-0" />
                        Personal belongings
                      </li>
                    )}
                  </ul>
                </div>
              </button>
            )
          })}
        </div>

        {/* Full comparison table (expandable) */}
        <button
          type="button"
          onClick={() => setShowComparison(v => !v)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-full pt-1"
        >
          <Info className="h-4 w-4" />
          {showComparison ? 'Hide' : 'Show'} full coverage comparison
          {showComparison ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
        </button>

        {showComparison && (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground w-1/3">Coverage</th>
                  {quote.plans.map(p => (
                    <th key={p.plan_id} className="p-3 font-semibold text-center">
                      <span style={{ color: PLAN_META[p.name]?.color }}>{PLAN_META[p.name]?.label ?? p.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COVERAGE_ROWS.map((row, i) => (
                  <tr key={row.key} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="p-3 text-muted-foreground">{row.label}</td>
                    {quote.plans.map(p => (
                      <td key={p.plan_id} className="p-3 text-center font-medium">
                        {row.render(p)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t bg-muted/50">
                  <td className="p-3 font-semibold">Total Premium</td>
                  {quote.plans.map(p => (
                    <td key={p.plan_id} className="p-3 text-center font-bold">
                      {formatMoney(p.premium_cents)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Selected summary */}
        {selected && (
          <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">
                {PLAN_META[selected.plan.name]?.label} coverage selected — {formatMoney(selected.plan.premium_cents)} added to total
              </p>
              <p className="text-green-700 text-xs mt-0.5">
                {formatLimit(selected.plan.liability_limit_cents)} liability · {formatMoney(selected.plan.deductible_cents)} deductible
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Insurance is underwritten by licensed carriers. Coverage activates at trip start and is non-refundable after pick-up.
        </p>
      </CardContent>
    </Card>
  )
}
