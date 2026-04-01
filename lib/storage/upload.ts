'use server'

import { createClient } from '@/lib/supabase/server'

export type UploadBucket = 'avatars' | 'vehicles' | 'licenses'

export interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

/**
 * Server-side image upload to Supabase Storage
 * Handles compression, validation, and returns public URL
 */
export async function uploadImage(
  bucket: UploadBucket,
  file: File,
  folder: string,
  filename?: string
): Promise<UploadResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (bucket === 'licenses') {
      allowedTypes.push('application/pdf')
    }
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` }
    }

    // Validate file size (5MB for avatars/licenses, 10MB for vehicles)
    const maxSize = bucket === 'vehicles' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      return { success: false, error: `File too large. Max: ${maxSize / 1024 / 1024}MB` }
    }

    // Generate filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const name = filename || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const path = `${folder}/${name}.${ext}`

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      console.error('[Upload] Storage error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    }
  } catch (err: any) {
    console.error('[Upload] Unexpected error:', err)
    return { success: false, error: err.message || 'Upload failed' }
  }
}

/**
 * Upload avatar image for current user
 */
export async function uploadAvatar(file: File): Promise<UploadResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }
  
  const result = await uploadImage('avatars', file, user.id, 'avatar')
  
  if (result.success && result.url) {
    // Update profile with new avatar URL
    await supabase
      .from('profiles')
      .update({ avatar_url: result.url })
      .eq('id', user.id)
  }
  
  return result
}

/**
 * Upload vehicle image
 */
export async function uploadVehicleImage(
  vehicleId: string,
  file: File,
  imageType: 'exterior' | 'interior' | 'detail' = 'exterior'
): Promise<UploadResult> {
  return uploadImage('vehicles', file, vehicleId, `${imageType}-${Date.now()}`)
}

/**
 * Upload driver license image
 */
export async function uploadLicenseImage(
  file: File,
  side: 'front' | 'back'
): Promise<UploadResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }
  
  return uploadImage('licenses', file, user.id, `license-${side}`)
}

/**
 * Get signed URL for private files (licenses)
 */
export async function getSignedUrl(
  bucket: UploadBucket,
  path: string,
  expiresIn: number = 3600
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)
    
    if (error) {
      return { error: error.message }
    }
    
    return { url: data.signedUrl }
  } catch (err: any) {
    return { error: err.message || 'Failed to get signed URL' }
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(
  bucket: UploadBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase.storage.from(bucket).remove([path])
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Delete failed' }
  }
}
