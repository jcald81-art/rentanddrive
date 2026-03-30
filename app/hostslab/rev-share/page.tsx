'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Trophy,
  ArrowRight,
  Gift,
  Users,
  Star,
  Zap,
} from 'lucide-react'
import { REV_SHARE_TIERS, getHostTier, projectMonthlyEarnings, type RevShareTier } from '@/lib/programs/rev-share'

export default function RevSharePage() {
  const [completedTrips, setCompletedTrips] = useState(25)
  const [numberOfVehicles, setNumberOfVehicles] = useState(2)
  const [averageDailyRate, setAverageDailyRate] = useState(75)
  const [utilization, setUtilization] = useState(60)
  
  const currentTier = getHostTier(completedTrips)
  const nextTier = REV_SHARE_TIERS.find(t => t.minTrips > completedTrips)
  const tripsToNextTier = nextTier ? nextTier.minTrips - completedTrips : 0
  
  const projection = projectMonthlyEarnings({
    numberOfVehicles,
    averageDailyRate,
    averageUtilization: utilization,
    completedTrips,
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Revenue Share Program</h1>
        <p className="text-muted-foreground mt-2">
          The more you host, the more you keep. Unlike competitors who take 25%+, 
          our top hosts keep up to 92% of their earnings.
        </p>
      </div>

      {/* Current Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-[#CC0000]/30 bg-gradient-to-br from-slate-900 to-slate-800">
          <CardHeader>
            <CardDescription>Your Current Tier</CardDescription>
            <CardTitle className="text-4xl text-[#CC0000]">{currentTier.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="text-2xl font-bold">{currentTier.platformFee}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">You Keep</span>
                <span className="text-2xl font-bold text-green-500">{currentTier.hostKeeps}%</span>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <p className="text-sm text-muted-foreground">{completedTrips} trips completed</p>
                {nextTier && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>{tripsToNextTier} trips to {nextTier.name}</span>
                      <span>Keep {nextTier.hostKeeps}%</span>
                    </div>
                    <Progress 
                      value={(completedTrips / nextTier.minTrips) * 100} 
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>vs. Competitors</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              You Save More
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <p className="text-sm text-red-400">Competitor (Turo)</p>
                <p className="text-2xl font-bold text-red-500">25% fee</p>
                <p className="text-sm text-muted-foreground">
                  ${Math.round(projection.vsCompetitor.competitorFees)}/month in fees
                </p>
              </div>
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-sm text-green-400">Rent and Drive</p>
                <p className="text-2xl font-bold text-green-500">{currentTier.platformFee}% fee</p>
                <p className="text-sm text-muted-foreground">
                  ${Math.round(projection.vsCompetitor.ourFees)}/month in fees
                </p>
              </div>
              <div className="text-center p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg">
                <p className="text-sm">Annual Savings</p>
                <p className="text-3xl font-bold text-green-500">
                  ${Math.round(projection.vsCompetitor.annualSavings).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Your Monthly Projection</CardDescription>
            <CardTitle className="text-3xl">${Math.round(projection.netToHost).toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gross Revenue</span>
                <span>${Math.round(projection.grossRevenue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee ({currentTier.platformFee}%)</span>
                <span className="text-red-400">-${Math.round(projection.platformFees).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t">
                <span>Net to You</span>
                <span className="text-green-500">${Math.round(projection.netToHost).toLocaleString()}</span>
              </div>
              <div className="pt-4">
                <p className="text-sm text-muted-foreground">Yearly: ${Math.round(projection.yearlyProjection).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Earnings Calculator
          </CardTitle>
          <CardDescription>
            See how much you could earn with Rent and Drive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Number of Vehicles: {numberOfVehicles}
                </label>
                <Slider
                  value={[numberOfVehicles]}
                  onValueChange={([v]) => setNumberOfVehicles(v)}
                  min={1}
                  max={20}
                  step={1}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Average Daily Rate: ${averageDailyRate}
                </label>
                <Slider
                  value={[averageDailyRate]}
                  onValueChange={([v]) => setAverageDailyRate(v)}
                  min={30}
                  max={300}
                  step={5}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Utilization: {utilization}%
                </label>
                <Slider
                  value={[utilization]}
                  onValueChange={([v]) => setUtilization(v)}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Completed Trips: {completedTrips}
                </label>
                <Slider
                  value={[completedTrips]}
                  onValueChange={([v]) => setCompletedTrips(v)}
                  min={0}
                  max={300}
                  step={1}
                />
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Monthly Take-Home</p>
                <p className="text-6xl font-bold text-green-500">
                  ${Math.round(projection.netToHost).toLocaleString()}
                </p>
                <p className="text-muted-foreground mt-2">
                  at {currentTier.name} tier ({currentTier.hostKeeps}%)
                </p>
                <p className="text-sm text-green-400 mt-4">
                  Saving ${Math.round(projection.vsCompetitor.annualSavings).toLocaleString()}/year vs competitors
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Breakdown */}
      <div>
        <h2 className="text-xl font-bold mb-4">Revenue Share Tiers</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {REV_SHARE_TIERS.map((tier, index) => (
            <Card 
              key={tier.name}
              className={
                tier.name === currentTier.name 
                  ? 'border-[#CC0000] bg-[#CC0000]/5' 
                  : ''
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  {tier.name === currentTier.name && (
                    <Badge className="bg-[#CC0000]">Current</Badge>
                  )}
                </div>
                <CardDescription>
                  {tier.minTrips}+ trips
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center py-3 bg-muted/50 rounded-lg">
                    <p className="text-3xl font-bold text-green-500">{tier.hostKeeps}%</p>
                    <p className="text-xs text-muted-foreground">You Keep</p>
                  </div>
                  <ul className="space-y-1">
                    {tier.perks.slice(0, 3).map((perk, i) => (
                      <li key={i} className="text-xs flex items-center gap-1">
                        <Star className="h-3 w-3 text-[#CC0000]" />
                        {perk}
                      </li>
                    ))}
                    {tier.perks.length > 3 && (
                      <li className="text-xs text-muted-foreground">
                        +{tier.perks.length - 3} more perks
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Referral Program */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-500" />
            Referral Revenue Share
          </CardTitle>
          <CardDescription>
            At Elite tier and above, earn a percentage of platform fees from hosts you refer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-background/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Elite (50+ trips)</p>
              <p className="text-2xl font-bold text-purple-500">10%</p>
              <p className="text-xs text-muted-foreground">of referral fees for 1 year</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Legend (100+ trips)</p>
              <p className="text-2xl font-bold text-purple-500">15%</p>
              <p className="text-xs text-muted-foreground">of referral fees for life</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Founding Partner (250+)</p>
              <p className="text-2xl font-bold text-purple-500">20%</p>
              <p className="text-xs text-muted-foreground">of referral fees for life</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="flex justify-center">
        <Button size="lg" className="bg-[#CC0000] hover:bg-[#AA0000]">
          <Zap className="h-4 w-4 mr-2" />
          Add Your First Vehicle
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
