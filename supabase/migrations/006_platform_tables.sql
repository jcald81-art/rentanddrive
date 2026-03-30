-- Rent and Drive LLC - Platform Features Tables Migration

-- Ride Concierge (Lyft/Uber coordination)
CREATE TABLE IF NOT EXISTS ride_concierge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ride_type TEXT CHECK (ride_type IN ('pickup', 'return')) NOT NULL,
  provider TEXT CHECK (provider IN ('lyft', 'uber', 'manual')) DEFAULT 'lyft',
  status TEXT CHECK (status IN (
    'requested', 'scheduled', 'driver_assigned', 'en_route',
    'arrived', 'in_progress', 'completed', 'cancelled', 'failed'
  )) DEFAULT 'requested',
  -- Pickup/dropoff details
  pickup_address TEXT NOT NULL,
  pickup_lat DECIMAL(10, 8),
  pickup_lng DECIMAL(11, 8),
  dropoff_address TEXT NOT NULL,
  dropoff_lat DECIMAL(10, 8),
  dropoff_lng DECIMAL(11, 8),
  -- Scheduling
  scheduled_time TIMESTAMPTZ NOT NULL,
  estimated_arrival TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  -- Pricing
  estimated_cost_cents INTEGER,
  actual_cost_cents INTEGER,
  paid_by TEXT CHECK (paid_by IN ('platform', 'renter', 'host')) DEFAULT 'renter',
  -- Provider details
  provider_ride_id TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  driver_photo_url TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  vehicle_license_plate TEXT,
  -- Tracking
  tracking_url TEXT,
  last_driver_lat DECIMAL(10, 8),
  last_driver_lng DECIMAL(11, 8),
  last_updated_at TIMESTAMPTZ,
  -- Errors
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Rewards
CREATE TABLE IF NOT EXISTS social_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT CHECK (platform IN ('instagram', 'tiktok', 'facebook', 'twitter', 'youtube')) NOT NULL,
  post_url TEXT NOT NULL,
  post_type TEXT CHECK (post_type IN ('photo', 'reel', 'video', 'story', 'carousel')) NOT NULL,
  -- Reward details
  reward_amount_cents INTEGER NOT NULL DEFAULT 1500,
  discount_code TEXT,
  discount_code_expires_at TIMESTAMPTZ,
  discount_code_used BOOLEAN DEFAULT FALSE,
  discount_code_used_at TIMESTAMPTZ,
  -- Verification
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'expired')) DEFAULT 'pending',
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  -- Engagement metrics (estimated)
  estimated_impressions INTEGER DEFAULT 0,
  estimated_reach INTEGER DEFAULT 0,
  follower_count INTEGER,
  -- Screenshot verification
  screenshot_url TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Settings
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Events (for analytics/audit)
CREATE TABLE IF NOT EXISTS platform_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  device_type TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  page_url TEXT,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'qualified', 'rewarded', 'expired')) DEFAULT 'pending',
  -- Qualification criteria
  referred_first_booking_id UUID REFERENCES bookings(id),
  qualified_at TIMESTAMPTZ,
  -- Rewards
  referrer_reward_cents INTEGER DEFAULT 2500,
  referred_reward_cents INTEGER DEFAULT 2500,
  referrer_credit_id UUID REFERENCES user_credits(id),
  referred_credit_id UUID REFERENCES user_credits(id),
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- Promo Codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount')) NOT NULL,
  discount_value INTEGER NOT NULL,
  max_discount_cents INTEGER,
  min_booking_cents INTEGER,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_first_booking_only BOOLEAN DEFAULT FALSE,
  allowed_categories TEXT[],
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo Code Usage
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  discount_applied_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(promo_code_id, booking_id)
);

-- Disputes
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dispute_type TEXT CHECK (dispute_type IN (
    'damage', 'cleanliness', 'vehicle_condition', 'late_return',
    'no_show', 'cancellation', 'billing', 'safety', 'other'
  )) NOT NULL,
  description TEXT NOT NULL,
  amount_disputed_cents INTEGER,
  status TEXT CHECK (status IN ('open', 'under_review', 'resolved', 'escalated', 'closed')) DEFAULT 'open',
  resolution TEXT,
  resolution_amount_cents INTEGER,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  -- Stripe dispute
  stripe_dispute_id TEXT,
  -- Evidence
  evidence_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for platform tables
CREATE INDEX IF NOT EXISTS idx_ride_concierge_booking ON ride_concierge(booking_id);
CREATE INDEX IF NOT EXISTS idx_ride_concierge_user ON ride_concierge(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_concierge_status ON ride_concierge(status);

CREATE INDEX IF NOT EXISTS idx_social_rewards_booking ON social_rewards(booking_id);
CREATE INDEX IF NOT EXISTS idx_social_rewards_user ON social_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_social_rewards_status ON social_rewards(status);

CREATE INDEX IF NOT EXISTS idx_platform_events_user ON platform_events(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_events_type ON platform_events(event_type);
CREATE INDEX IF NOT EXISTS idx_platform_events_created ON platform_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_disputes_booking ON disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
