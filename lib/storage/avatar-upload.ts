import { createClient } from '@/lib/supabase/client'

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const supabase = createClient()

  // Validate file
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new Error('File size must be under 5MB')
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File must be JPEG, PNG, WebP, or GIF')
  }

  // Create unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) {
    console.error('Avatar upload error:', error)
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  // Update profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (updateError) {
    throw new Error(`Profile update failed: ${updateError.message}`)
  }

  return publicUrl
}

export async function deleteOldAvatar(
  userId: string,
  currentAvatarUrl: string
): Promise<void> {
  if (!currentAvatarUrl) return
  const supabase = createClient()

  // Extract path from URL
  const urlParts = currentAvatarUrl.split('/avatars/')
  if (urlParts.length < 2) return

  const filePath = urlParts[1]
  await supabase.storage.from('avatars').remove([filePath])
}
