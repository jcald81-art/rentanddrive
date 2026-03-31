-- RAD Mobility System - Database Schema
-- Creates mobility_requests table and adds mobility fields to bookings

-- Mobility requests table
CREATE TABLE IF NOT EXISTS mobility_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'lyft_to_vehicle',
    'vehicle_delivery',
    'lyft_return_ride',
    'vehicle_reposition'
  )),
  provider text NOT NULL CHECK (provider IN (
    'lyft_concierge',
    'uber_direct'
  )),
  external_id text NOT NULL,
  status text DEFAULT 'pending',
  tracking_url text,
  fee numeric(10,2),
  courier_data jsonb,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE mobility_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own mobility requests
CREATE POLICY "Users see own mobility requests"
  ON mobility_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = mobility_requests.booking_id
      AND (b.renter_id = auth.uid() OR b.host_id = auth.uid())
    )
  );

-- Policy: Service role can manage all mobility requests
CREATE POLICY "Service role manages mobility"
  ON mobility_requests FOR ALL
  USING (auth.role() = 'service_role');

-- Add mobility fields to bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS mobility_options text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS renter_pickup_address text,
  ADD COLUMN IF NOT EXISTS renter_home_address text;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS mobility_requests_booking_id ON mobility_requests(booking_id);
CREATE INDEX IF NOT EXISTS mobility_requests_external_id ON mobility_requests(external_id);
CREATE INDEX IF NOT EXISTS mobility_requests_status ON mobility_requests(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mobility_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS mobility_requests_updated_at ON mobility_requests;
CREATE TRIGGER mobility_requests_updated_at
  BEFORE UPDATE ON mobility_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_mobility_request_updated_at();
