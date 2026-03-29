-- VIN Reports table for vehicle history verification
-- This stores VinAudit API responses and tracks revenue

CREATE TABLE IF NOT EXISTS public.vin_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vin TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('basic', 'premium', 'bundle')),
  report_data JSONB NOT NULL DEFAULT '{}',
  formatted_summary JSONB NOT NULL DEFAULT '{}',
  amount_charged_cents INTEGER NOT NULL DEFAULT 0,
  stripe_payment_intent_id TEXT,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Extracted flags for quick queries
  is_clean BOOLEAN DEFAULT true,
  has_accidents BOOLEAN DEFAULT false,
  has_salvage_title BOOLEAN DEFAULT false,
  has_theft_record BOOLEAN DEFAULT false,
  has_odometer_rollback BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vin_reports_vehicle_id ON public.vin_reports(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vin_reports_vin ON public.vin_reports(vin);
CREATE INDEX IF NOT EXISTS idx_vin_reports_requested_by ON public.vin_reports(requested_by);
CREATE INDEX IF NOT EXISTS idx_vin_reports_created_at ON public.vin_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_vin_reports_is_clean ON public.vin_reports(is_clean);

-- Enable RLS
ALTER TABLE public.vin_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Service role has full access
DROP POLICY IF EXISTS "Service role has full access to vin_reports" ON public.vin_reports;
CREATE POLICY "Service role has full access to vin_reports" ON public.vin_reports
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy: Hosts can view reports for their own vehicles
DROP POLICY IF EXISTS "Hosts can view their own vehicle reports" ON public.vin_reports;
CREATE POLICY "Hosts can view their own vehicle reports" ON public.vin_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v 
      WHERE v.id = vin_reports.vehicle_id 
      AND v.host_id = auth.uid()
    )
    OR requested_by = auth.uid()
  );

-- Policy: Hosts can insert reports for their own vehicles
DROP POLICY IF EXISTS "Hosts can create reports for their vehicles" ON public.vin_reports;
CREATE POLICY "Hosts can create reports for their vehicles" ON public.vin_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles v 
      WHERE v.id = vin_reports.vehicle_id 
      AND v.host_id = auth.uid()
    )
    OR requested_by = auth.uid()
  );

-- Policy: Admins can view all reports
DROP POLICY IF EXISTS "Admins can view all vin_reports" ON public.vin_reports;
CREATE POLICY "Admins can view all vin_reports" ON public.vin_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vin_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_vin_reports_updated_at ON public.vin_reports;
CREATE TRIGGER trigger_vin_reports_updated_at
  BEFORE UPDATE ON public.vin_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_vin_reports_updated_at();

-- View for VIN revenue tracking (for admin dashboard)
CREATE OR REPLACE VIEW public.vin_revenue_by_month AS
SELECT 
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS report_count,
  SUM(amount_charged_cents) AS total_cents,
  SUM(CASE WHEN report_type = 'basic' THEN 1 ELSE 0 END) AS basic_count,
  SUM(CASE WHEN report_type = 'premium' THEN 1 ELSE 0 END) AS premium_count,
  SUM(CASE WHEN report_type = 'bundle' THEN 1 ELSE 0 END) AS bundle_count
FROM public.vin_reports
WHERE amount_charged_cents > 0
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
