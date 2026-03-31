-- RAD Driver Verification and Inspection System Schema
-- Migration: 018_driver_verification_system.sql

-- ═══════════════════════════════════════════════════════════════════════════
-- DRIVER VERIFICATIONS TABLE (master)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS driver_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'approved', 'manual_review',
    'soft_blocked', 'hard_blocked', 'expired'
  )),
  
  -- RAD Rentability Score
  rentability_score INT CHECK (rentability_score BETWEEN 0 AND 100),
  score_tier TEXT CHECK (score_tier IN ('trusted', 'verified', 'review', 'blocked')),
  score_recommendation TEXT CHECK (score_recommendation IN ('approve', 'review', 'decline')),
  score_breakdown JSONB,
  
  -- Stripe Identity (license OCR + face match)
  stripe_session_id TEXT,
  stripe_verification_status TEXT,
  face_match_confidence NUMERIC,
  license_number TEXT,
  license_state TEXT,
  license_expiry DATE,
  license_class TEXT,
  driver_name TEXT,
  driver_dob DATE,
  driver_age INT,
  is_under_25 BOOL DEFAULT FALSE,
  under25_surcharge NUMERIC DEFAULT 0,
  
  -- Checkr MVR
  checkr_candidate_id TEXT,
  checkr_report_id TEXT,
  checkr_status TEXT CHECK (checkr_status IN (
    'pending', 'clear', 'consider', 'suspended', 'dispute'
  )),
  checkr_mvr_status TEXT CHECK (checkr_mvr_status IN (
    'valid', 'suspended', 'revoked', 'expired', 'restricted'
  )),
  years_licensed INT,
  dui_count_7yr INT DEFAULT 0,
  dui_count_lifetime INT DEFAULT 0,
  at_fault_accidents_3yr INT DEFAULT 0,
  at_fault_accidents_7yr INT DEFAULT 0,
  major_violations_3yr INT DEFAULT 0,
  minor_violations_3yr INT DEFAULT 0,
  suspensions_lifetime INT DEFAULT 0,
  license_currently_suspended BOOL DEFAULT FALSE,
  mvr_report_url TEXT,
  
  -- FCRA consent (legally required)
  fcra_consent BOOL DEFAULT FALSE,
  fcra_consent_at TIMESTAMPTZ,
  fcra_consent_ip TEXT,
  
  -- Soft block
  block_reason TEXT,
  block_reason_detail TEXT,
  appeal_submitted BOOL DEFAULT FALSE,
  appeal_submitted_at TIMESTAMPTZ,
  appeal_notes TEXT,
  appeal_reviewed_by UUID REFERENCES auth.users,
  appeal_reviewed_at TIMESTAMPTZ,
  appeal_outcome TEXT,
  
  -- Timing
  initiated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  next_recheck_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  
  -- Pre-adverse action (FCRA requirement)
  adverse_action_notice_sent BOOL DEFAULT FALSE,
  adverse_action_sent_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- CHECKR CONTINUOUS MONITORING EVENTS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS checkr_monitoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  verification_id UUID REFERENCES driver_verifications,
  event_type TEXT CHECK (event_type IN (
    'new_violation', 'dui_added', 'suspension', 
    'license_expired', 'record_cleared'
  )),
  event_data JSONB,
  old_score INT,
  new_score INT,
  old_tier TEXT,
  new_tier TEXT,
  tier_changed BOOL DEFAULT FALSE,
  joe_notified BOOL DEFAULT FALSE,
  joe_notified_at TIMESTAMPTZ,
  renter_notified BOOL DEFAULT FALSE,
  renter_notified_at TIMESTAMPTZ,
  active_booking_id UUID REFERENCES bookings,
  requires_recall BOOL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIP INSPECTIONS (Inspektlabs integration)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS trip_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings NOT NULL,
  vehicle_id UUID REFERENCES vehicles NOT NULL,
  renter_id UUID REFERENCES auth.users NOT NULL,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('pre_trip', 'post_trip')),
  
  -- Inspektlabs integration
  inspektlabs_session_id TEXT,
  inspektlabs_report_id TEXT,
  inspektlabs_report_url TEXT,
  inspektlabs_status TEXT CHECK (inspektlabs_status IN (
    'pending', 'in_progress', 'completed', 'failed'
  )),
  
  -- Damage detection results
  damages_detected JSONB,
  damage_count INT DEFAULT 0,
  new_damage_count INT DEFAULT 0,
  estimated_repair_cost NUMERIC DEFAULT 0,
  fraud_flags JSONB,
  
  -- Media
  photo_urls TEXT[],
  video_url TEXT,
  vin_ocr TEXT,
  odometer_ocr INT,
  
  -- Delivery
  sms_link_sent BOOL DEFAULT FALSE,
  sms_sent_at TIMESTAMPTZ,
  sms_phone TEXT,
  sms_link_token TEXT UNIQUE,
  sms_link_expires_at TIMESTAMPTZ,
  completed_via TEXT CHECK (completed_via IN ('sms_mobile', 'dashboard', 'host_manual')),
  
  -- Status
  completed BOOL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  dispute_filed BOOL DEFAULT FALSE,
  dispute_outcome TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INSPECTION COMPARISONS (pre vs post)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS inspection_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings UNIQUE NOT NULL,
  pre_inspection_id UUID REFERENCES trip_inspections NOT NULL,
  post_inspection_id UUID REFERENCES trip_inspections NOT NULL,
  new_damages JSONB,
  pre_existing_damages JSONB,
  damage_claim_triggered BOOL DEFAULT FALSE,
  damage_claim_amount NUMERIC,
  security_deposit_captured BOOL DEFAULT FALSE,
  security_deposit_amount NUMERIC,
  host_notified BOOL DEFAULT FALSE,
  renter_notified BOOL DEFAULT FALSE,
  comparison_completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- ALTER VEHICLES TABLE (host minimum score)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS min_rad_score INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_rad_score_enabled BOOL DEFAULT FALSE;

-- ═══════════════════════════════════════════════════════════════════════════
-- ALTER PROFILES TABLE (verification status)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_badge TEXT,
  ADD COLUMN IF NOT EXISTS rentability_score INT,
  ADD COLUMN IF NOT EXISTS under25_surcharge_applies BOOL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS host_license_verified BOOL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS host_license_verified_at TIMESTAMPTZ;

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_driver_verifications_user_id ON driver_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_verifications_status ON driver_verifications(status);
CREATE INDEX IF NOT EXISTS idx_driver_verifications_score_tier ON driver_verifications(score_tier);
CREATE INDEX IF NOT EXISTS idx_checkr_monitoring_events_user_id ON checkr_monitoring_events(user_id);
CREATE INDEX IF NOT EXISTS idx_checkr_monitoring_events_requires_recall ON checkr_monitoring_events(requires_recall);
CREATE INDEX IF NOT EXISTS idx_trip_inspections_booking_id ON trip_inspections(booking_id);
CREATE INDEX IF NOT EXISTS idx_trip_inspections_renter_id ON trip_inspections(renter_id);
CREATE INDEX IF NOT EXISTS idx_trip_inspections_sms_link_token ON trip_inspections(sms_link_token);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE driver_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkr_monitoring_events ENABLE ROW LEVEL SECURITY;

-- Renters see own verification
CREATE POLICY "Users can view own verification" ON driver_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own verification" ON driver_verifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Renters see own inspections
CREATE POLICY "Users can view own inspections" ON trip_inspections
  FOR SELECT USING (auth.uid() = renter_id);

-- Hosts can view inspection comparisons for their vehicles
CREATE POLICY "Hosts can view inspection comparisons" ON inspection_comparisons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trip_inspections ti
      JOIN vehicles v ON ti.vehicle_id = v.id
      WHERE ti.id = inspection_comparisons.pre_inspection_id
      AND v.owner_id = auth.uid()
    )
  );

-- Service role bypasses RLS for API routes
