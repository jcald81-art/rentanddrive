-- ============================================================
-- RentAndDrive — Delivery & Inspection Tables Migration (v2)
-- Safe to re-run: all statements are idempotent
-- ============================================================

-- --------------------------------------------------------
-- 1. deliveries table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  renter_id UUID NOT NULL REFERENCES profiles(id),
  direction TEXT NOT NULL CHECK (direction IN ('to_renter', 'from_renter')),
  provider TEXT NOT NULL CHECK (provider IN ('lyft', 'uber_direct', 'rad_driver', 'self_pickup')),
  external_ride_id TEXT,
  external_quote_id TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (
    status IN ('requested', 'quoted', 'confirmed', 'dispatched', 'en_route', 'arrived', 'delivered', 'cancelled', 'failed')
  ),
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DOUBLE PRECISION,
  dropoff_lng DOUBLE PRECISION,
  location_type TEXT CHECK (location_type IN ('airport_rno', 'downtown_reno', 'lake_tahoe', 'sparks', 'hotel', 'home', 'custom')),
  scheduled_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  arrived_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  fee_cents INTEGER DEFAULT 0,
  fee_currency TEXT DEFAULT 'USD',
  driver_name TEXT,
  driver_phone TEXT,
  driver_photo_url TEXT,
  driver_vehicle TEXT,
  driver_lat DOUBLE PRECISION,
  driver_lng DOUBLE PRECISION,
  tracking_url TEXT,
  eta_minutes INTEGER,
  delivery_notes TEXT,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_booking_id   ON deliveries(booking_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_vehicle_id   ON deliveries(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status        ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_scheduled_at  ON deliveries(scheduled_at);

-- --------------------------------------------------------
-- 2. delivery_status_log table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  previous_status TEXT,
  notes TEXT,
  driver_lat DOUBLE PRECISION,
  driver_lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_status_log_delivery_id ON delivery_status_log(delivery_id);

-- --------------------------------------------------------
-- 3. vehicle_inspections table
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  performed_by UUID REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('pre_trip', 'post_trip', 'damage_claim', 'maintenance', 'sale')),
  inspektlabs_session_id TEXT,
  inspektlabs_report_id TEXT,
  inspection_link TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_progress', 'complete', 'failed', 'expired')
  ),
  damage_count INTEGER DEFAULT 0,
  damage_items JSONB DEFAULT '[]'::jsonb,
  total_repair_estimate_cents INTEGER DEFAULT 0,
  fraud_score NUMERIC(3,2),
  fraud_flags JSONB DEFAULT '[]'::jsonb,
  photo_urls JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,
  notes TEXT,
  odometer_reading INTEGER,
  fuel_level INTEGER,
  damage_charged BOOLEAN DEFAULT FALSE,
  damage_charge_amount_cents INTEGER,
  damage_charge_payment_intent_id TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_booking_id ON vehicle_inspections(booking_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle_id ON vehicle_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_type       ON vehicle_inspections(type);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_status     ON vehicle_inspections(status);

-- --------------------------------------------------------
-- 4. updated_at trigger function (idempotent)
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deliveries_updated_at ON deliveries;
CREATE TRIGGER deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS vehicle_inspections_updated_at ON vehicle_inspections;
CREATE TRIGGER vehicle_inspections_updated_at
  BEFORE UPDATE ON vehicle_inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- --------------------------------------------------------
-- 5. RLS — deliveries
-- --------------------------------------------------------
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "renters_view_own_deliveries"   ON deliveries;
DROP POLICY IF EXISTS "hosts_view_fleet_deliveries"   ON deliveries;
DROP POLICY IF EXISTS "service_manage_deliveries"     ON deliveries;

CREATE POLICY "renters_view_own_deliveries" ON deliveries
  FOR SELECT USING (renter_id = auth.uid());

CREATE POLICY "hosts_view_fleet_deliveries" ON deliveries
  FOR SELECT USING (
    vehicle_id IN (SELECT id FROM vehicles WHERE owner_id = auth.uid())
  );

CREATE POLICY "service_manage_deliveries" ON deliveries
  FOR ALL USING (auth.role() = 'service_role');

-- --------------------------------------------------------
-- 6. RLS — vehicle_inspections
-- --------------------------------------------------------
ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners_view_inspections"         ON vehicle_inspections;
DROP POLICY IF EXISTS "renters_view_own_inspections"    ON vehicle_inspections;
DROP POLICY IF EXISTS "service_manage_inspections"      ON vehicle_inspections;

CREATE POLICY "owners_view_inspections" ON vehicle_inspections
  FOR SELECT USING (
    vehicle_id IN (SELECT id FROM vehicles WHERE owner_id = auth.uid())
  );

CREATE POLICY "renters_view_own_inspections" ON vehicle_inspections
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE renter_id = auth.uid())
  );

CREATE POLICY "service_manage_inspections" ON vehicle_inspections
  FOR ALL USING (auth.role() = 'service_role');

-- --------------------------------------------------------
-- 7. RLS — delivery_status_log
-- --------------------------------------------------------
ALTER TABLE delivery_status_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_manage_delivery_log" ON delivery_status_log;

CREATE POLICY "service_manage_delivery_log" ON delivery_status_log
  FOR ALL USING (auth.role() = 'service_role');
