import { generateText } from 'ai'
import { NextResponse } from 'next/server'

interface DLExtractedData {
  name?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  licenseNumber?: string
  issueDate?: string
  expirationDate?: string
  dateOfBirth?: string
  issuingState?: string
}

interface InsuranceExtractedData {
  policyNumber?: string
  insurerName?: string
  effectiveDate?: string
  expirationDate?: string
  insuredName?: string
  vehicleYear?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleVin?: string
  coverageTypes?: string[]
}

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
      prompt = `You are a document verification specialist. Analyze this driver's license image carefully and extract all visible information.

EXTRACTION TASKS:
1. Extract all readable text fields from the license
2. Determine if this appears to be a legitimate government-issued driver's license
3. Check for signs of tampering, editing, or forgery (misaligned text, inconsistent fonts, blur around text, unusual formatting)
4. Verify the license is not expired based on visible dates

Respond ONLY with this exact JSON structure (use null for fields you cannot read clearly):
{
  "valid": true/false,
  "confidence": "high" | "medium" | "low",
  "documentType": "driver_license",
  "extractedData": {
    "name": "Full name on license or null",
    "address": "Street address or null",
    "city": "City or null",
    "state": "State abbreviation or null",
    "zipCode": "ZIP code or null",
    "licenseNumber": "License number or null",
    "issueDate": "Issue date (MM/DD/YYYY format) or null",
    "expirationDate": "Expiration date (MM/DD/YYYY format) or null",
    "dateOfBirth": "DOB (MM/DD/YYYY format) or null",
    "issuingState": "Two-letter state code or null"
  },
  "concerns": ["List any specific concerns here"],
  "analysis": {
    "isExpired": true/false/null,
    "isReadable": true/false,
    "appearsGenuine": true/false,
    "tamperingIndicators": ["List any tampering signs or empty array"]
  },
  "summary": "One sentence summary of the document validity"
}`
    } else if (docType === 'insurance') {
      const vehicleInfo = vehicleInfoStr ? JSON.parse(vehicleInfoStr) : null
      const vehicleDetails = vehicleInfo 
        ? `\n\nIMPORTANT: The vehicle being listed is a ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}. Check if the insurance card covers this specific vehicle or could reasonably cover it.` 
        : ''
      
      prompt = `You are an insurance document verification specialist. Analyze this auto insurance card/document image carefully and extract all visible information.${vehicleDetails}

EXTRACTION TASKS:
1. Extract all readable text fields from the insurance document
2. Determine if this appears to be a legitimate insurance card or policy document
3. Check coverage dates - is the policy currently active?
4. If vehicle info is visible, verify it matches the listed vehicle
5. Check for signs of tampering or forgery

Respond ONLY with this exact JSON structure (use null for fields you cannot read clearly):
{
  "valid": true/false,
  "confidence": "high" | "medium" | "low",
  "documentType": "insurance_card",
  "extractedData": {
    "policyNumber": "Policy/ID number or null",
    "insurerName": "Insurance company name or null",
    "effectiveDate": "Policy start date (MM/DD/YYYY) or null",
    "expirationDate": "Policy end date (MM/DD/YYYY) or null",
    "insuredName": "Name of insured person or null",
    "vehicleYear": "Vehicle year if visible or null",
    "vehicleMake": "Vehicle make if visible or null",
    "vehicleModel": "Vehicle model if visible or null",
    "vehicleVin": "VIN if visible or null",
    "coverageTypes": ["List of coverage types visible or empty array"]
  },
  "concerns": ["List any specific concerns here"],
  "analysis": {
    "isExpired": true/false/null,
    "isReadable": true/false,
    "appearsGenuine": true/false,
    "vehicleMatch": "match" | "mismatch" | "unknown",
    "vehicleMatchDetails": "Explanation of vehicle match status"
  },
  "summary": "One sentence summary of the document validity"
}`
    } else {
      return NextResponse.json({ valid: false, message: 'Invalid document type' }, { status: 400 })
    }

    // Use Grok vision model for analysis (primary)
    // Falls back gracefully if unavailable
    let result
    try {
      result = await generateText({
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
        maxOutputTokens: 1000,
      })
    } catch (grokError) {
      console.error('[Grok Vision Error, trying OpenAI]', grokError)
      // Fallback to OpenAI GPT-4 Vision
      try {
        result = await generateText({
          model: 'openai/gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image', image: `data:${mimeType};base64,${base64}` },
                { type: 'text', text: prompt }
              ]
            }
          ],
          maxOutputTokens: 1000,
        })
      } catch (openaiError) {
        console.error('[OpenAI Vision Error]', openaiError)
        throw new Error('All vision models unavailable')
      }
    }

    // Parse the AI response
    const responseText = result.text
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      // If no JSON, return generic response
      const isValid = responseText.toLowerCase().includes('valid') && !responseText.toLowerCase().includes('invalid')
      return NextResponse.json({
        valid: isValid,
        message: isValid ? 'Document appears valid' : 'Could not verify document clearly',
        extractedData: null,
        analysis: null
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

    // Add vehicle match warning if applicable
    if (docType === 'insurance' && analysis.analysis?.vehicleMatch === 'mismatch') {
      message = `Vehicle mismatch detected: ${analysis.analysis.vehicleMatchDetails}`
    }

    return NextResponse.json({
      valid: analysis.valid,
      confidence: analysis.confidence,
      message,
      concerns: analysis.concerns || [],
      extractedData: analysis.extractedData || null,
      analysis: analysis.analysis || null,
      documentType: analysis.documentType
    })

  } catch (error) {
    console.error('[Document Validation Error]', error)
    
    // Fallback - don't block the user, but indicate manual review needed
    return NextResponse.json({
      valid: true,
      message: 'Auto-validation unavailable - document accepted pending manual review',
      confidence: 'low',
      extractedData: null,
      analysis: null,
      manualReviewRequired: true
    })
  }
}
