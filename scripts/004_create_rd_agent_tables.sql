-- R&D Agent System Tables Migration
-- Run this in Supabase SQL Editor

-- 1. Agent Logs - Track all agent actions and usage
CREATE TABLE IF NOT EXISTS public.agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL DEFAULT 'R&D',
  action_type TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  model_used TEXT,
  tokens_used INTEGER,
  cost_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Pricing History - Track pricing recommendations
CREATE TABLE IF NOT EXISTS public.pricing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  suggested_rate DECIMAL(10,2) NOT NULL,
  current_rate DECIMAL(10,2) NOT NULL,
  reason TEXT,
  market_data JSONB,
  agent_confidence DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Competitor Snapshots - Track competitor pricing data
CREATE TABLE IF NOT EXISTS public.competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  listing_url TEXT,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  daily_rate DECIMAL(10,2) NOT NULL,
  location TEXT,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Renter Messages - Track automated messages to renters
CREATE TABLE IF NOT EXISTS public.renter_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  message_body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  template_used TEXT
);

-- 5. Review Analysis - AI analysis of reviews
CREATE TABLE IF NOT EXISTS public.review_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  sentiment_score DECIMAL(3,2),
  keywords TEXT[],
  suggested_response TEXT,
  response_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON public.agent_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_action_type ON public.agent_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_pricing_history_vehicle_id ON public.pricing_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_pricing_history_created_at ON public.pricing_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_captured_at ON public.competitor_snapshots(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_platform ON public.competitor_snapshots(platform);
CREATE INDEX IF NOT EXISTS idx_renter_messages_booking_id ON public.renter_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_review_analysis_review_id ON public.review_analysis(review_id);

-- Enable RLS on all tables
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renter_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_logs (admin only)
DROP POLICY IF EXISTS "Service role can manage agent_logs" ON public.agent_logs;
CREATE POLICY "Service role can manage agent_logs" ON public.agent_logs
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for pricing_history (hosts can view their own vehicle pricing)
DROP POLICY IF EXISTS "Hosts can view their vehicle pricing history" ON public.pricing_history;
CREATE POLICY "Hosts can view their vehicle pricing history" ON public.pricing_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v 
      WHERE v.id = pricing_history.vehicle_id 
      AND v.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can manage pricing_history" ON public.pricing_history;
CREATE POLICY "Service role can manage pricing_history" ON public.pricing_history
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for competitor_snapshots (read-only for authenticated users)
DROP POLICY IF EXISTS "Authenticated users can view competitor snapshots" ON public.competitor_snapshots;
CREATE POLICY "Authenticated users can view competitor snapshots" ON public.competitor_snapshots
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Service role can manage competitor_snapshots" ON public.competitor_snapshots;
CREATE POLICY "Service role can manage competitor_snapshots" ON public.competitor_snapshots
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for renter_messages (users can view their own messages)
DROP POLICY IF EXISTS "Users can view their booking messages" ON public.renter_messages;
CREATE POLICY "Users can view their booking messages" ON public.renter_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = renter_messages.booking_id 
      AND (b.renter_id = auth.uid() OR b.host_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role can manage renter_messages" ON public.renter_messages;
CREATE POLICY "Service role can manage renter_messages" ON public.renter_messages
  FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for review_analysis (hosts can view analysis of reviews on their vehicles)
DROP POLICY IF EXISTS "Hosts can view review analysis" ON public.review_analysis;
CREATE POLICY "Hosts can view review analysis" ON public.review_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reviews r
      JOIN public.vehicles v ON r.vehicle_id = v.id
      WHERE r.id = review_analysis.review_id 
      AND v.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can manage review_analysis" ON public.review_analysis;
CREATE POLICY "Service role can manage review_analysis" ON public.review_analysis
  FOR ALL USING (true) WITH CHECK (true);
