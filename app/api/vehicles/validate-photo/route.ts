import { NextRequest, NextResponse } from 'next/server'

interface PhotoValidationResult {
  valid: boolean
  quality: 'excellent' | 'good' | 'needs_retake'
  issues: string[]
  detectedAngle?: string
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    // Get image dimensions by reading the file
    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    
    // Simple dimension check - in production would use sharp or similar
    // For now, check file size as a proxy for quality
    const fileSizeKB = file.size / 1024
    const issues: string[] = []
    let quality: 'excellent' | 'good' | 'needs_retake' = 'excellent'

    // File size checks
    if (fileSizeKB < 50) {
      issues.push('Image resolution too low (less than 640x320)')
      quality = 'needs_retake'
    } else if (fileSizeKB < 100) {
      issues.push('Image could be higher resolution')
      quality = 'good'
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!validTypes.includes(file.type)) {
      issues.push('Unsupported image format. Use JPEG, PNG, or WebP.')
      quality = 'needs_retake'
    }

    // Simple heuristic for detecting angle based on filename or metadata
    // In production, would use ML model for angle detection
    const filename = file.name.toLowerCase()
    let detectedAngle: string | undefined

    if (filename.includes('front') && !filename.includes('quarter')) {
      detectedAngle = 'front'
    } else if (filename.includes('back') || filename.includes('rear')) {
      detectedAngle = filename.includes('quarter') ? '3/4 back' : 'back'
    } else if (filename.includes('left') || filename.includes('driver')) {
      detectedAngle = 'left side'
    } else if (filename.includes('right') || filename.includes('passenger')) {
      detectedAngle = 'right side'
    } else if (filename.includes('dash') || filename.includes('interior')) {
      detectedAngle = 'dashboard'
    } else if (filename.includes('trunk') || filename.includes('cargo')) {
      detectedAngle = 'trunk'
    } else if (filename.includes('seat')) {
      detectedAngle = 'back seat'
    }

    const result: PhotoValidationResult = {
      valid: quality !== 'needs_retake',
      quality,
      issues,
      detectedAngle,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[validate-photo] Error:', error)
    return NextResponse.json(
      { error: 'Failed to validate photo' },
      { status: 500 }
    )
  }
}
