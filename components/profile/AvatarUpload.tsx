'use client'

import { useState, useRef } from 'react'
import { uploadAvatar, deleteOldAvatar } from '@/lib/storage/avatar-upload'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface AvatarUploadProps {
  user: User | null
  profile: {
    avatar_url?: string | null
    first_name?: string | null
    last_name?: string | null
  } | null
  onUploadComplete?: (newUrl: string) => void
}

export function AvatarUpload({ user, profile, onUploadComplete }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    setError('')

    try {
      // Delete old avatar if exists
      if (profile?.avatar_url) {
        await deleteOldAvatar(user.id, profile.avatar_url)
      }

      // Upload new avatar
      const newUrl = await uploadAvatar(user.id, file)
      onUploadComplete?.(newUrl)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const avatarUrl = preview || profile?.avatar_url
  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'R'

  return (
    <div className="flex items-center gap-4">
      {/* Avatar display */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative w-[72px] h-[72px] rounded-full overflow-hidden cursor-pointer flex-shrink-0 border-2 border-border flex items-center justify-center"
        style={{
          background: avatarUrl ? 'transparent' : '#2D4A2D',
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl font-medium text-[#F5F2EC]">
            {initials}
          </span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-[11px] text-white font-medium">
          {uploading ? 'Uploading...' : 'Change'}
        </div>
      </div>

      <div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-[13px] px-3.5 py-1.5 border border-border rounded-lg bg-background text-foreground disabled:cursor-not-allowed disabled:opacity-60 hover:bg-muted transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload photo'}
        </button>
        <div className="text-[11px] text-muted-foreground mt-1">
          JPEG, PNG, WebP or GIF - Max 5MB
        </div>
        {error && (
          <div className="text-[11px] text-destructive mt-1">
            {error}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
