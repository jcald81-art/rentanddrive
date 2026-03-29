-- Rent and Drive LLC - Insurance Tables Migration

-- Insurance Policies
CREATE TABLE IF NOT EXISTS insurance_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  policy_type TEXT NOT NULL CHECK (policy_type IN (
    'host_on_trip',      -- Host's coverage during active rental
    'host_off_trip',     -- Host's coverage when not rented
    'renter_liability',  -- Renter's liability coverage
    'renter_damage'      -- Renter's collision/comprehensive
  )),
  carrier TEXT NOT NULL DEFAULT 'Tint',
  carrier_policy_id TEXT,
  premium_cents INTEGER NOT NULL,
  deductible_cents INTEGER DEFAULT 50000,
  coverage_amount_cents INTEGER,
  coverage_start TIMESTAMPTZ NOT NULL,
  coverage_end TIMESTAMPTZ NOT NULL,
  policy_number TEXT,
  status TEXT CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'claimed')) DEFAULT 'pending',
  -- Tint-specific fields
  tint_policy_id TEXT,
  tint_quote_id TEXT,
  tint_certificate_url TEXT,
  -- Coverage details
  liability_coverage_cents INTEGER,
  collision_coverage_cents INTEGER,
  comprehensive_coverage_cents INTEGER,
  uninsured_motorist_cents INTEGER,
  medical_payments_cents INTEGER,
  -- Claims
  has_claim BOOLEAN DEFAULT FALSE,
  claim_filed_at TIMESTAMPTZ,
  claim_status TEXT,
  claim_amount_cents INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insurance Claims
CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  claim_type TEXT CHECK (claim_type IN ('collision', 'comprehensive', 'liability', 'medical', 'uninsured')) NOT NULL,
  incident_date TIMESTAMPTZ NOT NULL,
  incident_location TEXT,
  incident_description TEXT NOT NULL,
  police_report_number TEXT,
  police_report_url TEXT,
  estimated_damage_cents INTEGER,
  approved_amount_cents INTEGER,
  status TEXT CHECK (status IN ('submitted', 'under_review', 'approved', 'denied', 'paid', 'closed')) DEFAULT 'submitted',
  tint_claim_id TEXT,
  adjuster_name TEXT,
  adjuster_phone TEXT,
  adjuster_email TEXT,
  denial_reason TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insurance Claim Photos
CREATE TABLE IF NOT EXISTS insurance_claim_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES insurance_claims(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('damage', 'scene', 'police_report', 'other_vehicle', 'receipt', 'other')) NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insurance Quotes History
CREATE TABLE IF NOT EXISTS insurance_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  policy_type TEXT NOT NULL,
  carrier TEXT NOT NULL DEFAULT 'Tint',
  premium_cents INTEGER NOT NULL,
  coverage_days INTEGER NOT NULL,
  daily_rate_cents INTEGER NOT NULL,
  quote_data JSONB,
  tint_quote_id TEXT,
  expires_at TIMESTAMPTZ,
  accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for insurance tables
CREATE INDEX IF NOT EXISTS idx_insurance_policies_booking ON insurance_policies(booking_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_vehicle ON insurance_policies(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_user ON insurance_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_status ON insurance_policies(status);
CREATE INDEX IF NOT EXISTS idx_insurance_policies_active ON insurance_policies(vehicle_id) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_insurance_claims_policy ON insurance_claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_booking ON insurance_claims(booking_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status);

CREATE INDEX IF NOT EXISTS idx_insurance_quotes_vehicle ON insurance_quotes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_insurance_quotes_booking ON insurance_quotes(booking_id);
