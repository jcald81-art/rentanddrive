-- Rent and Drive LLC - AI Agent Tables Migration

-- RD Agents (per-user AI agents)
CREATE TABLE IF NOT EXISTS rd_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('communications', 'pricing', 'reputation', 'intel', 'fleet', 'engagement', 'verification')),
  default_name TEXT NOT NULL,
  custom_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  personality_config JSONB DEFAULT '{
    "tone": "professional",
    "emoji_usage": "minimal",
    "verbosity": "concise"
  }',
  settings JSONB DEFAULT '{}',
  last_action_at TIMESTAMPTZ,
  total_actions_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_type)
);

-- RD Agent Action Log
CREATE TABLE IF NOT EXISTS rd_agent_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES rd_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_summary TEXT,
  input_data JSONB,
  output_data JSONB,
  model_used TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0,
  latency_ms INTEGER,
  triggered_by TEXT CHECK (triggered_by IN ('scheduled', 'user_action', 'event', 'webhook')) NOT NULL,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Morning Briefs
CREATE TABLE IF NOT EXISTS morning_briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sections JSONB DEFAULT '{}',
  generated_by TEXT DEFAULT 'SecureLink',
  model_used TEXT,
  tokens_used INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing History (dynamic pricing records)
CREATE TABLE IF NOT EXISTS pricing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  base_rate INTEGER NOT NULL,
  suggested_rate INTEGER NOT NULL,
  applied_rate INTEGER,
  demand_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  event_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  weather_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  competitor_adjustment INTEGER DEFAULT 0,
  reasoning TEXT,
  was_accepted BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vehicle_id, date)
);

-- Competitor Snapshots
CREATE TABLE IF NOT EXISTS competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  competitor TEXT CHECK (competitor IN ('turo', 'getaround', 'enterprise', 'hertz', 'avis')) NOT NULL,
  competitor_vehicle_id TEXT,
  make TEXT,
  model TEXT,
  year INTEGER,
  daily_rate INTEGER,
  weekly_rate INTEGER,
  rating DECIMAL(3, 2),
  review_count INTEGER,
  location_city TEXT,
  snapshot_data JSONB,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- Renter Messages (AI-drafted communications)
CREATE TABLE IF NOT EXISTS renter_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_type TEXT CHECK (message_type IN ('booking_inquiry', 'booking_confirmation', 'reminder', 'follow_up', 'review_request', 'custom')) NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  ai_drafted BOOLEAN DEFAULT FALSE,
  ai_model TEXT,
  sent_via TEXT CHECK (sent_via IN ('email', 'sms', 'in_app', 'push')) DEFAULT 'in_app',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review Analysis (AI-generated insights)
CREATE TABLE IF NOT EXISTS review_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  sentiment_score DECIMAL(3, 2),
  sentiment_label TEXT CHECK (sentiment_label IN ('very_positive', 'positive', 'neutral', 'negative', 'very_negative')),
  key_topics TEXT[],
  improvement_suggestions TEXT[],
  response_suggestion TEXT,
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
  requires_action BOOLEAN DEFAULT FALSE,
  action_taken BOOLEAN DEFAULT FALSE,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Model Status (AI model availability/health)
CREATE TABLE IF NOT EXISTS model_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_name TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  is_primary BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 5,
  last_used_at TIMESTAMPTZ,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  avg_latency_ms INTEGER,
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for agent tables
CREATE INDEX IF NOT EXISTS idx_rd_agents_user_id ON rd_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_rd_agents_type ON rd_agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_rd_agent_log_agent_id ON rd_agent_log(agent_id);
CREATE INDEX IF NOT EXISTS idx_rd_agent_log_user_id ON rd_agent_log(user_id);
CREATE INDEX IF NOT EXISTS idx_rd_agent_log_created_at ON rd_agent_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_morning_briefs_user_id ON morning_briefs(user_id);
CREATE INDEX IF NOT EXISTS idx_morning_briefs_created_at ON morning_briefs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pricing_history_vehicle_date ON pricing_history(vehicle_id, date);
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_vehicle ON competitor_snapshots(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_renter_messages_booking ON renter_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_review_analysis_review ON review_analysis(review_id);

-- Function to create default R&D agents for new users
CREATE OR REPLACE FUNCTION create_default_rd_agents()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO rd_agents 
    (user_id, agent_type, default_name, custom_name, is_active)
  VALUES
    (NEW.id, 'communications', 'SecureLink', 'SecureLink', true),
    (NEW.id, 'pricing', 'Dollar', 'Dollar', true),
    (NEW.id, 'reputation', 'Shield', 'Shield', true),
    (NEW.id, 'intel', 'Command&Control', 'Command&Control', true),
    (NEW.id, 'fleet', 'Pulse', 'Pulse', true),
    (NEW.id, 'engagement', 'Funtime', 'Funtime', true),
    (NEW.id, 'verification', 'Diesel', 'Diesel', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create agents when a new profile is created
-- Note: This triggers on profiles table (not auth.users) since rd_agents references profiles
DROP TRIGGER IF EXISTS on_profile_created_agents ON profiles;
CREATE TRIGGER on_profile_created_agents
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_rd_agents();
