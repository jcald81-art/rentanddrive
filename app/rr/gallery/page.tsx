'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { 
  Upload, Share2, Globe, Lock, Heart, MessageCircle,
  Trophy, ChevronLeft, ChevronRight, Copy, Check
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface TripPhoto {
  id: string
  url: string
  caption?: string
  is_public: boolean
  likes: number
  comments: number
  uploaded_at: string
  user?: {
    name: string
    avatar: string
  }
  is_contest_entry?: boolean
  votes?: number
}

const HASHTAGS = ['#RentAndDrive', '#P2PCR', '#TahoeReady', '#EagleVerified', '#RenoRides']

export default function GalleryPage() {
  const [activeTab, setActiveTab] = useState('my-photos')
  const [myPhotos, setMyPhotos] = useState<TripPhoto[]>([])
  const [communityPhotos, setCommunityPhotos] = useState<TripPhoto[]>([])
  const [contestEntries, setContestEntries] = useState<TripPhoto[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<TripPhoto | null>(null)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Mock data
    setMyPhotos([
      { id: '1', url: '/placeholder.svg', caption: 'Tahoe sunset adventure', is_public: true, likes: 24, comments: 3, uploaded_at: '2024-01-15' },
      { id: '2', url: '/placeholder.svg', caption: 'Mt Rose ski day', is_public: false, likes: 0, comments: 0, uploaded_at: '2024-01-20' },
      { id: '3', url: '/placeholder.svg', caption: 'Desert road trip', is_public: true, likes: 18, comments: 2, uploaded_at: '2024-02-01' },
    ])
    setCommunityPhotos([
      { id: 'c1', url: '/placeholder.svg', caption: 'Epic 4Runner in the snow', is_public: true, likes: 156, comments: 12, uploaded_at: '2024-01-10', user: { name: 'Alex R.', avatar: '/placeholder.svg' } },
      { id: 'c2', url: '/placeholder.svg', caption: 'Emerald Bay view', is_public: true, likes: 203, comments: 18, uploaded_at: '2024-01-12', user: { name: 'Sarah M.', avatar: '/placeholder.svg' } },
      { id: 'c3', url: '/placeholder.svg', caption: 'Jeep trail adventure', is_public: true, likes: 89, comments: 7, uploaded_at: '2024-01-14', user: { name: 'Mike T.', avatar: '/placeholder.svg' } },
      { id: 'c4', url: '/placeholder.svg', caption: 'Night drive through Reno', is_public: true, likes: 67, comments: 4, uploaded_at: '2024-01-16', user: { name: 'Chris L.', avatar: '/placeholder.svg' } },
    ])
    setContestEntries([
      { id: 'e1', url: '/placeholder.svg', caption: 'Perfect sunset shot', is_public: true, likes: 0, comments: 0, uploaded_at: '2024-02-01', user: { name: 'Jamie K.', avatar: '/placeholder.svg' }, is_contest_entry: true, votes: 45 },
      { id: 'e2', url: '/placeholder.svg', caption: 'Snow-covered adventure', is_public: true, likes: 0, comments: 0, uploaded_at: '2024-02-02', user: { name: 'Taylor P.', avatar: '/placeholder.svg' }, is_contest_entry: true, votes: 38 },
      { id: 'e3', url: '/placeholder.svg', caption: 'Mountain reflection', is_public: true, likes: 0, comments: 0, uploaded_at: '2024-02-03', user: { name: 'Jordan S.', avatar: '/placeholder.svg' }, is_contest_entry: true, votes: 52 },
    ])
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const newPhoto: TripPhoto = {
      id: Date.now().toString(),
      url: URL.createObjectURL(file),
      is_public: false,
      likes: 0,
      comments: 0,
      uploaded_at: new Date().toISOString(),
    }
    
    setMyPhotos([newPhoto, ...myPhotos])
    setUploading(false)
    toast.success('Photo uploaded!')
  }

  const togglePublic = (id: string) => {
    setMyPhotos(myPhotos.map(p => 
      p.id === id ? { ...p, is_public: !p.is_public } : p
    ))
    toast.success('Visibility updated')
  }

  const sharePhoto = (photo: TripPhoto) => {
    const url = `${window.location.origin}/rr/gallery/photo/${photo.id}`
    const text = `Check out my adventure! ${HASHTAGS.join(' ')}`
    navigator.clipboard.writeText(`${text}\n${url}`)
    setCopied(true)
    toast.success('Share link copied with hashtags!')
    setTimeout(() => setCopied(false), 2000)
  }

  const voteForEntry = (id: string) => {
    setContestEntries(contestEntries.map(e =>
      e.id === id ? { ...e, votes: (e.votes || 0) + 1 } : e
    ))
    toast.success('Vote submitted!')
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Trip Gallery</h1>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-[#CC0000] hover:bg-[#AA0000]"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </Button>
        </div>
      </div>

      {/* Monthly Contest Banner */}
      <Card className="bg-gradient-to-r from-amber-900/30 to-amber-700/30 border-amber-500/30">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Trophy className="h-10 w-10 text-amber-400" />
              <div>
                <h3 className="font-bold text-white text-lg">February Photo Contest</h3>
                <p className="text-amber-300/80 text-sm">Share your best winter adventure shot! Top 3 win free rental days.</p>
              </div>
            </div>
            <Badge className="bg-amber-500 text-black text-sm px-4 py-1">
              Ends Feb 28
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="my-photos" className="data-[state=active]:bg-[#CC0000]">
            My Photos
          </TabsTrigger>
          <TabsTrigger value="community" className="data-[state=active]:bg-[#CC0000]">
            Community
          </TabsTrigger>
          <TabsTrigger value="contest" className="data-[state=active]:bg-[#CC0000]">
            Contest
          </TabsTrigger>
        </TabsList>

        {/* My Photos */}
        <TabsContent value="my-photos" className="mt-6">
          {myPhotos.length === 0 ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="text-center py-12">
                <Upload className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">No photos yet. Upload your first adventure!</p>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#CC0000] hover:bg-[#AA0000]"
                >
                  Upload Photo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {myPhotos.map(photo => (
                <div 
                  key={photo.id} 
                  className="break-inside-avoid bg-slate-900 rounded-lg overflow-hidden border border-slate-800 group"
                >
                  <div className="relative">
                    <Image
                      src={photo.url}
                      alt={photo.caption || 'Trip photo'}
                      width={400}
                      height={300}
                      className="w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => togglePublic(photo.id)}>
                        {photo.is_public ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => sharePhoto(photo)}>
                        {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Badge className={`absolute top-2 right-2 ${photo.is_public ? 'bg-green-500' : 'bg-slate-600'}`}>
                      {photo.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    </Badge>
                  </div>
                  <div className="p-3">
                    {photo.caption && (
                      <p className="text-sm text-slate-300 mb-2">{photo.caption}</p>
                    )}
                    <div className="flex items-center gap-4 text-slate-500 text-sm">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {photo.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> {photo.comments}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Community Photos */}
        <TabsContent value="community" className="mt-6">
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {communityPhotos.map(photo => (
              <div 
                key={photo.id}
                className="break-inside-avoid bg-slate-900 rounded-lg overflow-hidden border border-slate-800"
              >
                <div className="relative">
                  <Image
                    src={photo.url}
                    alt={photo.caption || 'Community photo'}
                    width={400}
                    height={300}
                    className="w-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 rounded-full bg-slate-700 overflow-hidden">
                      <Image src={photo.user?.avatar || '/placeholder.svg'} alt="" width={24} height={24} />
                    </div>
                    <span className="text-sm text-slate-300">{photo.user?.name}</span>
                  </div>
                  {photo.caption && (
                    <p className="text-sm text-slate-400 mb-2">{photo.caption}</p>
                  )}
                  <div className="flex items-center gap-4 text-slate-500 text-sm">
                    <button className="flex items-center gap-1 hover:text-[#CC0000] transition-colors">
                      <Heart className="h-4 w-4" /> {photo.likes}
                    </button>
                    <button className="flex items-center gap-1 hover:text-[#CC0000] transition-colors">
                      <MessageCircle className="h-4 w-4" /> {photo.comments}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Contest Entries */}
        <TabsContent value="contest" className="mt-6">
          <Card className="bg-slate-900 border-slate-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                February Photo Contest
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">
                Vote for your favorite winter adventure photo! Top 3 winners receive free rental days.
                You can vote once per entry.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contestEntries.map((entry, i) => (
              <Card key={entry.id} className="bg-slate-900 border-slate-800 overflow-hidden">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={entry.url}
                    alt={entry.caption || 'Contest entry'}
                    fill
                    className="object-cover"
                  />
                  {i < 3 && (
                    <Badge className={`absolute top-2 left-2 ${
                      i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : 'bg-amber-700'
                    }`}>
                      #{i + 1}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-slate-700 overflow-hidden">
                      <Image src={entry.user?.avatar || '/placeholder.svg'} alt="" width={32} height={32} />
                    </div>
                    <span className="font-medium text-white">{entry.user?.name}</span>
                  </div>
                  {entry.caption && (
                    <p className="text-sm text-slate-400 mb-4">{entry.caption}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-amber-400">{entry.votes} votes</span>
                    <Button 
                      size="sm" 
                      className="bg-[#CC0000] hover:bg-[#AA0000]"
                      onClick={() => voteForEntry(entry.id)}
                    >
                      Vote
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Hashtag Suggestions */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Share with Hashtags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {HASHTAGS.map(tag => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="border-[#CC0000] text-[#CC0000] cursor-pointer hover:bg-[#CC0000]/10"
                onClick={() => {
                  navigator.clipboard.writeText(tag)
                  toast.success(`${tag} copied!`)
                }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
