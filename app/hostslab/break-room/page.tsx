'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Coffee,
  Send,
  Heart,
  MessageCircle,
  Pin,
  Users,
  Star,
  Sparkles,
  MapPin,
  Clock,
  ThumbsUp,
  Bookmark,
} from 'lucide-react'

interface Post {
  id: string
  author: {
    id: string
    name: string
    avatar_url: string | null
    lab_level: number
  }
  content: string
  channel: string
  is_pinned: boolean
  reactions: {
    likes: number
    hearts: number
  }
  comments_count: number
  created_at: string
  user_reacted?: boolean
}

interface HostSpotlight {
  host: {
    id: string
    name: string
    avatar_url: string | null
    lab_level: number
    vehicles_count: number
    total_trips: number
    avg_rating: number
  }
  achievement: string
}

const CHANNELS = [
  { id: 'all', name: 'All Posts', icon: Coffee },
  { id: 'reno', name: 'Reno', icon: MapPin },
  { id: 'tahoe', name: 'Lake Tahoe', icon: MapPin },
  { id: 'sparks', name: 'Sparks', icon: MapPin },
]

export default function BreakRoomPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [spotlight, setSpotlight] = useState<HostSpotlight | null>(null)
  const [onlineCount, setOnlineCount] = useState(0)
  const [newPost, setNewPost] = useState('')
  const [selectedChannel, setSelectedChannel] = useState('all')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    fetchData()
    // Poll for new posts every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [selectedChannel])

  const fetchData = () => {
    Promise.all([
      fetch(`/api/hostslab/breakroom/posts?channel=${selectedChannel}`).then(r => r.json()),
      fetch('/api/hostslab/breakroom/spotlight').then(r => r.json()),
      fetch('/api/hostslab/breakroom/online').then(r => r.json()),
    ])
      .then(([postsData, spotlightData, onlineData]) => {
        if (postsData.posts) setPosts(postsData.posts)
        if (spotlightData.spotlight) setSpotlight(spotlightData.spotlight)
        if (onlineData.count) setOnlineCount(onlineData.count)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const createPost = async () => {
    if (!newPost.trim()) return
    setPosting(true)
    try {
      const res = await fetch('/api/hostslab/breakroom/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPost, channel: selectedChannel }),
      })
      if (res.ok) {
        setNewPost('')
        fetchData()
      }
    } catch (err) {
      console.error('Failed to create post:', err)
    } finally {
      setPosting(false)
    }
  }

  const reactToPost = async (postId: string, reaction: 'like' | 'heart') => {
    try {
      await fetch(`/api/hostslab/breakroom/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction }),
      })
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            reactions: {
              ...p.reactions,
              [reaction === 'like' ? 'likes' : 'hearts']: p.reactions[reaction === 'like' ? 'likes' : 'hearts'] + 1,
            },
            user_reacted: true,
          }
        }
        return p
      }))
    } catch (err) {
      console.error('Failed to react:', err)
    }
  }

  const formatTime = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return then.toLocaleDateString()
  }

  const getLevelBadge = (level: number) => {
    const colors = ['bg-slate-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-red-500']
    return colors[level - 1] || colors[0]
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  // Mock data
  const displayPosts = posts.length > 0 ? posts : [
    { 
      id: '1', 
      author: { id: '1', name: 'SecureLink', avatar_url: null, lab_level: 6 },
      content: 'Good morning hosts! Today looks like a great day for rentals. 3 new bookings came in overnight and the weather forecast is clear. Remember to check your Eagle dashboards for any alerts.',
      channel: 'all',
      is_pinned: true,
      reactions: { likes: 12, hearts: 5 },
      comments_count: 3,
      created_at: new Date().toISOString(),
    },
    { 
      id: '2', 
      author: { id: '2', name: 'Sarah M.', avatar_url: null, lab_level: 5 },
      content: 'Just hit Lab Director status! Thanks to everyone for the tips on optimizing Dollar pricing. My occupancy rate has been incredible this month.',
      channel: 'reno',
      is_pinned: false,
      reactions: { likes: 8, hearts: 15 },
      comments_count: 7,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    { 
      id: '3', 
      author: { id: '3', name: 'Mike R.', avatar_url: null, lab_level: 4 },
      content: 'Anyone else seeing increased demand for the Tahoe area this weekend? Thinking about adding my second vehicle to the fleet.',
      channel: 'tahoe',
      is_pinned: false,
      reactions: { likes: 5, hearts: 2 },
      comments_count: 4,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ]

  const displaySpotlight = spotlight || {
    host: {
      id: '1',
      name: 'Sarah M.',
      avatar_url: null,
      lab_level: 5,
      vehicles_count: 3,
      total_trips: 127,
      avg_rating: 4.95,
    },
    achievement: 'Most 5-star reviews this week',
  }

  const pinnedPosts = displayPosts.filter(p => p.is_pinned)
  const regularPosts = displayPosts.filter(p => !p.is_pinned)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#CC0000] rounded-lg">
            <Coffee className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">The Break Room</h1>
            <p className="text-muted-foreground">Connect with fellow hosts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">{onlineCount || 12} online</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Channel Tabs */}
          <Tabs value={selectedChannel} onValueChange={setSelectedChannel}>
            <TabsList>
              {CHANNELS.map((channel) => {
                const Icon = channel.icon
                return (
                  <TabsTrigger key={channel.id} value={channel.id}>
                    <Icon className="h-4 w-4 mr-2" />
                    {channel.name}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>

          {/* New Post */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>Y</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Share something with the community..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <Button onClick={createPost} disabled={posting || !newPost.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      {posting ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pinned Posts */}
          {pinnedPosts.length > 0 && (
            <div className="space-y-4">
              {pinnedPosts.map((post) => (
                <Card key={post.id} className="border-[#CC0000]/30 bg-[#CC0000]/5">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author.avatar_url || undefined} />
                        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{post.author.name}</span>
                          <Badge className={getLevelBadge(post.author.lab_level)}>
                            Lv.{post.author.lab_level}
                          </Badge>
                          <Badge variant="outline" className="text-[#CC0000] border-[#CC0000]">
                            <Pin className="h-3 w-3 mr-1" />
                            Pinned
                          </Badge>
                          <span className="text-sm text-muted-foreground ml-auto">
                            {formatTime(post.created_at)}
                          </span>
                        </div>
                        <p className="text-sm">{post.content}</p>
                        <div className="flex items-center gap-4 mt-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => reactToPost(post.id, 'like')}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {post.reactions.likes}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => reactToPost(post.id, 'heart')}
                          >
                            <Heart className="h-4 w-4 mr-1" />
                            {post.reactions.hearts}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {post.comments_count}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Regular Posts */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {regularPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author.avatar_url || undefined} />
                        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{post.author.name}</span>
                          <Badge className={getLevelBadge(post.author.lab_level)}>
                            Lv.{post.author.lab_level}
                          </Badge>
                          {post.channel !== 'all' && (
                            <Badge variant="outline">
                              <MapPin className="h-3 w-3 mr-1" />
                              {post.channel}
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground ml-auto">
                            {formatTime(post.created_at)}
                          </span>
                        </div>
                        <p className="text-sm">{post.content}</p>
                        <div className="flex items-center gap-4 mt-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => reactToPost(post.id, 'like')}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {post.reactions.likes}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => reactToPost(post.id, 'heart')}
                          >
                            <Heart className="h-4 w-4 mr-1" />
                            {post.reactions.hearts}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {post.comments_count}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Host Spotlight */}
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                <CardTitle>Host Spotlight</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-amber-300">
                  <AvatarImage src={displaySpotlight.host.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-amber-200">
                    {displaySpotlight.host.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-lg">{displaySpotlight.host.name}</h3>
                <Badge className={getLevelBadge(displaySpotlight.host.lab_level)}>
                  Level {displaySpotlight.host.lab_level}
                </Badge>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                  <Sparkles className="h-4 w-4 inline mr-1" />
                  {displaySpotlight.achievement}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-amber-200 dark:border-amber-700">
                  <div>
                    <p className="text-xl font-bold">{displaySpotlight.host.vehicles_count}</p>
                    <p className="text-xs text-muted-foreground">Vehicles</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{displaySpotlight.host.total_trips}</p>
                    <p className="text-xs text-muted-foreground">Trips</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{displaySpotlight.host.avg_rating}</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Host Welcome */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-300">Welcome New Hosts!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                New to HostsLab? Introduce yourself and connect with experienced hosts who can help you get started.
              </p>
              <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-200">
                Say Hello
              </Button>
            </CardContent>
          </Card>

          {/* Recent Discussions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[#CC0000]" />
                <CardTitle>Hot Topics</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: 'Best cleaning services in Reno?', replies: 23 },
                { title: 'Winter tire recommendations', replies: 18 },
                { title: 'Dollar pricing strategies', replies: 31 },
              ].map((topic, i) => (
                <button 
                  key={i}
                  className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <p className="font-medium text-sm">{topic.title}</p>
                  <p className="text-xs text-muted-foreground">{topic.replies} replies</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
