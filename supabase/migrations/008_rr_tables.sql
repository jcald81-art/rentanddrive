-- Rent and Drive LLC - Renter's Road (Renter Gamification) Tables Migration

-- Renter Road Scores (driving behavior scores)
CREATE TABLE IF NOT EXISTS renter_road_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  score DECIMAL(5, 2) DEFAULT 100.00 CHECK (score >= 0 AND score <= 100),
  -- Component scores
  speed_compliance DECIMAL(5, 2) DEFAULT 100.00,
  smooth_braking DECIMAL(5, 2) DEFAULT 100.00,
  smooth_acceleration DECIMAL(5, 2) DEFAULT 100.00,
  route_adherence DECIMAL(5, 2) DEFAULT 100.00,
  curfew_compliance DECIMAL(5, 2) DEFAULT 100.00,
  fuel_efficiency DECIMAL(5, 2) DEFAULT 100.00,
  -- Trip stats
  total_trips INTEGER DEFAULT 0,
  total_miles DECIMAL(10, 2) DEFAULT 0,
  total_hours DECIMAL(10, 2) DEFAULT 0,
  -- Violations
  speed_violations INTEGER DEFAULT 0,
  hard_brakes INTEGER DEFAULT 0,
  hard_accelerations INTEGER DEFAULT 0,
  geofence_violations INTEGER DEFAULT 0,
  curfew_violations INTEGER DEFAULT 0,
  -- Tier
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')) DEFAULT 'bronze',
  tier_updated_at TIMESTAMPTZ,
  -- History
  score_30_days_ago DECIMAL(5, 2),
  score_trend TEXT CHECK (score_trend IN ('improving', 'stable', 'declining')) DEFAULT 'stable',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Renter Badges
CREATE TABLE IF NOT EXISTS renter_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT,
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

-- Trip Photos (renter photo submissions)
CREATE TABLE IF NOT EXISTS trip_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  location_name TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  -- Visibility
  is_public BOOLEAN DEFAULT TRUE,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  -- Contest
  contest_entry BOOLEAN DEFAULT FALSE,
  contest_id UUID,
  votes INTEGER DEFAULT 0,
  -- AI analysis
  ai_tags TEXT[],
  ai_quality_score INTEGER,
  is_featured BOOLEAN DEFAULT FALSE,
  featured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photo Contests
CREATE TABLE IF NOT EXISTS photo_contests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  prize_description TEXT,
  prize_value_cents INTEGER,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  voting_end_date TIMESTAMPTZ,
  status TEXT CHECK (status IN ('upcoming', 'active', 'voting', 'completed')) DEFAULT 'upcoming',
  winner_photo_id UUID REFERENCES trip_photos(id),
  winner_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photo Votes
CREATE TABLE IF NOT EXISTS photo_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES trip_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, user_id)
);

-- Renter Rewards (tier-based rewards)
CREATE TABLE IF NOT EXISTS renter_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN (
    'discount_percentage', 'discount_fixed', 'free_upgrade',
    'priority_support', 'early_access', 'free_insurance_day'
  )),
  reward_value INTEGER,
  description TEXT,
  earned_from TEXT CHECK (earned_from IN ('tier_upgrade', 'safe_driving', 'loyalty', 'contest', 'referral')),
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  used_booking_id UUID REFERENCES bookings(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Score History (for tracking progress over time)
CREATE TABLE IF NOT EXISTS renter_score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score DECIMAL(5, 2) NOT NULL,
  speed_compliance DECIMAL(5, 2),
  smooth_braking DECIMAL(5, 2),
  smooth_acceleration DECIMAL(5, 2),
  trip_id UUID REFERENCES trip_records(id),
  booking_id UUID REFERENCES bookings(id),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Host Blocked Renters
CREATE TABLE IF NOT EXISTS host_blocked_renters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(host_id, renter_id)
);

-- Indexes for Renter's Road tables
CREATE INDEX IF NOT EXISTS idx_renter_road_scores_user ON renter_road_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_renter_road_scores_score ON renter_road_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_renter_road_scores_tier ON renter_road_scores(tier);

CREATE INDEX IF NOT EXISTS idx_renter_badges_user ON renter_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_renter_badges_type ON renter_badges(badge_type);

CREATE INDEX IF NOT EXISTS idx_trip_photos_booking ON trip_photos(booking_id);
CREATE INDEX IF NOT EXISTS idx_trip_photos_user ON trip_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_photos_public ON trip_photos(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_trip_photos_contest ON trip_photos(contest_id) WHERE contest_entry = TRUE;
CREATE INDEX IF NOT EXISTS idx_trip_photos_featured ON trip_photos(is_featured) WHERE is_featured = TRUE;

CREATE INDEX IF NOT EXISTS idx_photo_contests_status ON photo_contests(status);
CREATE INDEX IF NOT EXISTS idx_photo_votes_photo ON photo_votes(photo_id);

CREATE INDEX IF NOT EXISTS idx_renter_rewards_user ON renter_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_renter_rewards_unused ON renter_rewards(user_id) WHERE is_used = FALSE;

CREATE INDEX IF NOT EXISTS idx_renter_score_history_user ON renter_score_history(user_id);
CREATE INDEX IF NOT EXISTS idx_renter_score_history_time ON renter_score_history(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_host_blocked_renters_host ON host_blocked_renters(host_id);
CREATE INDEX IF NOT EXISTS idx_host_blocked_renters_renter ON host_blocked_renters(renter_id);
