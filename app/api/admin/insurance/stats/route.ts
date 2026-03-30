import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    { count: totalPolicies },
    { count: activePolicies },
    { count: expiringSoon },
    { count: totalClaims },
    { count: openClaims },
    { data: claimsPaid },
    { data: coverageData },
  ] = await Promise.all([
    supabase.from('insurance_policies').select('*', { count: 'exact', head: true }),
    supabase.from('insurance_policies').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('insurance_policies').select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('end_date', thirtyDaysFromNow.toISOString())
      .gte('end_date', now.toISOString()),
    supabase.from('insurance_claims').select('*', { count: 'exact', head: true }),
    supabase.from('insurance_claims').select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'under_review']),
    supabase.from('insurance_claims')
      .select('approved_amount')
      .eq('status', 'paid')
      .gte('updated_at', firstOfMonth.toISOString()),
    supabase.from('insurance_policies')
      .select('coverage_amount')
      .eq('status', 'active'),
  ])

  const claimsPaidThisMonth = claimsPaid?.reduce((sum, c) => sum + (c.approved_amount || 0), 0) || 0
  const totalCoverageValue = coverageData?.reduce((sum, p) => sum + (p.coverage_amount || 0), 0) || 0

  return NextResponse.json({
    total_policies: totalPolicies || 0,
    active_policies: activePolicies || 0,
    expiring_soon: expiringSoon || 0,
    total_claims: totalClaims || 0,
    open_claims: openClaims || 0,
    claims_paid_this_month: claimsPaidThisMonth,
    total_coverage_value: totalCoverageValue,
  })
}
