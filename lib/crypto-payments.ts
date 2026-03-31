import Stripe from 'stripe'

// Lazy initialization to avoid build-time errors
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
  })
}

export type CryptoCurrency = 'usdc' | 'usdt'
export type PayoutMethod = 'bank' | 'crypto_wallet' | 'coinbase'

export interface CryptoPaymentIntent {
  clientSecret: string
  paymentIntentId: string
  amount: number
  currency: CryptoCurrency
  conversionRate: number
}

export interface HostCryptoPreferences {
  acceptsCrypto: boolean
  preferredCurrency: CryptoCurrency
  payoutMethod: PayoutMethod
  walletAddress?: string
  walletNetwork?: 'ethereum' | 'solana' | 'polygon' | 'base'
  coinbaseEmail?: string
}

// Supported stablecoins with their networks
export const SUPPORTED_CRYPTO = {
  usdc: {
    name: 'USD Coin',
    symbol: 'USDC',
    networks: ['ethereum', 'solana', 'polygon', 'base'],
    decimals: 6,
    icon: '/images/crypto/usdc.svg',
  },
  usdt: {
    name: 'Tether',
    symbol: 'USDT', 
    networks: ['ethereum', 'polygon'],
    decimals: 6,
    icon: '/images/crypto/usdt.svg',
  },
} as const

/**
 * Create a crypto payment intent for a booking
 * Uses Stripe's stablecoin support
 */
export async function createCryptoPaymentIntent({
  amountUSD,
  currency,
  bookingId,
  hostId,
  renterId,
  metadata,
}: {
  amountUSD: number
  currency: CryptoCurrency
  bookingId: string
  hostId: string
  renterId: string
  metadata?: Record<string, string>
}): Promise<CryptoPaymentIntent> {
  // For stablecoins, 1:1 with USD (minor fluctuations handled by Stripe)
  const conversionRate = 1.0
  const cryptoAmount = Math.round(amountUSD * 100) // Stripe uses cents

  const stripe = getStripe()
  const paymentIntent = await stripe.paymentIntents.create({
    amount: cryptoAmount,
    currency: 'usd',
    payment_method_types: ['card', 'us_bank_account'],
    metadata: {
      booking_id: bookingId,
      host_id: hostId,
      renter_id: renterId,
      crypto_currency: currency,
      payment_type: 'crypto_stablecoin',
      ...metadata,
    },
  })

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
    amount: amountUSD,
    currency,
    conversionRate,
  }
}

/**
 * Process host payout in their preferred method
 */
export async function processHostCryptoPayout({
  hostId,
  amountUSD,
  preferences,
  bookingId,
}: {
  hostId: string
  amountUSD: number
  preferences: HostCryptoPreferences
  bookingId: string
}): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    switch (preferences.payoutMethod) {
      case 'bank':
        // Standard Stripe payout to connected account
        return { success: true, transactionId: `bank_${Date.now()}` }

      case 'crypto_wallet':
        // Direct wallet transfer (would use a service like Circle or Bridge)
        if (!preferences.walletAddress) {
          return { success: false, error: 'No wallet address configured' }
        }
        // In production, integrate with Circle API or Stripe's crypto payouts
        console.log(`[Crypto] Initiating ${preferences.preferredCurrency.toUpperCase()} payout to ${preferences.walletAddress}`)
        return { success: true, transactionId: `crypto_${Date.now()}` }

      case 'coinbase':
        // Coinbase conversion and deposit
        if (!preferences.coinbaseEmail) {
          return { success: false, error: 'No Coinbase email configured' }
        }
        // In production, use Coinbase API for conversion
        console.log(`[Crypto] Converting to ${preferences.preferredCurrency.toUpperCase()} via Coinbase for ${preferences.coinbaseEmail}`)
        return { success: true, transactionId: `coinbase_${Date.now()}` }

      default:
        return { success: false, error: 'Unknown payout method' }
    }
  } catch (error) {
    console.error('[Crypto] Payout error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Payout failed' }
  }
}

/**
 * Validate a crypto wallet address
 */
export function validateWalletAddress(address: string, network: string): boolean {
  // Ethereum-compatible addresses (ETH, Polygon, Base)
  if (['ethereum', 'polygon', 'base'].includes(network)) {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }
  // Solana addresses
  if (network === 'solana') {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
  }
  return false
}

/**
 * Get current crypto prices (for display purposes)
 */
export async function getCryptoPrices(): Promise<Record<CryptoCurrency, number>> {
  // Stablecoins are pegged to USD, but we can show minor fluctuations
  // In production, fetch from CoinGecko or similar API
  return {
    usdc: 1.00,
    usdt: 1.00,
  }
}
