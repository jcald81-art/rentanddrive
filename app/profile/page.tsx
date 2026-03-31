'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  User, 
  Phone, 
  Mail, 
  Camera, 
  Star, 
  Car, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Save,
  Home,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'


interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  bio: string | null
  is_host: boolean
  is_verified: boolean
  verification_status: 'none' | 'pending' | 'approved' | 'rejected'
  host_rating: number | null
  total_trips: number
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    bio: '',
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Get profile from profiles table
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get trip count
    const { count: tripCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact' })
      .eq('renter_id', user.id)
      .eq('status', 'completed')

    // Get verification status
    const { data: verification } = await supabase
      .from('driver_verifications')
      .select('status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const profile: Profile = {
      id: user.id,
      email: user.email || '',
      full_name: profileData?.full_name || user.user_metadata?.full_name || null,
      phone: profileData?.phone || user.user_metadata?.phone || null,
      avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url || null,
      bio: profileData?.bio || null,
      is_host: profileData?.is_host || user.user_metadata?.role === 'host',
      is_verified: verification?.status === 'approved',
      verification_status: verification?.status || 'none',
      host_rating: profileData?.host_rating || null,
      total_trips: tripCount || 0,
    }

    setProfile(profile)
    setFormData({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
      bio: profile.bio || '',
    })
    setLoading(false)
  }

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        full_name: formData.full_name,
        phone: formData.phone,
        bio: formData.bio,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      setError('Failed to save profile. Please try again.')
    } else {
      setSuccess('Profile updated successfully!')
      // Also update user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          phone: formData.phone,
        }
      })
    }

    setSaving(false)
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setUploadingAvatar(true)
    setError(null)

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      // Store in user's folder for RLS policy compliance
      const fileName = `${profile.id}/avatar-${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) {
        console.error('[v0] Avatar upload error:', uploadError)
        // Check if it's a bucket not found error
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          setError('Avatar storage is not configured. Please contact support.')
        } else if (uploadError.message?.includes('policy')) {
          setError('Permission denied. Please try logging out and back in.')
        } else {
          setError(`Failed to upload avatar: ${uploadError.message}`)
        }
        setUploadingAvatar(false)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })

      if (updateError) {
        console.error('[v0] Profile update error:', updateError)
        setError('Avatar uploaded but failed to update profile.')
        setUploadingAvatar(false)
        return
      }

      setProfile({ ...profile, avatar_url: publicUrl })
      setSuccess('Avatar updated successfully!')
    } catch (err) {
      console.error('[v0] Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#CC0000]" />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
  <div className="min-h-screen bg-muted/30">
  <div className="container max-w-4xl py-8 px-4">
    {/* Breadcrumb */}
    <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
      <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
        <Home className="h-4 w-4" />
        Home
      </Link>
      <ChevronRight className="h-4 w-4" />
      <span className="text-foreground">My Profile</span>
    </nav>
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left column - Avatar and stats */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="text-2xl bg-[#CC0000] text-white">
                        {formData.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 p-1.5 bg-background border rounded-full hover:bg-muted transition-colors"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold">
                    {formData.full_name || 'Add your name'}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    {profile.is_verified ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified Driver
                      </Badge>
                    ) : profile.verification_status === 'pending' ? (
                      <Badge variant="secondary">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Verification Pending
                      </Badge>
                    ) : (
                      <Link href="/verify">
                        <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Verify Your License
                        </Badge>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Car className="h-4 w-4" />
                    <span>Trips Completed</span>
                  </div>
                  <span className="font-semibold">{profile.total_trips}</span>
                </div>
                {profile.is_host && profile.host_rating && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Star className="h-4 w-4" />
                      <span>Host Rating</span>
                    </div>
                    <span className="font-semibold">{profile.host_rating.toFixed(1)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column - Edit form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">
                    {success}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    <User className="inline h-4 w-4 mr-2" />
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="inline h-4 w-4 mr-2" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="inline h-4 w-4 mr-2" />
                    Email Address
                  </Label>
  <Input
id="email"
type="email"
value={profile.email}
disabled
className="bg-muted"
/>
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us a bit about yourself..."
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-[#CC0000] hover:bg-[#CC0000]/90"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
