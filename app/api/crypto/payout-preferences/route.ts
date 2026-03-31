import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { validateWalletAddress, type HostCryptoPreferences, type PayoutMethod, type CryptoCurrency } from '@/lib/crypto-payments'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: preferences } = await supabase
      .from('host_crypto_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!preferences) {
      // Return default preferences
      return NextResponse.json({
        acceptsCrypto: false,
        preferredCurrency: 'usdc',
        payoutMethod: 'bank',
        walletAddress: null,
        walletNetwork: null,
        coinbaseEmail: null,
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('[Crypto] Error fetching preferences:', error)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as Partial<HostCryptoPreferences>

    // Validate wallet address if provided
    if (body.walletAddress && body.walletNetwork) {
      if (!validateWalletAddress(body.walletAddress, body.walletNetwork)) {
        return NextResponse.json({ error: 'Invalid wallet address for the selected network' }, { status: 400 })
      }
    }

    // Validate payout method requirements
    if (body.payoutMethod === 'crypto_wallet' && !body.walletAddress) {
      return NextResponse.json({ error: 'Wallet address required for crypto wallet payouts' }, { status: 400 })
    }

    if (body.payoutMethod === 'coinbase' && !body.coinbaseEmail) {
      return NextResponse.json({ error: 'Coinbase email required for Coinbase payouts' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('host_crypto_preferences')
      .upsert({
        user_id: user.id,
        accepts_crypto: body.acceptsCrypto ?? false,
        preferred_currency: body.preferredCurrency ?? 'usdc',
        payout_method: body.payoutMethod ?? 'bank',
        wallet_address: body.walletAddress ?? null,
        wallet_network: body.walletNetwork ?? null,
        coinbase_email: body.coinbaseEmail ?? null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('[Crypto] Error saving preferences:', error)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
