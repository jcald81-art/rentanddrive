'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

interface UploadResult {
  success: boolean
  documentId?: string
  filePath?: string
  error?: string
}

export async function uploadDocument(
  formData: FormData
): Promise<UploadResult> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string
    const vehicleId = formData.get('vehicleId') as string | null
    const expiryDate = formData.get('expiryDate') as string | null

    if (!file || !documentType) {
      return { success: false, error: 'Missing required fields' }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or PDF file.' }
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { success: false, error: 'File too large. Maximum size is 10MB.' }
    }

    // Generate secure file path: filing-cabinet/{user_id}/{document_type}/{timestamp}_{filename}
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${user.id}/${documentType}/${timestamp}_${sanitizedName}`

    // Upload to filing-cabinet bucket
    const { error: uploadError } = await supabase.storage
      .from('filing-cabinet')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('[upload-document] Storage error:', uploadError)
      return { success: false, error: 'Failed to upload file. Please try again.' }
    }

    // Store metadata in documents table
    const { data: doc, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        vehicle_id: vehicleId || null,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending',
        expiry_date: expiryDate || null,
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('[upload-document] DB error:', dbError)
      // Try to clean up the uploaded file
      await supabase.storage.from('filing-cabinet').remove([filePath])
      return { success: false, error: 'Failed to save document metadata.' }
    }

    return {
      success: true,
      documentId: doc.id,
      filePath: filePath,
    }
  } catch (error) {
    console.error('[upload-document] Error:', error)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

export async function getMyDocuments() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated', documents: [] }
    }

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message, documents: [] }
    }

    return { success: true, documents: documents || [] }
  } catch (error) {
    console.error('[getMyDocuments] Error:', error)
    return { success: false, error: 'Failed to fetch documents', documents: [] }
  }
}

export async function getDocumentSignedUrl(filePath: string) {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify user owns this document or is a platform manager
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('id', user.id)
      .single()

    const platformManagers = ['caldwell_joey@hotmail.com', 'jcald81@gmail.com']
    const isPlatformManager = profile?.email && platformManagers.includes(profile.email.toLowerCase())

    // Check if file path belongs to user
    if (!filePath.startsWith(user.id) && !isPlatformManager) {
      return { success: false, error: 'Access denied' }
    }

    const { data, error } = await supabase.storage
      .from('filing-cabinet')
      .createSignedUrl(filePath, 300) // 5 minute expiry

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, url: data.signedUrl }
  } catch (error) {
    console.error('[getDocumentSignedUrl] Error:', error)
    return { success: false, error: 'Failed to generate URL' }
  }
}
