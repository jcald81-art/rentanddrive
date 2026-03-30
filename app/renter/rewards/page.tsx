'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Car, 
  CheckCircle, 
  Star, 
  Camera, 
  Users, 
  RefreshCw,
  Coins,
  Gift,
  Trophy,
  Crown,
  Sparkles,
  Calendar
} from 'lucide-react'
import { DrivePointsBadge } from '@/components/DrivePointsBadge'

const tierConfig = {
  bronze: { min: 0, max: 999, color: 'bg-amber-700', textColor: 'text-amber-700', multiplier: 1, discount: 5 },
  silver: { min: 1000, max: 4999, color: 'bg-slate-400', textColor: 'text-slate-400', multiplier: 1.25, discount: 8 },
  gold: { min: 5000, max: 9999, color: 'bg-yellow-500', textColor: 'text-yellow-500', multiplier: 1.5, discount: 12 },
  platinum: { min: 10000, max: Infinity, color: 'bg-purple-400', textColor: 'text-purple-400', multiplier: 2, discount: 15 },
}

const earnOptions = [
  { icon: Car, label: 'Complete a rental', points: '1pt per $1 spent', color: 'text-[#F59E0B]' },
  { icon: CheckCircle, label: 'First rental', points: 'Bonus 100pts', color: 'text-green-500' },
  { icon: Star, label: 'Leave a review', points: '+25pts', color: 'text-yellow-400' },
  { icon: Camera, label: 'Upload trip photos', points: '+15pts', color: 'text-blue-400' },
  { icon: Users, label: 'Refer a friend who rents', points: '+200pts', color: 'text-purple-400' },
  { icon: RefreshCw, label: 'Book again within 30 days', points: '+50pts bonus', color: 'text-cyan-400' },
]

const redeemOptions = [
  { id: 'discount_5', label: '$5 off next rental', points: 500, featured: false },
  { id: 'discount_15', label: '$15 off next rental', points: 1400, featured: false },
  { id: 'discount_25', label: '$25 off next rental', points: 2200, featured: false },
  { id: 'free_day', label: '1 Free Day (up to $80 value)', points: 5000, featured: true },
  { id: 'drivemonthly_upgrade', label: 'Free DriveMonthly upgrade', points: 3000, featured: false },
]

const mockHistory = [
  { date: '2024-03-28', description: 'Completed rental - Tesla Model 3', earned: 156, balance: 2840 },
  { date: '2024-03-25', description: 'Left a review', earned: 25, balance: 2684 },
  { date: '2024-03-20', description: 'Repeat booking bonus', earned: 50, balance: 2659 },
  { date: '2024-03-18', description: 'Completed rental - Jeep Wrangler', earned: 89, balance: 2609 },
  { date: '2024-03-10', description: 'Uploaded trip photos', earned: 15, balance: 2520 },
  { date: '2024-03-05', description: 'Referral bonus - John D.', earned: 200, balance: 2505 },
  { date: '2024-02-28', description: 'Redeemed $15 discount', earned: -1400, balance: 2305 },
  { date: '2024-02-25', description: 'Completed rental - Ford F-150', earned: 210, balance: 3705 },
]

const leaderboard = [
  { rank: 1, name: 'Michael R.', points: 4520 },
  { rank: 2, name: 'Sarah T.', points: 3890 },
  { rank: 3, name: 'James L.', points: 3210 },
  { rank: 4, name: 'Emily W.', points: 2950 },
  { rank: 5, name: 'David K.', points: 2870 },
]

function getTier(points: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (points >= 10000) return 'platinum'
  if (points >= 5000) return 'gold'
  if (points >= 1000) return 'silver'
  return 'bronze'
}

function getNextTier(currentTier: string): { name: string; pointsNeeded: number } | null {
  const tiers = ['bronze', 'silver', 'gold', 'platinum']
  const currentIndex = tiers.indexOf(currentTier)
  if (currentIndex === tiers.length - 1) return null
  const nextTierName = tiers[currentIndex + 1]
  return { 
    name: nextTierName, 
    pointsNeeded: tierConfig[nextTierName as keyof typeof tierConfig].min 
  }
}

export default function RewardsPage() {
  const [points, setPoints] = useState(2840)
  const [lifetimePoints, setLifetimePoints] = useState(4250)
  const [loading, setLoading] = useState(false)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
  const [progressAnimated, setProgressAnimated] = useState(0)

  const tier = getTier(lifetimePoints)
  const nextTier = getNextTier(tier)
  const progressToNext = nextTier 
    ? ((lifetimePoints - tierConfig[tier].min) / (nextTier.pointsNeeded - tierConfig[tier].min)) * 100
    : 100

  useEffect(() => {
    const timer = setTimeout(() => setProgressAnimated(progressToNext), 100)
    return () => clearTimeout(timer)
  }, [progressToNext])

  const handleRedeem = async (rewardId: string, pointsCost: number) => {
    if (points < pointsCost) return
    setRedeemingId(rewardId)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setPoints(prev => prev - pointsCost)
    setRedeemingId(null)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-b border-zinc-800">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex items-center gap-2">
              <Coins className="h-8 w-8 text-[#F59E0B]" />
              <h1 className="text-3xl font-bold">DrivePoints</h1>
            </div>
            
            {/* Points Balance */}
            <div className="mb-6">
              <p className="text-6xl font-bold font-mono text-[#F59E0B]">
                {points.toLocaleString()} <span className="text-2xl">pts</span>
              </p>
            </div>

            {/* Tier Badge */}
            <Badge className={`${tierConfig[tier].color} text-white text-lg px-4 py-1 mb-6 capitalize`}>
              {tier === 'platinum' && <Crown className="h-4 w-4 mr-1" />}
              {tier === 'gold' && <Trophy className="h-4 w-4 mr-1" />}
              {tier} Member
            </Badge>

            {/* Progress to Next Tier */}
            {nextTier && (
              <div className="w-full max-w-md">
                <div className="flex justify-between text-sm text-zinc-400 mb-2">
                  <span className="capitalize">{tier}</span>
                  <span className="capitalize">{nextTier.name}</span>
                </div>
                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#F59E0B] to-yellow-400 transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${progressAnimated}%` }}
                  />
                </div>
                <p className="text-sm text-zinc-400 mt-2">
                  <span className="font-mono text-[#F59E0B]">{(nextTier.pointsNeeded - lifetimePoints).toLocaleString()}</span> points to {nextTier.name}
                </p>
              </div>
            )}

            <p className="text-zinc-500 text-sm mt-4 flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              Points expire: Never
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Tier Benefits */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-[#F59E0B]" />
            Membership Tiers
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(tierConfig).map(([tierName, config]) => (
              <Card 
                key={tierName}
                className={`bg-zinc-900 border-zinc-800 ${tier === tierName ? 'ring-2 ring-[#F59E0B]' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge className={`${config.color} text-white capitalize`}>
                      {tierName}
                    </Badge>
                    {tier === tierName && (
                      <Badge variant="outline" className="border-[#F59E0B] text-[#F59E0B]">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 font-mono">
                    {config.min.toLocaleString()}–{config.max === Infinity ? '∞' : config.max.toLocaleString()} pts
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-zinc-300">
                    <span className="font-mono text-[#F59E0B]">{config.multiplier}x</span> points per $1
                  </p>
                  <p className="text-zinc-300">
                    <span className="font-mono text-[#F59E0B]">{config.discount}%</span> discount threshold
                  </p>
                  {tierName === 'silver' && (
                    <p className="text-zinc-400">Priority support</p>
                  )}
                  {tierName === 'gold' && (
                    <>
                      <p className="text-zinc-400">Priority support</p>
                      <p className="text-zinc-400">Free DriveShield upgrade</p>
                    </>
                  )}
                  {tierName === 'platinum' && (
                    <>
                      <p className="text-zinc-400">Dedicated host matching</p>
                      <p className="text-zinc-400">Monthly free day</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Earn Points */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Coins className="h-6 w-6 text-[#F59E0B]" />
            Earn Points
          </h2>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-800">
                {earnOptions.map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg bg-zinc-800 ${option.color}`}>
                        <option.icon className="h-5 w-5" />
                      </div>
                      <span className="text-zinc-200">{option.label}</span>
                    </div>
                    <span className="font-mono text-[#F59E0B]">{option.points}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Redeem Points */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Gift className="h-6 w-6 text-[#F59E0B]" />
            Redeem Points
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {redeemOptions.map((reward) => (
              <Card 
                key={reward.id}
                className={`bg-zinc-900 border-zinc-800 ${reward.featured ? 'ring-2 ring-[#F59E0B] bg-gradient-to-br from-zinc-900 to-amber-950/20' : ''}`}
              >
                <CardContent className="p-6">
                  {reward.featured && (
                    <Badge className="bg-[#F59E0B] text-black mb-3">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Best Value
                    </Badge>
                  )}
                  <h3 className="text-lg font-semibold text-white mb-2">{reward.label}</h3>
                  <p className="text-2xl font-mono text-[#F59E0B] mb-4">
                    {reward.points.toLocaleString()} pts
                  </p>
                  <Button
                    onClick={() => handleRedeem(reward.id, reward.points)}
                    disabled={points < reward.points || redeemingId === reward.id}
                    className={`w-full ${reward.featured ? 'bg-[#F59E0B] hover:bg-yellow-600 text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}
                  >
                    {redeemingId === reward.id ? 'Redeeming...' : points < reward.points ? 'Not enough points' : 'Redeem'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Points History */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[#F59E0B]" />
            Points History
          </h2>
          <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-400">Points</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-400">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {mockHistory.map((row, index) => (
                    <tr key={index} className="hover:bg-zinc-800/50">
                      <td className="px-4 py-3 text-sm text-zinc-400">{row.date}</td>
                      <td className="px-4 py-3 text-sm text-zinc-200">{row.description}</td>
                      <td className={`px-4 py-3 text-sm text-right font-mono ${row.earned > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {row.earned > 0 ? '+' : ''}{row.earned.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-[#F59E0B]">
                        {row.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* Leaderboard */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-[#F59E0B]" />
            Top Renters This Month
          </h2>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-800">
                {leaderboard.map((user) => (
                  <div key={user.rank} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        user.rank === 1 ? 'bg-[#F59E0B] text-black' : 
                        user.rank === 2 ? 'bg-slate-400 text-black' : 
                        user.rank === 3 ? 'bg-amber-700 text-white' : 
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {user.rank}
                      </div>
                      <span className="text-zinc-200">{user.name}</span>
                    </div>
                    <span className="font-mono text-[#F59E0B]">{user.points.toLocaleString()} pts</span>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-zinc-800/50 border-t border-zinc-700">
                <p className="text-center text-zinc-400">
                  You are <span className="font-mono text-[#F59E0B]">#12</span> this month
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
