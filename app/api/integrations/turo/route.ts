import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  startTuroImport, 
  completeTuroImport, 
  getTuroImport,
  isValidTuroUrl 
} from '@/lib/integrations/turo-import'

// POST: Start a new Turo import
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { action, turoUrl, importId, vehicleData } = body
    
    if (action === 'start') {
      // Start new import
      if (!turoUrl) {
        return NextResponse.json({ error: 'Turo URL is required' }, { status: 400 })
      }
      
      if (!isValidTuroUrl(turoUrl)) {
        return NextResponse.json({ 
          error: 'Invalid Turo URL. Please provide a valid turo.com listing URL.' 
        }, { status: 400 })
      }
      
      const result = await startTuroImport(user.id, turoUrl)
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      
      return NextResponse.json({
        success: true,
        importId: result.importId,
        data: result.data,
        aiEnhancements: result.aiEnhancements,
      })
    }
    
    if (action === 'complete') {
      // Complete import and create vehicle
      if (!importId || !vehicleData) {
        return NextResponse.json({ 
          error: 'Import ID and vehicle data are required' 
        }, { status: 400 })
      }
      
      const result = await completeTuroImport(importId, user.id, vehicleData)
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      
      return NextResponse.json({
        success: true,
        vehicleId: result.vehicleId,
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Turo import API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// GET: Get import status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const importId = searchParams.get('importId')
    
    if (!importId) {
      // Return all imports for the user
      const { data, error } = await supabase
        .from('turo_imports')
        .select('*')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ success: true, imports: data })
    }
    
    // Return specific import
    const result = await getTuroImport(importId, user.id)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, import: result.data })
  } catch (error) {
    console.error('Turo import GET error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
