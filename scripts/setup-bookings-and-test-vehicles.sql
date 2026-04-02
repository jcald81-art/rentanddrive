-- ============================================
-- RAD Booking System + Test Vehicles Setup
-- ============================================

-- 1. Add test flag to vehicles if not exists
ALTER TABLE vehicles 
  ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE;

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS smoking_policy TEXT DEFAULT 'clean';

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS smoking_policy_locked BOOLEAN DEFAULT FALSE;

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS inspektlabs_certified BOOLEAN DEFAULT FALSE;

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS eagle_eye_tracked BOOLEAN DEFAULT FALSE;

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS mileage_included_per_day INTEGER DEFAULT 200;

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS extra_mileage_fee NUMERIC(10,2) DEFAULT 0.25;

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10,2) DEFAULT 500;

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS minimum_days INTEGER DEFAULT 1;

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS maximum_days INTEGER DEFAULT 14;

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS advance_notice_hours INTEGER DEFAULT 2;

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS weekly_rate NUMERIC(10,2);

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS monthly_rate NUMERIC(10,2);

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS range_miles INTEGER;

-- 2. Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  host_id UUID,
  renter_id UUID,
  status TEXT DEFAULT 'draft',
  
  -- Trip dates
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  pickup_time TEXT DEFAULT '10:00',
  return_time TEXT DEFAULT '10:00',
  total_days INTEGER,
  
  -- Pricing
  daily_rate NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2),
  platform_fee NUMERIC(10,2),
  addons_total NUMERIC(10,2) DEFAULT 0,
  security_deposit NUMERIC(10,2) DEFAULT 500,
  total_charged NUMERIC(10,2),
  
  -- Payment
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  crypto_charge_id TEXT,
  paid_at TIMESTAMPTZ,
  
  -- Verification
  renter_verified BOOLEAN DEFAULT FALSE,
  verification_id UUID,
  
  -- Rental agreement
  agreement_url TEXT,
  agreement_signed_at TIMESTAMPTZ,
  terms_version TEXT DEFAULT '1.0',
  
  -- Acknowledgments
  smoking_policy_acknowledged BOOLEAN DEFAULT FALSE,
  eagle_eye_consent BOOLEAN DEFAULT FALSE,
  terms_acknowledged BOOLEAN DEFAULT FALSE,
  
  -- Mileage
  mileage_at_pickup INTEGER,
  mileage_at_return INTEGER,
  mileage_overage_fee NUMERIC(10,2) DEFAULT 0,
  
  -- Pickup
  pickup_pin TEXT,
  pickup_pin_sent BOOLEAN DEFAULT FALSE,
  pickup_pin_sent_at TIMESTAMPTZ,
  
  -- Add-ons
  addons JSONB DEFAULT '[]'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  trip_started_at TIMESTAMPTZ,
  trip_ended_at TIMESTAMPTZ
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_renter ON bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_host ON bookings(host_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_datetime, end_datetime);

-- 4. Enable RLS on bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 5. Deactivate all existing vehicles
UPDATE vehicles SET is_active = FALSE WHERE id IS NOT NULL;

-- 6. Insert Test Vehicle 1: 2014 Audi Q5
INSERT INTO vehicles (
  host_id,
  is_demo,
  is_test,
  make,
  model,
  trim,
  year,
  vin,
  color,
  mileage,
  daily_rate,
  weekly_rate,
  monthly_rate,
  location,
  market,
  seats,
  transmission,
  fuel_type,
  mpg,
  features,
  smoking_policy,
  smoking_policy_locked,
  inspektlabs_certified,
  eagle_eye_tracked,
  is_active,
  minimum_days,
  maximum_days,
  advance_notice_hours,
  description,
  photos,
  security_deposit,
  mileage_included_per_day,
  extra_mileage_fee,
  created_at
) VALUES (
  NULL,
  FALSE,
  TRUE,
  'Audi',
  'Q5',
  '2.0T Quattro Premium Plus',
  2014,
  'WA1LFAFP2EA079110',
  'Mythos Black Metallic',
  90000,
  135.00,
  810.00,
  2700.00,
  'Sparks, NV',
  'reno',
  5,
  'automatic',
  'gasoline',
  25,
  ARRAY['Quattro AWD', 'Panoramic Sunroof', 'Black Leather Interior', 'Thule Ski Rack', 'Virtual Cockpit', 'Heated Seats', 'Bluetooth', 'Backup Camera'],
  'clean',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  1,
  14,
  2,
  'Black on black 2014 Audi Q5 with Quattro AWD and panoramic sunroof. Thule ski rack pre-installed for Tahoe season. Leather interior, heated seats, all the good stuff. Inspektlabs inspection complete — this vehicle is RAD Clean.',
  ARRAY['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop'],
  500.00,
  200,
  0.25,
  NOW()
);

-- 7. Insert Test Vehicle 2: 2022 Tesla Model Y
INSERT INTO vehicles (
  host_id,
  is_demo,
  is_test,
  make,
  model,
  trim,
  year,
  vin,
  color,
  mileage,
  daily_rate,
  weekly_rate,
  monthly_rate,
  location,
  market,
  seats,
  transmission,
  fuel_type,
  range_miles,
  features,
  smoking_policy,
  smoking_policy_locked,
  inspektlabs_certified,
  eagle_eye_tracked,
  is_active,
  minimum_days,
  maximum_days,
  advance_notice_hours,
  description,
  photos,
  security_deposit,
  mileage_included_per_day,
  extra_mileage_fee,
  created_at
) VALUES (
  NULL,
  FALSE,
  TRUE,
  'Tesla',
  'Model Y',
  'Long Range AWD',
  2022,
  NULL,
  'Midnight Silver Metallic',
  18500,
  115.00,
  690.00,
  2300.00,
  'Reno, NV',
  'reno',
  5,
  'automatic',
  'electric',
  330,
  ARRAY['AWD', 'Autopilot', '330mi Range', 'Glass Roof', 'Premium Audio', 'Heated Seats', '15" Touchscreen', 'Supercharger Access'],
  'clean',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  1,
  14,
  2,
  'Zero emissions, full AWD, 330 mile range. Perfect for Reno to Tahoe runs with no range anxiety. Autopilot on the highway. Supercharger network access included. RAD Clean — no exceptions.',
  ARRAY['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop'],
  500.00,
  250,
  0.20,
  NOW()
);

-- Done!
SELECT 'Test vehicles created successfully' AS result;
