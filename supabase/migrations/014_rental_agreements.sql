-- Rental Agreements table
-- Stores the agreement clauses accepted by renters for each booking

CREATE TABLE IF NOT EXISTS rental_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  clauses JSONB NOT NULL DEFAULT '[]',
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add violation tracking to bookings
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS has_violation BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS violation_type TEXT,
  ADD COLUMN IF NOT EXISTS violation_notes TEXT,
  ADD COLUMN IF NOT EXISTS violation_detected_at TIMESTAMPTZ;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_rental_agreements_booking ON rental_agreements(booking_id);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_renter ON rental_agreements(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_violations ON bookings(has_violation) WHERE has_violation = TRUE;

-- RLS Policies
ALTER TABLE rental_agreements ENABLE ROW LEVEL SECURITY;

-- Users can view their own agreements
CREATE POLICY "Users can view own agreements"
  ON rental_agreements FOR SELECT
  USING (renter_id = auth.uid());

-- Hosts can view agreements for their vehicles
CREATE POLICY "Hosts can view vehicle agreements"
  ON rental_agreements FOR SELECT
  USING (
    vehicle_id IN (
      SELECT id FROM vehicles WHERE host_id = auth.uid()
    )
  );

-- Admins can view all agreements
CREATE POLICY "Admins can view all agreements"
  ON rental_agreements FOR SELECT
  USING (is_admin());

-- System can insert agreements (via service role)
CREATE POLICY "Service can insert agreements"
  ON rental_agreements FOR INSERT
  WITH CHECK (true);
