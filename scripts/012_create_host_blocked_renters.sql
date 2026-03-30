-- Host Blocked Renters table
-- Allows hosts to block specific renters from booking their vehicles

CREATE TABLE IF NOT EXISTS host_blocked_renters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique host-renter combination
  UNIQUE(host_id, renter_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_blocked_renters_host ON host_blocked_renters(host_id);
CREATE INDEX IF NOT EXISTS idx_blocked_renters_renter ON host_blocked_renters(renter_id);

-- RLS Policies
ALTER TABLE host_blocked_renters ENABLE ROW LEVEL SECURITY;

-- Hosts can manage their own blocked list
CREATE POLICY "Hosts can view their blocked renters" ON host_blocked_renters
  FOR SELECT USING (auth.uid() = host_id);

CREATE POLICY "Hosts can block renters" ON host_blocked_renters
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can unblock renters" ON host_blocked_renters
  FOR DELETE USING (auth.uid() = host_id);

-- Add driving_score to bouncie_trips if not exists
ALTER TABLE bouncie_trips 
ADD COLUMN IF NOT EXISTS driving_score INTEGER DEFAULT 85;

-- Add is_acknowledged to fleet_alerts if not exists
ALTER TABLE fleet_alerts 
ADD COLUMN IF NOT EXISTS is_acknowledged BOOLEAN DEFAULT FALSE;

ALTER TABLE fleet_alerts 
ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;

ALTER TABLE fleet_alerts 
ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES auth.users(id);
