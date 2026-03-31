'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Gamepad2,
  Trophy,
  Star,
  Flame,
  Target,
  Award,
  Crown,
  Medal,
  Zap,
  TrendingUp,
  Lock,
  CheckCircle,
  Gift,
  Users,
  Calendar,
  Sparkles,
} from 'lucide-react'

interface LabLevel {
  level: number
  name: string
  minXp: number
  maxXp: number
  color: string
  perks: string[]
}

interface UserProgress {
  currentXp: number
  level: LabLevel
  nextLevel: LabLevel | null
  xpToNext: number
  percentToNext: number
  streak: number
}

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  earned: boolean
  earned_at?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface Challenge {
  id: string
  name: string
  description: string
  target: number
  progress: number
  xp_reward: number
  ends_at: string
}

interface LeaderboardEntry {
  rank: number
  host_id: string
  host_name: string
  avatar_url: string | null
  xp: number
  level: number
}

interface FuntimeActivity {
  id: string
  action: string
  xp: number
  created_at: string
}

const LAB_LEVELS: LabLevel[] = [
  { level: 1, name: 'Rookie', minXp: 0, maxXp: 499, color: 'bg-slate-500', perks: ['Basic Dashboard'] },
  { level: 2, name: 'Apprentice', minXp: 500, maxXp: 1999, color: 'bg-green-500', perks: ['Eagle Map', 'Break Room Access'] },
  { level: 3, name: 'Pro', minXp: 2000, maxXp: 4999, color: 'bg-blue-500', perks: ['Dollar Suggestions', 'Shield Reviews'] },
  { level: 4, name: 'Expert', minXp: 5000, maxXp: 9999, color: 'bg-purple-500', perks: ['Auto-Dollar', 'Priority Support'] },
  { level: 5, name: 'Elite', minXp: 10000, maxXp: 24999, color: 'bg-amber-500', perks: ['Custom Agent Names', 'Weekly Spin'] },
  { level: 6, name: 'Legend', minXp: 25000, maxXp: 999999, color: 'bg-[#CC0000]', perks: ['All Features', 'Beta Access', 'Founder Badge'] },
]

const BADGE_ICONS: Record<string, React.ReactNode> = {
  first_trip: <Car className="h-5 w-5" />,
  five_star: <Star className="h-5 w-5" />,
  perfect_driver: <Shield className="h-5 w-5" />,
  road_warrior: <Zap className="h-5 w-5" />,
  early_adopter: <Sparkles className="h-5 w-5" />,
  superhost: <Crown className="h-5 w-5" />,
}

import { Car, Shield } from 'lucide-react'

export default function GameRoomPage() {
  const [progress, setProgress] = useState<UserProgress | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [activities, setActivities] = useState<FuntimeActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/hostslab/gameroom/progress').then(r => r.json()),
      fetch('/api/hostslab/gameroom/badges').then(r => r.json()),
      fetch('/api/hostslab/gameroom/challenges').then(r => r.json()),
      fetch('/api/hostslab/gameroom/leaderboard').then(r => r.json()),
      fetch('/api/hostslab/gameroom/activities').then(r => r.json()),
    ])
      .then(([prog, badg, chal, lead, act]) => {
        if (prog.progress) setProgress(prog.progress)
        if (badg.badges) setBadges(badg.badges)
        if (chal.challenges) setChallenges(chal.challenges)
        if (lead.leaderboard) setLeaderboard(lead.leaderboard)
        if (act.activities) setActivities(act.activities)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
      case 'epic': return 'bg-gradient-to-br from-purple-400 to-purple-600 text-white'
      case 'rare': return 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
      default: return 'bg-gradient-to-br from-slate-400 to-slate-600 text-white'
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  // Default mock data
  const displayProgress = progress || {
    currentXp: 3250,
    level: LAB_LEVELS[2],
    nextLevel: LAB_LEVELS[3],
    xpToNext: 1750,
    percentToNext: 65,
    streak: 7,
  }

  const displayBadges = badges.length > 0 ? badges : [
    { id: '1', name: 'RAD Fleet', description: 'All vehicles GPS tracked with Bouncie', icon: 'rad_fleet', earned: true, earned_at: '2024-01-01', rarity: 'rare' as const },
    { id: '2', name: 'Century Club', description: 'Complete 100 rentals', icon: 'century_club', earned: false, rarity: 'epic' as const },
    { id: '3', name: '5-Star Lab', description: 'Maintain 5.0 rating for 30 days', icon: 'five_star_lab', earned: true, earned_at: '2024-01-10', rarity: 'rare' as const },
    { id: '4', name: 'Car Lot Closer', description: 'Sell a vehicle through The Car Lot', icon: 'car_lot_closer', earned: false, rarity: 'epic' as const },
    { id: '5', name: 'Speed Demon Stopper', description: 'Resolve 10 speed alerts with renters', icon: 'speed_stopper', earned: true, earned_at: '2024-01-15', rarity: 'rare' as const },
    { id: '6', name: 'Legend', description: 'Reach Legend status', icon: 'legend', earned: false, rarity: 'legendary' as const },
  ]

  const displayChallenges = challenges.length > 0 ? challenges : [
    { id: '1', name: 'Weekend Warrior', description: 'Complete 3 weekend bookings', target: 3, progress: 2, xp_reward: 250, ends_at: '2024-01-31' },
    { id: '2', name: 'Review Champion', description: 'Get 5 reviews this month', target: 5, progress: 3, xp_reward: 200, ends_at: '2024-01-31' },
    { id: '3', name: 'Price Optimizer', description: 'Accept 10 Dollar recommendations', target: 10, progress: 4, xp_reward: 300, ends_at: '2024-01-31' },
  ]

  const displayLeaderboard = leaderboard.length > 0 ? leaderboard : [
    { rank: 1, host_id: '1', host_name: 'Sarah M.', avatar_url: null, xp: 28500, level: 6 },
    { rank: 2, host_id: '2', host_name: 'Mike R.', avatar_url: null, xp: 18200, level: 5 },
    { rank: 3, host_id: '3', host_name: 'Lisa K.', avatar_url: null, xp: 12400, level: 5 },
    { rank: 4, host_id: '4', host_name: 'You', avatar_url: null, xp: 3250, level: 3 },
    { rank: 5, host_id: '5', host_name: 'John D.', avatar_url: null, xp: 2100, level: 3 },
  ]

  const displayActivities = activities.length > 0 ? activities : [
    { id: '1', action: 'Completed trip #1234', xp: 50, created_at: new Date().toISOString() },
    { id: '2', action: 'Received 5-star review', xp: 25, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: '3', action: 'Applied Dollar recommendation', xp: 15, created_at: new Date(Date.now() - 172800000).toISOString() },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#CC0000] rounded-lg">
            <Gamepad2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">The Game Room</h1>
            <p className="text-muted-foreground">Level up your hosting game</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="font-bold">{displayProgress.streak} day streak</span>
        </div>
      </div>

      {/* XP Progress Card */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${displayProgress.level.color}`}>
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Current Rank</p>
                <h2 className="text-2xl font-bold">{displayProgress.level.name}</h2>
                <p className="text-slate-400">Level {displayProgress.level.level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">{displayProgress.currentXp.toLocaleString()}</p>
              <p className="text-slate-400">Total XP</p>
            </div>
          </div>

          {displayProgress.nextLevel && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress to {displayProgress.nextLevel.name}</span>
                <span>{displayProgress.xpToNext.toLocaleString()} XP to go</span>
              </div>
              <Progress value={displayProgress.percentToNext} className="h-3" />
            </div>
          )}

          {/* Perks */}
          <div className="mt-6 pt-4 border-t border-slate-700">
            <p className="text-sm text-slate-400 mb-2">Your Perks</p>
            <div className="flex flex-wrap gap-2">
              {displayProgress.level.perks.map((perk) => (
                <Badge key={perk} variant="secondary" className="bg-slate-700 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {perk}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Challenges */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[#CC0000]" />
              <CardTitle>Active Challenges</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayChallenges.map((challenge) => (
              <div key={challenge.id} className="p-4 rounded-lg border">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{challenge.name}</h4>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  </div>
                  <Badge className="bg-amber-500">+{challenge.xp_reward} XP</Badge>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{challenge.progress} / {challenge.target}</span>
                    <span className="text-muted-foreground">Ends {formatDate(challenge.ends_at)}</span>
                  </div>
                  <Progress value={(challenge.progress / challenge.target) * 100} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <CardTitle>Weekly Leaderboard</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayLeaderboard.map((entry) => (
                <div 
                  key={entry.host_id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    entry.host_name === 'You' ? 'bg-[#CC0000]/10 border border-[#CC0000]/30' : 'border'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    entry.rank === 1 ? 'bg-amber-500 text-white' :
                    entry.rank === 2 ? 'bg-slate-400 text-white' :
                    entry.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {entry.rank}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback>{entry.host_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{entry.host_name}</p>
                    <p className="text-xs text-muted-foreground">Level {entry.level}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{entry.xp.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badge Wall */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#CC0000]" />
            <CardTitle>Badge Wall</CardTitle>
          </div>
          <CardDescription>
            {displayBadges.filter(b => b.earned).length} of {displayBadges.length} badges earned
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {displayBadges.map((badge) => (
              <div 
                key={badge.id}
                className={`relative p-4 rounded-lg text-center transition-all ${
                  badge.earned 
                    ? getRarityColor(badge.rarity) 
                    : 'bg-slate-100 dark:bg-slate-800 opacity-50'
                }`}
              >
                {!badge.earned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-lg">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                )}
                <div className="h-12 w-12 mx-auto mb-2 flex items-center justify-center">
                  {BADGE_ICONS[badge.icon] || <Medal className="h-8 w-8" />}
                </div>
                <p className="font-medium text-sm">{badge.name}</p>
                <p className="text-xs opacity-80 mt-1">{badge.description}</p>
                {badge.earned && badge.earned_at && (
                  <p className="text-xs mt-2 opacity-60">Earned {formatDate(badge.earned_at)}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lab Level Requirements */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#CC0000]" />
            <CardTitle>Lab Level Requirements</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LAB_LEVELS.map((level) => {
              const isCurrentLevel = displayProgress.level.level === level.level
              const isUnlocked = displayProgress.currentXp >= level.minXp

              return (
                <div 
                  key={level.level}
                  className={`p-4 rounded-lg border ${
                    isCurrentLevel ? 'ring-2 ring-[#CC0000] bg-[#CC0000]/5' :
                    isUnlocked ? 'bg-green-50 dark:bg-green-900/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${level.color} text-white font-bold`}>
                      {level.level}
                    </div>
                    <div>
                      <p className="font-medium">{level.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {level.minXp.toLocaleString()} - {level.maxXp.toLocaleString()} XP
                      </p>
                    </div>
                    {isUnlocked && <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {level.perks.map((perk) => (
                      <Badge key={perk} variant="outline" className="text-xs">
                        {perk}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Funtime Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-500" />
            <CardTitle>Recent XP Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {displayActivities.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <Zap className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500">+{activity.xp} XP</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
