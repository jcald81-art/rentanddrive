-- Rent and Drive LLC - Core Tables Migration

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('renter', 'host', 'admin')) DEFAULT 'renter',
  is_verified BOOLEAN DEFAULT FALSE,
  is_host_verified BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  stripe_connect_account_id TEXT,
  stripe_connect_onboarded BOOLEAN DEFAULT FALSE,
  default_location_city TEXT,
  default_location_state TEXT DEFAULT 'NV',
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  total_bookings INTEGER DEFAULT 0,
  total_spent_cents INTEGER DEFAULT 0,
  total_earned_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1990 AND year <= EXTRACT(YEAR FROM NOW()) + 1),
  category TEXT CHECK (category IN ('car', 'suv', 'truck', 'motorcycle', 'rv', 'atv')) DEFAULT 'car',
  color TEXT,
  license_plate TEXT,
  vin TEXT,
  description TEXT,
  daily_rate INTEGER NOT NULL CHECK (daily_rate > 0),
  weekly_rate INTEGER,
  monthly_rate INTEGER,
  security_deposit INTEGER DEFAULT 25000,
  mileage_limit INTEGER DEFAULT 200,
  extra_mile_fee INTEGER DEFAULT 35,
  seats INTEGER DEFAULT 5,
  doors INTEGER DEFAULT 4,
  fuel_type TEXT CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid')) DEFAULT 'gasoline',
  transmission TEXT CHECK (transmission IN ('automatic', 'manual')) DEFAULT 'automatic',
  is_awd BOOLEAN DEFAULT FALSE,
  has_ski_rack BOOLEAN DEFAULT FALSE,
  has_bike_rack BOOLEAN DEFAULT FALSE,
  has_tow_hitch BOOLEAN DEFAULT FALSE,
  has_roof_box BOOLEAN DEFAULT FALSE,
  pet_friendly BOOLEAN DEFAULT FALSE,
  smoking_allowed BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  location_address TEXT,
  location_city TEXT DEFAULT 'Reno',
  location_state TEXT DEFAULT 'NV',
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  pickup_instructions TEXT,
  return_instructions TEXT,
  status TEXT CHECK (status IN ('draft', 'pending', 'active', 'inactive', 'suspended')) DEFAULT 'draft',
  is_approved BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  total_trips INTEGER DEFAULT 0,
  total_earnings_cents INTEGER DEFAULT 0,
  -- VIN verification
  vin_verified BOOLEAN DEFAULT FALSE,
  vin_report_url TEXT,
  vin_report_purchased_at TIMESTAMPTZ,
  -- Recall tracking
  has_open_recalls BOOLEAN DEFAULT FALSE,
  recall_severity TEXT CHECK (recall_severity IN ('CRITICAL', 'WARNING', 'INFO')),
  last_recall_check TIMESTAMPTZ,
  -- Insurance/registration
  insurance_expiry DATE,
  registration_expiry DATE,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  -- Bouncie GPS
  bouncie_device_id TEXT,
  bouncie_imei TEXT,
  -- Lockbox
  lockbox_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  pickup_location TEXT,
  return_location TEXT,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed')) DEFAULT 'pending',
  -- Pricing
  daily_rate INTEGER NOT NULL,
  total_days INTEGER NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  insurance_fee_cents INTEGER DEFAULT 0,
  cleaning_fee_cents INTEGER DEFAULT 0,
  delivery_fee_cents INTEGER DEFAULT 0,
  young_driver_fee_cents INTEGER DEFAULT 0,
  discount_cents INTEGER DEFAULT 0,
  total_cents INTEGER NOT NULL,
  security_deposit_cents INTEGER DEFAULT 0,
  -- Payment
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'authorized', 'captured', 'refunded', 'failed')) DEFAULT 'pending',
  -- Trip details
  start_mileage INTEGER,
  end_mileage INTEGER,
  fuel_level_start TEXT,
  fuel_level_end TEXT,
  -- Lockbox
  lockbox_code TEXT,
  lockbox_code_expires_at TIMESTAMPTZ,
  -- Reviews
  renter_reviewed BOOLEAN DEFAULT FALSE,
  host_reviewed BOOLEAN DEFAULT FALSE,
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id),
  cancellation_reason TEXT,
  refund_amount_cents INTEGER,
  -- Ride concierge
  pickup_ride_id UUID,
  return_ride_id UUID,
  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent overlapping bookings
  EXCLUDE USING gist (vehicle_id WITH =, tstzrange(start_date, end_date) WITH &&)
    WHERE (status NOT IN ('cancelled', 'disputed'))
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('booking', 'security_deposit', 'damage_claim', 'refund', 'payout', 'vin_report', 'subscription')) NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_transfer_id TEXT,
  stripe_refund_id TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('renter_to_host', 'host_to_renter', 'renter_to_vehicle')) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  would_rent_again BOOLEAN,
  -- AI analysis
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  ai_summary TEXT,
  keywords TEXT[],
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  -- Visibility
  is_public BOOLEAN DEFAULT TRUE,
  host_response TEXT,
  host_responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Credits
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  type TEXT CHECK (type IN ('referral', 'promo', 'refund', 'social_reward', 'loyalty', 'compensation')) NOT NULL,
  description TEXT,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  used_booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vehicle_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver Verifications
CREATE TABLE IF NOT EXISTS driver_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  license_number TEXT,
  license_state TEXT,
  license_expiry DATE,
  license_front_url TEXT,
  license_back_url TEXT,
  selfie_url TEXT,
  date_of_birth DATE,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'expired')) DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  -- Stripe Identity
  stripe_verification_session_id TEXT,
  stripe_verification_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VIN Reports
CREATE TABLE IF NOT EXISTS vin_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  vin TEXT NOT NULL,
  provider TEXT DEFAULT 'carfax',
  report_url TEXT,
  report_data JSONB,
  purchased_by UUID REFERENCES profiles(id),
  price_cents INTEGER DEFAULT 499,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NHTSA Recalls
CREATE TABLE IF NOT EXISTS nhtsa_recalls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  vin TEXT NOT NULL,
  nhtsa_campaign_id TEXT NOT NULL,
  component TEXT,
  summary TEXT,
  consequence TEXT,
  remedy TEXT,
  severity TEXT CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO')) DEFAULT 'WARNING',
  is_open BOOLEAN DEFAULT TRUE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  recall_date DATE,
  manufacturer TEXT,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nhtsa_campaign_id, vehicle_id)
);

-- Inspections
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('pre_trip', 'post_trip')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'disputed')) DEFAULT 'pending',
  mileage INTEGER,
  fuel_level TEXT CHECK (fuel_level IN ('empty', 'quarter', 'half', 'three_quarter', 'full')),
  exterior_condition TEXT CHECK (exterior_condition IN ('excellent', 'good', 'fair', 'poor')),
  interior_condition TEXT CHECK (interior_condition IN ('excellent', 'good', 'fair', 'poor')),
  notes TEXT,
  damage_found BOOLEAN DEFAULT FALSE,
  damage_description TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inspection Photos
CREATE TABLE IF NOT EXISTS inspection_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('front', 'back', 'left', 'right', 'interior', 'dashboard', 'trunk', 'damage', 'other')) NOT NULL,
  caption TEXT,
  is_damage BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for core tables
CREATE INDEX IF NOT EXISTS idx_vehicles_host_id ON vehicles(host_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(location_city, location_state);
CREATE INDEX IF NOT EXISTS idx_vehicles_daily_rate ON vehicles(daily_rate);
CREATE INDEX IF NOT EXISTS idx_vehicles_rating ON vehicles(rating DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_renter_id ON bookings(renter_id);
CREATE INDEX IF NOT EXISTS idx_bookings_host_id ON bookings(host_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_vehicle_id ON reviews(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
