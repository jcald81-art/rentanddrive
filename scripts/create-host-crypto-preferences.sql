-- Host crypto payout preferences table
CREATE TABLE IF NOT EXISTS host_crypto_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  accepts_crypto BOOLEAN DEFAULT false,
  preferred_currency TEXT DEFAULT 'usdc' CHECK (preferred_currency IN ('usdc', 'usdt')),
  payout_method TEXT DEFAULT 'bank' CHECK (payout_method IN ('bank', 'crypto_wallet', 'coinbase')),
  wallet_address TEXT,
  wallet_network TEXT CHECK (wallet_network IN ('ethereum', 'solana', 'polygon', 'base')),
  coinbase_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_host_crypto_preferences_user_id ON host_crypto_preferences(user_id);

-- Enable RLS
ALTER TABLE host_crypto_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own crypto preferences"
  ON host_crypto_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own crypto preferences"
  ON host_crypto_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crypto preferences"
  ON host_crypto_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Also track crypto payments in bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS crypto_currency TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS crypto_transaction_id TEXT;
