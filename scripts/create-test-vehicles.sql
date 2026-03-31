-- Simple test vehicles insertion
-- First, ensure we have necessary columns

-- Add missing columns if they don't exist
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_test_vehicle BOOLEAN DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS smoking_policy TEXT DEFAULT 'RAD Clean';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS keyless_entry BOOLEAN DEFAULT true;

-- Deactivate all non-test vehicles for dev testing
UPDATE vehicles SET is_active = false WHERE is_test_vehicle IS NOT true;

-- Insert test vehicles (will use existing host or create placeholder)
INSERT INTO vehicles (
  make,
  model,
  year,
  vin,
  license_plate,
  daily_rate,
  description,
  category,
  location,
  is_available,
  is_active,
  is_test_vehicle,
  smoking_policy,
  keyless_entry,
  images,
  features
) VALUES 
(
  'Audi',
  'Q5 Premium Plus',
  2014,
  'WA1LFAFP5EA012345',
  'NV-TEST-01',
  135.00,
  'Luxury compact SUV perfect for Tahoe trips. All-wheel drive, heated seats, panoramic sunroof. CarFidelity Certified with Eagle Eye GPS tracking.',
  'suv',
  'Reno',
  true,
  true,
  true,
  'RAD Clean',
  true,
  ARRAY['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800', 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800'],
  ARRAY['AWD', 'Heated Seats', 'Panoramic Sunroof', 'Leather Interior', 'Navigation', 'Backup Camera', 'Eagle Eye GPS']
),
(
  'Tesla',
  'Model Y Long Range',
  2022,
  '5YJYGDEE1MF123456',
  'NV-TEST-02',
  115.00,
  'All-electric SUV with 330 miles of range. Autopilot, premium interior, glass roof. Perfect for eco-conscious adventurers.',
  'suv',
  'Reno',
  true,
  true,
  true,
  'RAD Clean',
  true,
  ARRAY['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800', 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800'],
  ARRAY['Electric', 'Autopilot', 'Glass Roof', 'Premium Audio', '330mi Range', 'Supercharger Access', 'Eagle Eye GPS']
)
ON CONFLICT (vin) DO UPDATE SET
  is_active = true,
  is_test_vehicle = true,
  daily_rate = EXCLUDED.daily_rate;
