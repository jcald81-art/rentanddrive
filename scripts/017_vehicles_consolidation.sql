-- Migration: Vehicles Table Consolidation and Enhancement
-- Adds all required columns for the unified vehicles table

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 1: Add new columns to vehicles table (will not drop existing columns)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Core identity (from VIN lookup via GoodCar)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS trim text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS body_style text;
  -- SUV | Truck | Sedan | Crossover | Wagon | Minivan | Coupe

-- VIN auto-populated specs
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS drivetrain text;
  -- AWD | 4WD | FWD | RWD
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS engine text;
  -- e.g. "2.0T I4 Turbocharged"
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_carplay bool DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_android_auto bool DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_backup_camera bool DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_sunroof bool DEFAULT false;

-- Host-entered features (checklist during onboarding)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_roof_rack bool DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_snow_tires bool DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_pet_friendly bool DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_toll_transponder bool DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_portable_wifi bool DEFAULT false;

-- Listing details
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS pickup_location text;
  -- Reno | Sparks | Lake Tahoe
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS pickup_address text;

-- Relationships
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS igloo_keybox_id text;

-- Media
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS audio_cold_start_url text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS audio_idle_url text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS audio_shutdown_url text;

-- Inspektlabs
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS inspektlabs_score int;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS inspektlabs_certified bool DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS inspektlabs_inspected_at timestamptz;

-- Status enhancements
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_demo bool DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS goodcar_report_url text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS nhtsa_recall_count int DEFAULT 0;

-- Ensure all existing boolean features have defaults
UPDATE vehicles SET has_carplay = false WHERE has_carplay IS NULL;
UPDATE vehicles SET has_android_auto = false WHERE has_android_auto IS NULL;
UPDATE vehicles SET has_backup_camera = false WHERE has_backup_camera IS NULL;
UPDATE vehicles SET has_sunroof = false WHERE has_sunroof IS NULL;
UPDATE vehicles SET has_roof_rack = false WHERE has_roof_rack IS NULL;
UPDATE vehicles SET has_snow_tires = false WHERE has_snow_tires IS NULL;
UPDATE vehicles SET is_pet_friendly = false WHERE is_pet_friendly IS NULL;
UPDATE vehicles SET has_toll_transponder = false WHERE has_toll_transponder IS NULL;
UPDATE vehicles SET has_portable_wifi = false WHERE has_portable_wifi IS NULL;
UPDATE vehicles SET inspektlabs_certified = false WHERE inspektlabs_certified IS NULL;
UPDATE vehicles SET is_demo = false WHERE is_demo IS NULL;
UPDATE vehicles SET nhtsa_recall_count = 0 WHERE nhtsa_recall_count IS NULL;

-- Map existing pet_friendly to is_pet_friendly
UPDATE vehicles SET is_pet_friendly = pet_friendly WHERE pet_friendly IS NOT NULL AND is_pet_friendly = false;

-- Map existing is_awd to drivetrain
UPDATE vehicles SET drivetrain = 'AWD' WHERE is_awd = true AND drivetrain IS NULL;
UPDATE vehicles SET drivetrain = 'FWD' WHERE (is_awd = false OR is_awd IS NULL) AND drivetrain IS NULL;

-- Map existing has_bike_rack/has_roof_box to has_roof_rack
UPDATE vehicles SET has_roof_rack = true WHERE (has_bike_rack = true OR has_roof_box = true) AND has_roof_rack = false;

-- Map category to body_style where not set
UPDATE vehicles SET body_style = 
  CASE 
    WHEN category = 'suv' THEN 'SUV'
    WHEN category = 'truck' THEN 'Truck'
    WHEN category = 'car' THEN 'Sedan'
    ELSE NULL
  END
WHERE body_style IS NULL AND category IS NOT NULL;

-- Map location_city to pickup_location
UPDATE vehicles SET pickup_location = location_city WHERE pickup_location IS NULL AND location_city IS NOT NULL;

-- Map images to photos
UPDATE vehicles SET photos = images WHERE photos = '{}' AND images IS NOT NULL AND array_length(images, 1) > 0;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 2: Migrate data from vehicle_listings to vehicles (if not already there)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Insert vehicle_listings that don't have a corresponding vehicle
INSERT INTO vehicles (
  id, host_id, make, model, year, category, daily_rate, 
  description, location_city, location_state, photos, 
  status, is_demo, created_at
)
SELECT 
  vl.id, 
  vl.host_id,
  COALESCE(v.make, 'Unknown') as make,
  COALESCE(v.model, 'Vehicle') as model,
  COALESCE(v.year, 2020) as year,
  v.category,
  COALESCE(vl.asking_price / 30, v.daily_rate, 100) as daily_rate,
  vl.seller_notes as description,
  COALESCE(v.location_city, 'Reno') as location_city,
  COALESCE(v.location_state, 'NV') as location_state,
  v.images as photos,
  'active' as status,
  false as is_demo,
  vl.created_at
FROM vehicle_listings vl
LEFT JOIN vehicles v ON vl.vehicle_id = v.id
WHERE vl.id NOT IN (SELECT id FROM vehicles)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 3: Create or update indexes for search performance
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_host ON vehicles(host_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_pickup_location ON vehicles(pickup_location);
CREATE INDEX IF NOT EXISTS idx_vehicles_drivetrain ON vehicles(drivetrain);
CREATE INDEX IF NOT EXISTS idx_vehicles_instant_book ON vehicles(instant_book);
CREATE INDEX IF NOT EXISTS idx_vehicles_daily_rate ON vehicles(daily_rate);
CREATE INDEX IF NOT EXISTS idx_vehicles_body_style ON vehicles(body_style);
CREATE INDEX IF NOT EXISTS idx_vehicles_seats ON vehicles(seats);
CREATE INDEX IF NOT EXISTS idx_vehicles_bouncie ON vehicles(bouncie_imei) WHERE bouncie_imei IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_inspektlabs ON vehicles(inspektlabs_certified) WHERE inspektlabs_certified = true;
CREATE INDEX IF NOT EXISTS idx_vehicles_demo ON vehicles(is_demo);

-- Composite index for common search patterns
CREATE INDEX IF NOT EXISTS idx_vehicles_search ON vehicles(status, pickup_location, body_style, daily_rate);

-- ═══════════════════════════════════════════════════════════════════════════════
-- STEP 4: Add instant_book column if not exists
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS instant_book bool DEFAULT false;

-- ═══════════════════════════════════════════════════════════════════════════════
-- DONE - Run verification queries after migration
-- ═══════════════════════════════════════════════════════════════════════════════

-- To verify, run:
-- SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'vehicles' ORDER BY ordinal_position;
