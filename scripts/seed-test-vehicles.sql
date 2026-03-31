-- Seed Test Vehicles for Dev/Stripe Testing
-- Run this after creating a test user in Supabase Auth

-- First, create a test host profile if it doesn't exist
-- You'll need to replace 'YOUR_TEST_USER_ID' with an actual user ID from auth.users
-- Or create a test user first via Supabase dashboard or sign-up flow

-- Check if we have any profiles, if not we'll create vehicles with a placeholder
DO $$
DECLARE
  test_host_id UUID;
BEGIN
  -- Try to get an existing host or any user
  SELECT id INTO test_host_id 
  FROM profiles 
  WHERE role IN ('host', 'admin') 
  LIMIT 1;
  
  -- If no host found, try any user
  IF test_host_id IS NULL THEN
    SELECT id INTO test_host_id FROM profiles LIMIT 1;
  END IF;
  
  -- If still no user, we can't proceed (need to create a user first)
  IF test_host_id IS NULL THEN
    RAISE NOTICE 'No users found. Please create a user first via sign-up, then run this script.';
    RETURN;
  END IF;

  -- Update the user to be a host if not already
  UPDATE profiles SET role = 'host', is_host_verified = true WHERE id = test_host_id;
  
  RAISE NOTICE 'Using host ID: %', test_host_id;

  -- Delete existing test vehicles (optional - comment out if you want to keep them)
  -- DELETE FROM vehicles WHERE make IN ('Jeep', 'Tesla') AND host_id = test_host_id;

  -- Insert Test Vehicle 1: Jeep Wrangler Rubicon (AWD, great for Tahoe testing)
  INSERT INTO vehicles (
    host_id,
    make,
    model,
    year,
    category,
    color,
    description,
    daily_rate,
    weekly_rate,
    security_deposit,
    mileage_limit,
    extra_mile_fee,
    seats,
    doors,
    fuel_type,
    transmission,
    is_awd,
    has_ski_rack,
    has_tow_hitch,
    pet_friendly,
    thumbnail_url,
    images,
    location_address,
    location_city,
    location_state,
    location_lat,
    location_lng,
    pickup_instructions,
    return_instructions,
    status,
    is_approved,
    is_featured,
    rating,
    review_count,
    total_trips,
    vin,
    license_plate
  ) VALUES (
    test_host_id,
    'Jeep',
    'Wrangler Rubicon',
    2024,
    'suv',
    'Firecracker Red',
    'Ultimate off-road capability with the Rubicon package. Locking differentials, disconnecting sway bar, and 33" mud-terrain tires. Ski rack included for winter adventures to Tahoe. Removable top for summer fun. This Jeep has conquered every trail in the Sierra Nevada.',
    12500, -- $125.00/day in cents
    75000, -- $750/week in cents
    50000, -- $500 security deposit in cents
    200,   -- 200 miles/day
    45,    -- $0.45/extra mile in cents
    4,
    4,
    'gasoline',
    'automatic',
    true,  -- AWD
    true,  -- ski rack
    true,  -- tow hitch
    true,  -- pet friendly
    'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800',
    ARRAY[
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200',
      'https://images.unsplash.com/photo-1506015391gy-1200x800.jpg?w=1200',
      'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200'
    ],
    '500 E 2nd St',
    'Reno',
    'NV',
    39.5296,
    -119.8138,
    'Vehicle is parked in the covered garage at 500 E 2nd St. Look for the red Jeep. Keyless entry - code will be provided 24 hours before pickup.',
    'Return to same location. Please return with at least 1/4 tank of gas. Leave keys in the lockbox.',
    'active',
    true,
    true,
    4.9,
    23,
    47,
    '1C4HJXFG0PW123456',
    'RAD-JEEP'
  )
  ON CONFLICT DO NOTHING;

  -- Insert Test Vehicle 2: Tesla Model 3 (Electric, city driving)
  INSERT INTO vehicles (
    host_id,
    make,
    model,
    year,
    category,
    color,
    description,
    daily_rate,
    weekly_rate,
    security_deposit,
    mileage_limit,
    extra_mile_fee,
    seats,
    doors,
    fuel_type,
    transmission,
    is_awd,
    has_ski_rack,
    pet_friendly,
    thumbnail_url,
    images,
    location_address,
    location_city,
    location_state,
    location_lat,
    location_lng,
    pickup_instructions,
    return_instructions,
    status,
    is_approved,
    is_featured,
    rating,
    review_count,
    total_trips,
    vin,
    license_plate
  ) VALUES (
    test_host_id,
    'Tesla',
    'Model 3 Long Range',
    2024,
    'car',
    'Pearl White',
    'Electric luxury with Autopilot. 358-mile range perfect for road trips to Lake Tahoe and back without charging. Premium interior with heated seats. Supercharger network access included. Experience the future of driving.',
    8900,  -- $89.00/day in cents
    55000, -- $550/week in cents
    35000, -- $350 security deposit in cents
    250,   -- 250 miles/day (EVs get more)
    35,    -- $0.35/extra mile in cents
    5,
    4,
    'electric',
    'automatic',
    true,  -- AWD (Long Range is AWD)
    false, -- no ski rack
    false, -- not pet friendly (white interior)
    'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800',
    ARRAY[
      'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200',
      'https://images.unsplash.com/photo-1554744512-d6c603f27c54?w=1200',
      'https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=1200'
    ],
    '255 N Virginia St',
    'Reno',
    'NV',
    39.5285,
    -119.8135,
    'Tesla is parked at the Whitney Peak Hotel garage, Level 2. App access will be shared - you can unlock with your phone. Charging cable in the frunk.',
    'Return to same spot. Please return with at least 50% charge. Supercharger locations marked in the car.',
    'active',
    true,
    true,
    4.8,
    45,
    89,
    '5YJ3E1EA0PF654321',
    'RAD-TSLA'
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Test vehicles created successfully!';
  
END $$;

-- Verify the vehicles were created
SELECT id, make, model, year, daily_rate/100.0 as daily_rate_dollars, status, is_approved, location_city 
FROM vehicles 
WHERE make IN ('Jeep', 'Tesla') 
ORDER BY created_at DESC;
