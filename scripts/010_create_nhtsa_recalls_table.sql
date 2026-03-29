-- NHTSA Recalls Table for Vehicle Safety Monitoring
-- Stores recall data from NHTSA free public API

CREATE TABLE IF NOT EXISTS nhtsa_recalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  vin TEXT NOT NULL,
  recall_id TEXT,
  nhtsa_campaign_id TEXT,
  component TEXT,
  summary TEXT,
  consequence TEXT,
  remedy TEXT,
  severity TEXT CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO')),
  is_open BOOLEAN DEFAULT true,
  recall_date TEXT,
  manufacturer TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast VIN lookups
CREATE INDEX IF NOT EXISTS idx_nhtsa_recalls_vin ON nhtsa_recalls(vin);
CREATE INDEX IF NOT EXISTS idx_nhtsa_recalls_vehicle_id ON nhtsa_recalls(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_nhtsa_recalls_is_open ON nhtsa_recalls(is_open);
CREATE INDEX IF NOT EXISTS idx_nhtsa_recalls_severity ON nhtsa_recalls(severity);

-- Enable Row Level Security
ALTER TABLE nhtsa_recalls ENABLE ROW LEVEL SECURITY;

-- Hosts can view recalls for their own vehicles
CREATE POLICY "hosts_view_own_recalls" ON nhtsa_recalls
  FOR SELECT
  USING (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE host_id = auth.uid()
    )
  );

-- Admins can view all recalls
CREATE POLICY "admins_view_all_recalls" ON nhtsa_recalls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert/update recalls (via service role)
CREATE POLICY "service_manage_recalls" ON nhtsa_recalls
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add last_recall_check column to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_recall_check TIMESTAMPTZ;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_open_recalls BOOLEAN DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS recall_severity TEXT;
