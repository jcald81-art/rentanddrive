-- ============================================
-- Rent and Drive - Expedition Agent System
-- Database Schema Migration
-- ============================================

-- Agent logs table - tracks all AI agent calls
CREATE TABLE IF NOT EXISTS agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  task_type text NOT NULL,
  model_used text NOT NULL,
  tokens_in integer DEFAULT 0,
  tokens_out integer DEFAULT 0,
  latency_ms integer DEFAULT 0,
  cached boolean DEFAULT false,
  cost_usd numeric(10,6) DEFAULT 0,
  user_id uuid REFERENCES auth.users,
  booking_id uuid,
  vehicle_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own agent logs
CREATE POLICY "Users can view own agent logs" ON agent_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can insert logs
CREATE POLICY "Service role can insert agent logs" ON agent_logs
  FOR INSERT WITH CHECK (true);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_agent_logs_user_id ON agent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_task_type ON agent_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_name ON agent_logs(agent_name);

-- ============================================
-- Agents table - stores agent configurations
-- ============================================

CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text UNIQUE NOT NULL,        -- 'Beacon', 'Gauge', etc.
  former_name text,                       -- Previous name if renamed
  agent_type text UNIQUE NOT NULL,        -- matches AgentTaskType
  primary_model text NOT NULL,
  fallback_model text,
  cross_validation_model text,
  requires_dual_agreement boolean DEFAULT false,
  system_prompt text NOT NULL,
  is_active boolean DEFAULT true,
  streaming boolean DEFAULT false,
  cache_ttl_seconds integer DEFAULT 0,
  icon text,
  color text,
  tagline text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read agents
CREATE POLICY "Anyone can read agents" ON agents
  FOR SELECT USING (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_agents_agent_type ON agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON agents(is_active);

-- ============================================
-- Insert Expedition Agents
-- ============================================

INSERT INTO agents (agent_name, former_name, agent_type, primary_model, fallback_model, cross_validation_model, requires_dual_agreement, system_prompt, is_active, streaming, cache_ttl_seconds, icon, color, tagline)
VALUES
  ('Beacon', 'SecureLink', 'communications', 'anthropic/claude-sonnet-4-20250514', 'groq/llama-4-scout', NULL, false, 'Communications agent for booking messages and guest support', true, true, 0, 'radio', '#F59E0B', 'Trail Communications'),
  ('Gauge', 'Dollar', 'pricing', 'anthropic/claude-sonnet-4-20250514', 'openai/gpt-4o', 'openai/gpt-4o', false, 'Dynamic pricing agent for revenue optimization', true, false, 300, 'gauge', '#22C55E', 'Revenue Optimization'),
  ('Guard', 'Shield', 'reviews', 'anthropic/claude-sonnet-4-20250514', 'google/gemini-2.5-flash', NULL, false, 'Reputation and review management agent', true, false, 600, 'shield', '#8B5CF6', 'Reputation Protection'),
  ('Scout', 'Command&Control', 'market_intelligence', 'perplexity/sonar-pro', 'anthropic/claude-sonnet-4-20250514', NULL, false, 'Market intelligence and competitor analysis', true, true, 1800, 'binoculars', '#06B6D4', 'Market Recon'),
  ('Vitals', 'Pulse', 'fleet_health', 'nvidia/nemotron-70b', 'anthropic/claude-sonnet-4-20250514', NULL, false, 'Fleet health monitoring via OBD2 telemetry', true, false, 900, 'heart-pulse', '#EF4444', 'Fleet Health Monitor'),
  ('Grok', 'Grok', 'realtime_conditions', 'xai/grok-3', 'anthropic/claude-sonnet-4-20250514', NULL, false, 'Real-time weather and road conditions', true, true, 60, 'cloud-sun', '#3B82F6', 'Real-Time Conditions'),
  ('Gemini', 'Gemini', 'document_analysis', 'google/gemini-2.5-pro', 'anthropic/claude-sonnet-4-20250514', NULL, false, 'Document analysis and extraction', true, false, 3600, 'file-search', '#4285F4', 'Document Analysis'),
  ('DeepSeek', 'DeepSeek', 'bulk_processing', 'deepseek/deepseek-chat-v3', 'anthropic/claude-haiku-4-5-20251001', NULL, false, 'Batch processing and data operations', true, false, 7200, 'layers', '#6366F1', 'Batch Processing'),
  ('Badge', 'Diesel', 'driver_verification', 'openai/gpt-4o', 'google/gemini-2.5-pro', 'anthropic/claude-sonnet-4-20250514', false, 'Driver verification and Inspektlabs certification', true, false, 0, 'badge-check', '#10B981', 'Driver Verification'),
  ('Surveyor', 'Inspector Cartegrity', 'damage_assessment', 'google/gemini-2.5-pro', 'openai/gpt-4o', NULL, false, 'Damage assessment and inspection reports', true, false, 0, 'camera', '#CC0000', 'Damage Assessment'),
  ('Lookout', 'NEW', 'fraud_detection', 'anthropic/claude-sonnet-4-20250514', 'openai/gpt-4o', 'openai/gpt-4o', true, 'Fraud detection and risk scoring', true, false, 0, 'eye', '#DC2626', 'Fraud Detection'),
  ('Outfitter', 'NEW', 'upsell_recommendation', 'anthropic/claude-sonnet-4-20250514', 'anthropic/claude-haiku-4-5-20251001', NULL, false, 'Add-on and gear recommendations', true, true, 300, 'backpack', '#F97316', 'Trip Outfitting'),
  ('Boost', 'Funtime', 'engagement', 'anthropic/claude-sonnet-4-20250514', 'groq/llama-4-scout', NULL, false, 'Engagement, loyalty, and gamification', true, true, 600, 'rocket', '#EC4899', 'Engagement & Loyalty'),
  ('RAD', 'RAD', 'concierge', 'anthropic/claude-sonnet-4-20250514', 'groq/llama-4-scout', NULL, false, 'AI Concierge for renter assistance', true, true, 0, 'compass', '#00B4D8', 'AI Concierge')
ON CONFLICT (agent_type) DO UPDATE SET
  agent_name = EXCLUDED.agent_name,
  former_name = EXCLUDED.former_name,
  primary_model = EXCLUDED.primary_model,
  fallback_model = EXCLUDED.fallback_model,
  cross_validation_model = EXCLUDED.cross_validation_model,
  requires_dual_agreement = EXCLUDED.requires_dual_agreement,
  streaming = EXCLUDED.streaming,
  cache_ttl_seconds = EXCLUDED.cache_ttl_seconds,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  tagline = EXCLUDED.tagline,
  updated_at = now();

-- ============================================
-- Agent usage summary view
-- ============================================

CREATE OR REPLACE VIEW agent_usage_summary AS
SELECT
  agent_name,
  task_type,
  COUNT(*) as total_calls,
  SUM(CASE WHEN cached THEN 1 ELSE 0 END) as cached_calls,
  AVG(latency_ms) as avg_latency_ms,
  SUM(cost_usd) as total_cost_usd,
  SUM(tokens_in + tokens_out) as total_tokens,
  MAX(created_at) as last_used
FROM agent_logs
GROUP BY agent_name, task_type;

-- ============================================
-- Daily agent costs view
-- ============================================

CREATE OR REPLACE VIEW agent_daily_costs AS
SELECT
  DATE(created_at) as date,
  agent_name,
  COUNT(*) as calls,
  SUM(cost_usd) as cost_usd,
  SUM(tokens_in + tokens_out) as tokens
FROM agent_logs
GROUP BY DATE(created_at), agent_name
ORDER BY date DESC, cost_usd DESC;
