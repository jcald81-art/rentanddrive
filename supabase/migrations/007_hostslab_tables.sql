-- Rent and Drive LLC - Host's Lab Gamification Tables Migration

-- Host Lab Levels (gamification progression)
CREATE TABLE IF NOT EXISTS host_lab_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 100),
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  rank TEXT CHECK (rank IN ('rookie', 'pro', 'elite', 'legend')) DEFAULT 'rookie',
  badges JSONB DEFAULT '[]'::JSONB,
  streak_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  -- Stats
  total_trips_hosted INTEGER DEFAULT 0,
  total_earnings_cents INTEGER DEFAULT 0,
  total_five_star_reviews INTEGER DEFAULT 0,
  avg_response_time_minutes INTEGER,
  acceptance_rate DECIMAL(5, 2) DEFAULT 100.0,
  -- Milestones
  first_booking_at TIMESTAMPTZ,
  first_review_at TIMESTAMPTZ,
  superhost_achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab Challenges (available challenges)
CREATE TABLE IF NOT EXISTS lab_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL CHECK (xp_reward > 0),
  badge_reward TEXT,
  badge_icon TEXT,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN (
    'bookings_count', 'earnings_amount', 'five_star_reviews',
    'response_time', 'photos_uploaded', 'profile_complete',
    'first_booking', 'streak_days', 'referrals', 'social_share',
    'vehicles_listed', 'repeat_customers', 'perfect_month'
  )),
  requirement_value INTEGER NOT NULL,
  requirement_timeframe TEXT CHECK (requirement_timeframe IN ('all_time', 'monthly', 'weekly', 'daily')),
  category TEXT CHECK (category IN ('onboarding', 'growth', 'quality', 'engagement', 'milestone')) DEFAULT 'growth',
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'legendary')) DEFAULT 'medium',
  is_active BOOLEAN DEFAULT TRUE,
  is_repeatable BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Host Challenge Progress
CREATE TABLE IF NOT EXISTS host_challenge_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES lab_challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  target INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  xp_awarded INTEGER DEFAULT 0,
  badge_awarded TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, challenge_id)
);

-- Host Achievements (permanent badges/achievements)
CREATE TABLE IF NOT EXISTS host_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  icon TEXT,
  tier TEXT CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- Host Leaderboard (cached weekly/monthly rankings)
CREATE TABLE IF NOT EXISTS host_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_type TEXT CHECK (period_type IN ('weekly', 'monthly', 'all_time')) NOT NULL,
  period_start DATE NOT NULL,
  rank_position INTEGER NOT NULL,
  total_earnings_cents INTEGER DEFAULT 0,
  total_trips INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  avg_rating DECIMAL(3, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_type, period_start)
);

-- XP Transactions (audit log)
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('challenge', 'booking', 'review', 'streak', 'referral', 'bonus', 'admin')),
  source_id UUID,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Host's Lab tables
CREATE INDEX IF NOT EXISTS idx_host_lab_levels_user ON host_lab_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_host_lab_levels_rank ON host_lab_levels(rank);
CREATE INDEX IF NOT EXISTS idx_host_lab_levels_xp ON host_lab_levels(xp DESC);

CREATE INDEX IF NOT EXISTS idx_lab_challenges_active ON lab_challenges(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_lab_challenges_category ON lab_challenges(category);

CREATE INDEX IF NOT EXISTS idx_host_challenge_progress_user ON host_challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_host_challenge_progress_challenge ON host_challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_host_challenge_progress_incomplete ON host_challenge_progress(user_id) 
  WHERE completed = FALSE;

CREATE INDEX IF NOT EXISTS idx_host_achievements_user ON host_achievements(user_id);

CREATE INDEX IF NOT EXISTS idx_host_leaderboard_period ON host_leaderboard(period_type, period_start);
CREATE INDEX IF NOT EXISTS idx_host_leaderboard_rank ON host_leaderboard(period_type, period_start, rank_position);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at DESC);
