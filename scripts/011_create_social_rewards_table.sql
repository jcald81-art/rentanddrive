-- Social Rewards Table for tracking social media posts and discounts
CREATE TABLE IF NOT EXISTS social_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'facebook', 'twitter', 'youtube')),
  post_url TEXT NOT NULL,
  post_type VARCHAR(50) NOT NULL CHECK (post_type IN ('photo', 'reel', 'video', 'story', 'review')),
  caption TEXT,
  
  -- Reward details
  reward_amount_cents INTEGER NOT NULL DEFAULT 1000, -- $10 default
  discount_code VARCHAR(50),
  discount_code_used BOOLEAN DEFAULT FALSE,
  discount_code_used_at TIMESTAMPTZ,
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  rejection_reason TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  -- Social metrics (estimated)
  estimated_impressions INTEGER DEFAULT 0,
  estimated_reach INTEGER DEFAULT 0,
  follower_count INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

-- Indexes
CREATE INDEX idx_social_rewards_user ON social_rewards(user_id);
CREATE INDEX idx_social_rewards_booking ON social_rewards(booking_id);
CREATE INDEX idx_social_rewards_status ON social_rewards(status);
CREATE INDEX idx_social_rewards_platform ON social_rewards(platform);
CREATE INDEX idx_social_rewards_created ON social_rewards(created_at DESC);

-- Prevent duplicate submissions for same booking
CREATE UNIQUE INDEX idx_social_rewards_booking_platform ON social_rewards(booking_id, platform);

-- RLS Policies
ALTER TABLE social_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own rewards
CREATE POLICY "Users can view own rewards"
  ON social_rewards FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own rewards
CREATE POLICY "Users can submit rewards"
  ON social_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all rewards
CREATE POLICY "Admins can view all rewards"
  ON social_rewards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update rewards (approve/reject)
CREATE POLICY "Admins can update rewards"
  ON social_rewards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_social_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_rewards_updated_at
  BEFORE UPDATE ON social_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_social_rewards_updated_at();
