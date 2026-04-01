import { generateText } from 'ai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const docType = formData.get('type') as string
    const vehicleInfoStr = formData.get('vehicleInfo') as string | null
    
    if (!file) {
      return NextResponse.json({ valid: false, message: 'No file provided' }, { status: 400 })
    }

    // Convert file to base64 for AI analysis
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type || 'image/jpeg'

    // Build the prompt based on document type
    let prompt: string
    if (docType === 'license') {
      prompt = `Analyze this image of a driver's license. Check for:
1. Does it appear to be a legitimate government-issued driver's license?
2. Is the text readable and clear?
3. Are there any obvious signs of tampering, editing, or fakery (e.g., misaligned text, inconsistent fonts, blur around text)?
4. Can you see a photo, name, and expiration date?

Respond in JSON format:
{
  "valid": boolean (true if it looks like a real, unexpired license with readable info),
  "confidence": "high" | "medium" | "low",
  "concerns": string[] (list any specific concerns, empty if none),
  "summary": string (brief one-line summary)
}`
    } else if (docType === 'insurance') {
      const vehicleInfo = vehicleInfoStr ? JSON.parse(vehicleInfoStr) : null
      const vehicleDetails = vehicleInfo 
        ? `The vehicle being listed is a ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}.` 
        : ''
      
      prompt = `Analyze this image of an auto insurance card/document. ${vehicleDetails}

Check for:
1. Does it appear to be a legitimate insurance document (insurance card, declaration page, or policy document)?
2. Is the text readable?
3. Is there a visible policy number, insurance company name, and coverage dates?
4. If coverage dates are visible, does the policy appear to be current/not expired?
5. Any signs of tampering or fakery?
${vehicleInfo ? `6. If vehicle details are visible, do they match or could plausibly cover the ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}?` : ''}

Respond in JSON format:
{
  "valid": boolean (true if it looks like valid, current insurance),
  "confidence": "high" | "medium" | "low",
  "concerns": string[] (list any concerns including expiration, vehicle mismatch, etc.),
  "summary": string (brief one-line summary)
}`
    } else {
      return NextResponse.json({ valid: false, message: 'Invalid document type' }, { status: 400 })
    }

    // Use Grok vision model for analysis (model string format for Vercel AI Gateway)
    const result = await generateText({
      model: 'xai/grok-2-vision-1212',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', image: `data:${mimeType};base64,${base64}` },
            { type: 'text', text: prompt }
          ]
        }
      ],
      maxOutputTokens: 500,
    })

    // Parse the AI response
    const responseText = result.text
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      // If no JSON, try to interpret the response
      const isValid = responseText.toLowerCase().includes('valid') && !responseText.toLowerCase().includes('invalid')
      return NextResponse.json({
        valid: isValid,
        message: isValid ? 'Document appears valid' : 'Could not verify document clearly'
      })
    }

    const analysis = JSON.parse(jsonMatch[0])
    
    // Build user-friendly message
    let message: string
    if (analysis.valid) {
      message = analysis.summary || 'Document looks valid'
      if (analysis.confidence === 'medium') {
        message += ' (some details unclear)'
      }
    } else {
      const concerns = analysis.concerns?.slice(0, 2).join('; ') || 'Issues detected'
      message = `Concerns: ${concerns}`
    }

    return NextResponse.json({
      valid: analysis.valid,
      confidence: analysis.confidence,
      message,
      concerns: analysis.concerns || []
    })

  } catch (error) {
    console.error('[Document Validation Error]', error)
    
    // Fallback - don't block the user, just warn them
    return NextResponse.json({
      valid: true,
      message: 'Auto-validation unavailable - document accepted pending manual review',
      confidence: 'low'
    })
  }
}
