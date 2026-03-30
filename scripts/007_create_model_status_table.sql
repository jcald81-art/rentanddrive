-- Model status table for AI router health monitoring
-- Created for R&D multi-model AI system

CREATE TABLE IF NOT EXISTS public.model_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  is_manually_disabled BOOLEAN DEFAULT false,
  last_checked TIMESTAMPTZ,
  last_success TIMESTAMPTZ,
  avg_response_ms INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  consecutive_failures INTEGER DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  total_tokens_used BIGINT DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  cost_today_cents INTEGER DEFAULT 0,
  cost_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default model configurations
INSERT INTO public.model_status (model_name, provider, model_id) VALUES
  ('claude', 'anthropic', 'claude-sonnet-4-20250514'),
  ('gpt-4o', 'openai', 'gpt-4o'),
  ('grok', 'xai', 'grok-2'),
  ('gemini', 'google', 'gemini-1.5-pro'),
  ('perplexity', 'perplexity', 'llama-3.1-sonar-large-128k-online'),
  ('deepseek', 'deepseek', 'deepseek-chat'),
  ('llama', 'groq', 'llama-3.3-70b-versatile'),
  ('nemotron', 'nvidia', 'nvidia/llama-3.1-nemotron-70b-instruct')
ON CONFLICT (model_name) DO NOTHING;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_model_status_available ON public.model_status(is_available, is_manually_disabled);

-- Enable RLS
ALTER TABLE public.model_status ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read model status
DROP POLICY IF EXISTS "Anyone can view model status" ON public.model_status;
CREATE POLICY "Anyone can view model status" ON public.model_status 
  FOR SELECT USING (true);

-- Only service role can update model status
DROP POLICY IF EXISTS "Service role can update model status" ON public.model_status;
CREATE POLICY "Service role can update model status" ON public.model_status 
  FOR ALL USING (true);
