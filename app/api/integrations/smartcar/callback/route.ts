import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, getVehicleIds, connectVehicle } from '@/lib/integrations/smartcar'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('[v0] Smartcar OAuth error:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/host/vehicles?error=smartcar_denied`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/host/vehicles?error=smartcar_invalid`
      )
    }

    // Decode state
    let stateData: { vehicleId: string; hostId: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/host/vehicles?error=smartcar_invalid_state`
      )
    }

    // Exchange code for tokens
    const tokens = await exchangeCode(code)
    if (!tokens) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/host/vehicles?error=smartcar_token_failed`
      )
    }

    // Get vehicle IDs from Smartcar
    const vehicleIds = await getVehicleIds(tokens.access_token)
    if (!vehicleIds.length) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/host/vehicles?error=smartcar_no_vehicles`
      )
    }

    // Connect the first vehicle (in production, you might want to let users choose)
    const result = await connectVehicle(
      stateData.vehicleId,
      stateData.hostId,
      tokens,
      vehicleIds[0]
    )

    if (!result.success) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/host/vehicles?error=smartcar_connect_failed`
      )
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/host/vehicles/${stateData.vehicleId}/settings?smartcar=connected`
    )
  } catch (error) {
    console.error('[v0] Smartcar callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/host/vehicles?error=smartcar_error`
    )
  }
}
