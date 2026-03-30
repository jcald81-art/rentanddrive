'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  User, Star, Car, Calendar, Shield, Trophy,
  Settings, LogOut, ChevronRight, Camera, Edit
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function ProfilePage() {
  const [user, setUser] = useState({
    name: 'Adventure Renter',
    email: 'renter@example.com',
    avatar: '/placeholder.svg',
    member_since: '2023-06-15',
    road_score: 85,
    total_trips: 12,
    rank: 'Trusted',
    badges: 4,
  })

  const menuItems = [
    { href: '/renter/reputation', icon: Trophy, label: 'My Reputation', description: 'Road Score & Reviews' },
    { href: '/renter/coverage', icon: Shield, label: 'My Coverage', description: 'Insurance & Protection' },
    { href: '/renter/trips', icon: Calendar, label: 'Trip History', description: 'Past & Upcoming Trips' },
    { href: '/renter/gameroom', icon: Star, label: 'Badges & Rewards', description: 'Your Achievements' },
    { href: '/settings', icon: Settings, label: 'Settings', description: 'Account & Preferences' },
  ]

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-[#CC0000]">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-slate-700 text-2xl">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-[#CC0000] flex items-center justify-center">
                <Camera className="h-4 w-4 text-white" />
              </button>
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <p className="text-slate-400">{user.email}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                <Badge className="bg-purple-500/20 text-purple-400">{user.rank}</Badge>
                <span className="text-slate-500">•</span>
                <span className="text-sm text-slate-400">Member since {new Date(user.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            <Button variant="outline" className="border-slate-700 text-slate-300">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 text-center">
            <div className="relative h-16 w-16 mx-auto mb-2">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#CC0000" strokeWidth="8"
                  strokeDasharray={`${(user.road_score / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{user.road_score}</span>
              </div>
            </div>
            <p className="text-sm text-slate-400">Road Score</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 text-center">
            <Car className="h-8 w-8 text-[#CC0000] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{user.total_trips}</p>
            <p className="text-sm text-slate-400">Total Trips</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{user.badges}</p>
            <p className="text-sm text-slate-400">Badges Earned</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{user.rank}</p>
            <p className="text-sm text-slate-400">Renter Rank</p>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0 divide-y divide-slate-800">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between p-4 hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-[#CC0000]" />
                </div>
                <div>
                  <p className="font-medium text-white">{item.label}</p>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Button 
        variant="outline" 
        className="w-full border-red-900/50 text-red-400 hover:bg-red-900/20"
        onClick={() => {/* Sign out logic */}}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  )
}
