'use client'

import { useState, useEffect } from 'react'
import { 
  Gauge, Award, Flame, Trophy, Target, Copy, Check,
  Mountain, Moon, Snowflake, Route, Zap, Shield, Star, Car
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface RenterBadge {
  id: string
  name: string
  description: string
  icon: string
  earned: boolean
  earned_at?: string
}

interface Challenge {
  id: string
  name: string
  description: string
  progress: number
  target: number
  xp_reward: number
}

const BADGE_ICONS: Record<string, React.ElementType> = {
  tahoe_pioneer: Mountain,
  mountain_pro: Mountain,
  desert_run: Route,
  night_owl: Moon,
  ski_season: Snowflake,
  century_miles: Car,
  smooth_operator: Shield,
  speed_demon_stopper: Zap,
}

const RENTER_RANKS = [
  { name: 'New Driver', minScore: 0, perks: ['Basic rentals'] },
  { name: 'Trusted', minScore: 70, perks: ['Instant Book access', '5% discount'] },
  { name: 'Elite', minScore: 85, perks: ['Priority support', '10% discount', 'Free upgrades'] },
  { name: 'Ambassador', minScore: 95, perks: ['VIP access', '15% discount', 'Beta features', 'Referral bonuses'] },
]

export default function GameRoomPage() {
  const [roadScore, setRoadScore] = useState(85)
  const [speedScore, setSpeedScore] = useState(92)
  const [brakingScore, setBrakingScore] = useState(78)
  const [routeScore, setRouteScore] = useState(88)
  const [tripStreak, setTripStreak] = useState(3)
  const [totalMiles, setTotalMiles] = useState(847)
  const [referralCode, setReferralCode] = useState('RENTER-ABC123')
  const [copied, setCopied] = useState(false)
  const [badges, setBadges] = useState<RenterBadge[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])

  useEffect(() => {
    // Mock data
    setBadges([
      { id: '1', name: 'Tahoe Pioneer', description: 'Complete your first Tahoe trip', icon: 'tahoe_pioneer', earned: true, earned_at: '2024-01-15' },
      { id: '2', name: 'Mountain Pro', description: 'Complete 5 mountain trips', icon: 'mountain_pro', earned: false },
      { id: '3', name: 'Desert Run', description: 'First trip to the desert', icon: 'desert_run', earned: false },
      { id: '4', name: 'Night Owl', description: 'Trip ending after midnight', icon: 'night_owl', earned: true, earned_at: '2024-02-01' },
      { id: '5', name: 'Ski Season', description: 'Trip during ski season', icon: 'ski_season', earned: true, earned_at: '2024-01-20' },
      { id: '6', name: 'Century Miles', description: 'Rent 100 total miles', icon: 'century_miles', earned: true, earned_at: '2024-02-10' },
      { id: '7', name: 'Smooth Operator', description: '5 trips with 95+ score', icon: 'smooth_operator', earned: false },
      { id: '8', name: 'Speed Demon Stopper', description: 'Clean fast highway trips', icon: 'speed_demon_stopper', earned: false },
    ])

    setChallenges([
      { id: '1', name: 'Weekend Warrior', description: 'Complete 3 weekend trips', progress: 2, target: 3, xp_reward: 150 },
      { id: '2', name: 'Photo Star', description: 'Share 5 trip photos', progress: 3, target: 5, xp_reward: 100 },
      { id: '3', name: 'Perfect Score', description: 'Get a 100 Road Score on any trip', progress: 0, target: 1, xp_reward: 200 },
    ])
  }, [])

  const copyReferralCode = () => {
    navigator.clipboard.writeText(`https://rentanddrive.net/signup?ref=${referralCode}`)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const getCurrentRank = () => {
    for (let i = RENTER_RANKS.length - 1; i >= 0; i--) {
      if (roadScore >= RENTER_RANKS[i].minScore) {
        return RENTER_RANKS[i]
      }
    }
    return RENTER_RANKS[0]
  }

  const getNextRank = () => {
    const currentIndex = RENTER_RANKS.findIndex(r => r.name === getCurrentRank().name)
    return currentIndex < RENTER_RANKS.length - 1 ? RENTER_RANKS[currentIndex + 1] : null
  }

  const currentRank = getCurrentRank()
  const nextRank = getNextRank()

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">The Game Room</h1>

      {/* Road Score Gauge */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Main Gauge */}
            <div className="relative">
              <svg className="h-40 w-40 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="12"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="12"
                  strokeDasharray={`${(roadScore / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#CC0000" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white">{roadScore}</span>
                <span className="text-xs text-slate-400">Road Score</span>
              </div>
            </div>

            {/* Component Bars */}
            <div className="flex-1 w-full space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Speed Compliance</span>
                  <span className="text-white font-medium">{speedScore}</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
                    style={{ width: `${speedScore}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Smooth Braking</span>
                  <span className="text-white font-medium">{brakingScore}</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                    style={{ width: `${brakingScore}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Route Adherence</span>
                  <span className="text-white font-medium">{routeScore}</span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                    style={{ width: `${routeScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 text-center">
            <Flame className="h-6 w-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{tripStreak}</p>
            <p className="text-xs text-slate-400">Trip Streak</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 text-center">
            <Route className="h-6 w-6 text-[#CC0000] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{totalMiles}</p>
            <p className="text-xs text-slate-400">Total Miles</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 text-center">
            <Award className="h-6 w-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{badges.filter(b => b.earned).length}</p>
            <p className="text-xs text-slate-400">Badges Earned</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{currentRank.name}</p>
            <p className="text-xs text-slate-400">Current Rank</p>
          </CardContent>
        </Card>
      </div>

      {/* Renter Rank */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-500" />
            Renter Rank: {currentRank.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {currentRank.perks.map((perk, i) => (
              <Badge key={i} className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                {perk}
              </Badge>
            ))}
          </div>
          {nextRank && (
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Progress to {nextRank.name}</span>
                <span className="text-white">{roadScore}/{nextRank.minScore}</span>
              </div>
              <Progress value={(roadScore / nextRank.minScore) * 100} className="h-2 bg-slate-700" />
              <p className="text-xs text-slate-500 mt-2">
                {nextRank.minScore - roadScore} more points to unlock: {nextRank.perks.join(', ')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Explorer Badges */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Explorer Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badges.map((badge) => {
              const IconComponent = BADGE_ICONS[badge.icon] || Star
              return (
                <div
                  key={badge.id}
                  className={`text-center p-4 rounded-lg border transition-all ${
                    badge.earned 
                      ? 'bg-slate-800 border-amber-500/50' 
                      : 'bg-slate-800/50 border-slate-700 opacity-50 grayscale'
                  }`}
                >
                  <div className={`h-12 w-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    badge.earned ? 'bg-amber-500/20' : 'bg-slate-700'
                  }`}>
                    <IconComponent className={`h-6 w-6 ${badge.earned ? 'text-amber-400' : 'text-slate-500'}`} />
                  </div>
                  <p className={`font-medium text-sm ${badge.earned ? 'text-white' : 'text-slate-500'}`}>
                    {badge.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{badge.description}</p>
                  {badge.earned && (
                    <Badge className="mt-2 bg-green-500/20 text-green-400 text-[10px]">
                      Earned
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Challenges */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-[#CC0000]" />
            Active Challenges
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-white">{challenge.name}</p>
                  <p className="text-sm text-slate-400">{challenge.description}</p>
                </div>
                <Badge className="bg-[#CC0000]/20 text-[#CC0000]">
                  +{challenge.xp_reward} XP
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Progress 
                  value={(challenge.progress / challenge.target) * 100} 
                  className="flex-1 h-2 bg-slate-700"
                />
                <span className="text-sm text-slate-400">
                  {challenge.progress}/{challenge.target}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Referral Link */}
      <Card className="bg-gradient-to-r from-[#CC0000]/20 to-red-900/20 border-[#CC0000]/30">
        <CardHeader>
          <CardTitle className="text-white">Invite Friends, Earn Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 mb-4">
            Share your referral link and earn $25 credit for each friend who completes their first trip!
          </p>
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-800 rounded-lg px-4 py-2 font-mono text-sm text-white truncate">
              rentanddrive.net/signup?ref={referralCode}
            </div>
            <Button 
              onClick={copyReferralCode}
              className={copied ? 'bg-green-600 hover:bg-green-600' : 'bg-[#CC0000] hover:bg-[#AA0000]'}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
