-- ============================================
-- COMMUNITY TABLES FOR HOSTS LAB BREAK ROOM
-- ============================================

-- Community Posts
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_community_posts_channel ON community_posts(channel, created_at DESC);
CREATE INDEX idx_community_posts_author ON community_posts(author_id);

-- Post Reactions
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL, -- 'like', 'helpful', 'fire', 'heart'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

CREATE INDEX idx_post_reactions_post ON post_reactions(post_id);

-- Host Spotlights
CREATE TABLE IF NOT EXISTS host_spotlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  achievements JSONB,
  is_active BOOLEAN DEFAULT true,
  week_of DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Academy Courses
CREATE TABLE IF NOT EXISTS academy_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  lesson_count INTEGER DEFAULT 0,
  duration_minutes INTEGER,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  xp_reward INTEGER DEFAULT 50,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Progress
CREATE TABLE IF NOT EXISTS course_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  completed_lessons INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- Certifications
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  certificate_url TEXT,
  UNIQUE(user_id, certification_type)
);

-- Lab Level Definitions
CREATE TABLE IF NOT EXISTS lab_level_definitions (
  level INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  xp_required INTEGER NOT NULL,
  perks JSONB,
  badge_url TEXT
);

-- Insert lab levels
INSERT INTO lab_level_definitions (level, title, xp_required, perks) VALUES
  (1, 'Rookie', 0, '{"perks": ["Basic dashboard access"]}'),
  (2, 'Apprentice', 500, '{"perks": ["Dollar pricing suggestions"]}'),
  (3, 'Journeyman', 1500, '{"perks": ["Eagle basic tracking"]}'),
  (4, 'Expert', 4000, '{"perks": ["Advanced analytics", "Priority support"]}'),
  (5, 'Master', 8000, '{"perks": ["Full Eagle command", "Custom agents"]}'),
  (6, 'Legend', 15000, '{"perks": ["Beta features", "Host spotlight eligibility"]}')
ON CONFLICT (level) DO NOTHING;

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_bookings BOOLEAN DEFAULT true,
  email_reviews BOOLEAN DEFAULT true,
  email_earnings BOOLEAN DEFAULT true,
  email_alerts BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  sms_bookings BOOLEAN DEFAULT true,
  sms_urgent BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Host Payout Settings
CREATE TABLE IF NOT EXISTS host_payout_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  payout_method TEXT DEFAULT 'stripe',
  stripe_account_id TEXT,
  payout_schedule TEXT DEFAULT 'weekly',
  minimum_payout_cents INTEGER DEFAULT 2500,
  bank_last_four TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab Preferences
CREATE TABLE IF NOT EXISTS lab_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'system',
  sidebar_collapsed BOOLEAN DEFAULT false,
  show_animations BOOLEAN DEFAULT true,
  default_view TEXT DEFAULT 'lobby',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add last_active_at to profiles for online status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Insert sample academy courses
INSERT INTO academy_courses (title, description, category, lesson_count, duration_minutes, difficulty, xp_reward, sort_order) VALUES
  ('Welcome to Rent and Drive', 'Get started with your hosting journey', 'Getting Started', 5, 30, 'beginner', 50, 1),
  ('Setting Up Your First Vehicle', 'Complete guide to listing your vehicle', 'Getting Started', 8, 45, 'beginner', 75, 2),
  ('Pricing Fundamentals', 'Learn the basics of competitive pricing', 'Getting Started', 6, 35, 'beginner', 60, 3),
  ('Eagle GPS Basics', 'Introduction to fleet tracking', 'Eagle Mastery', 7, 40, 'intermediate', 80, 10),
  ('Advanced Fleet Monitoring', 'Master real-time vehicle tracking', 'Eagle Mastery', 10, 60, 'intermediate', 100, 11),
  ('Geofencing & Alerts', 'Set up virtual boundaries and notifications', 'Eagle Mastery', 8, 50, 'advanced', 90, 12),
  ('Dollar AI Fundamentals', 'Understanding AI-powered pricing', 'Dollar Optimization', 6, 35, 'intermediate', 70, 20),
  ('Dynamic Pricing Strategies', 'Maximize revenue with smart pricing', 'Dollar Optimization', 9, 55, 'advanced', 110, 21),
  ('Seasonal Demand Analysis', 'Predict and profit from demand patterns', 'Dollar Optimization', 7, 45, 'advanced', 90, 22),
  ('Growing Your Fleet', 'When and how to add more vehicles', 'Fleet Scaling', 8, 50, 'intermediate', 85, 30),
  ('Multi-Vehicle Management', 'Efficiently manage multiple listings', 'Fleet Scaling', 10, 60, 'advanced', 100, 31),
  ('Market Expansion', 'Grow beyond your local area', 'Fleet Scaling', 6, 40, 'advanced', 80, 32),
  ('Competitor Analysis', 'Stay ahead of the competition', 'Advanced Pricing', 7, 45, 'advanced', 90, 40),
  ('Event-Based Pricing', 'Capitalize on local events', 'Advanced Pricing', 8, 50, 'advanced', 95, 41),
  ('Premium Vehicle Strategies', 'Pricing luxury and specialty vehicles', 'Advanced Pricing', 6, 35, 'advanced', 85, 42)
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_spotlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_payout_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_preferences ENABLE ROW LEVEL SECURITY;

-- Community posts visible to all authenticated users
CREATE POLICY "Community posts readable by authenticated" ON community_posts
  FOR SELECT TO authenticated USING (NOT is_deleted);

CREATE POLICY "Users can create posts" ON community_posts
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own posts" ON community_posts
  FOR UPDATE TO authenticated USING (author_id = auth.uid());

-- Reactions
CREATE POLICY "Reactions readable by all" ON post_reactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own reactions" ON post_reactions
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- Academy courses public
CREATE POLICY "Academy courses public" ON academy_courses
  FOR SELECT TO authenticated USING (is_published);

-- Course progress private
CREATE POLICY "Users see own progress" ON course_progress
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- Certifications private
CREATE POLICY "Users see own certs" ON certifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Notification prefs private
CREATE POLICY "Users manage own notification prefs" ON notification_preferences
  FOR ALL TO authenticated USING (user_id = auth.uid());

-- Payout settings private
CREATE POLICY "Hosts manage own payout settings" ON host_payout_settings
  FOR ALL TO authenticated USING (host_id = auth.uid());

-- Lab prefs private
CREATE POLICY "Hosts manage own lab prefs" ON lab_preferences
  FOR ALL TO authenticated USING (host_id = auth.uid());

-- Host spotlights readable by all
CREATE POLICY "Spotlights readable by all" ON host_spotlights
  FOR SELECT TO authenticated USING (is_active);
