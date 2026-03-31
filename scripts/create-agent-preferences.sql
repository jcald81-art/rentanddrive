-- Create agent_preferences table for storing user interaction preferences
CREATE TABLE IF NOT EXISTS agent_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proactive_messages BOOLEAN DEFAULT true,
  message_delay_seconds INTEGER DEFAULT 15 CHECK (message_delay_seconds >= 5 AND message_delay_seconds <= 60),
  preferred_agent TEXT,
  notification_sound BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_agent_preferences_user_id ON agent_preferences(user_id);

-- Enable RLS
ALTER TABLE agent_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only read and update their own preferences
CREATE POLICY "Users can view own agent preferences"
  ON agent_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent preferences"
  ON agent_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent preferences"
  ON agent_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Add total_trips and loyalty_tier to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_trips') THEN
    ALTER TABLE profiles ADD COLUMN total_trips INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'loyalty_tier') THEN
    ALTER TABLE profiles ADD COLUMN loyalty_tier TEXT DEFAULT 'Trail Starter';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'fleet_count') THEN
    ALTER TABLE profiles ADD COLUMN fleet_count INTEGER DEFAULT 0;
  END IF;
END $$;
