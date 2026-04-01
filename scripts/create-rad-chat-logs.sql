-- Create rad_chat_logs table for persistent logging of all RAD conversations
CREATE TABLE IF NOT EXISTS rad_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'rad')),
  agent_type TEXT DEFAULT 'RAD', -- RAD, photo-session, pricing, document-validation, concierge, etc.
  page_context TEXT, -- Which page the interaction occurred on
  metadata JSONB DEFAULT '{}', -- Additional context like vehicle_id, booking_id, etc.
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_rad_chat_logs_user_id ON rad_chat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rad_chat_logs_session_id ON rad_chat_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_rad_chat_logs_timestamp ON rad_chat_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_rad_chat_logs_agent_type ON rad_chat_logs(agent_type);

-- Enable RLS for security
ALTER TABLE rad_chat_logs ENABLE ROW LEVEL SECURITY;

-- Admin policy: Admins can read all logs
CREATE POLICY "Admins can read all chat logs" ON rad_chat_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Service role policy: Allow service role to insert logs
CREATE POLICY "Service role can insert chat logs" ON rad_chat_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to insert their own logs (for client-side logging)
CREATE POLICY "Users can insert own chat logs" ON rad_chat_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Users can read their own chat history
CREATE POLICY "Users can read own chat logs" ON rad_chat_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
