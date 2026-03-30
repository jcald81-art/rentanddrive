-- Create vehicles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'car', -- car, suv, truck, motorcycle, rv, atv
  daily_rate DECIMAL(10,2) NOT NULL,
  description TEXT,
  location_city TEXT NOT NULL DEFAULT 'Reno',
  location_state TEXT NOT NULL DEFAULT 'NV',
  location_lat DECIMAL(10,7),
  location_lng DECIMAL(10,7),
  thumbnail TEXT,
  photos TEXT[] DEFAULT '{}',
  is_awd BOOLEAN DEFAULT false,
  has_ski_rack BOOLEAN DEFAULT false,
  has_tow_hitch BOOLEAN DEFAULT false,
  seats INTEGER DEFAULT 5,
  fuel_type TEXT DEFAULT 'gasoline',
  transmission TEXT DEFAULT 'automatic',
  mileage INTEGER,
  vin TEXT,
  license_plate TEXT,
  instant_book BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  rating DECIMAL(2,1) DEFAULT 0,
  trip_count INTEGER DEFAULT 0,
  turo_id TEXT, -- for Turo sync
  turo_calendar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create active_listings view for searching
CREATE OR REPLACE VIEW public.active_listings AS
SELECT 
  v.id,
  v.host_id,
  v.make,
  v.model,
  v.year,
  v.category,
  v.daily_rate,
  v.description,
  v.location_city,
  v.location_state,
  v.location_lat,
  v.location_lng,
  v.thumbnail,
  v.photos,
  v.is_awd,
  v.has_ski_rack,
  v.has_tow_hitch,
  v.seats,
  v.fuel_type,
  v.transmission,
  v.instant_book,
  v.rating,
  v.trip_count,
  v.created_at,
  u.raw_user_meta_data->>'full_name' AS host_name,
  u.raw_user_meta_data->>'avatar_url' AS host_avatar
FROM public.vehicles v
JOIN auth.users u ON v.host_id = u.id
WHERE v.is_active = true;

-- Enable RLS on vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Policies for vehicles
DROP POLICY IF EXISTS "Anyone can view active vehicles" ON public.vehicles;
CREATE POLICY "Anyone can view active vehicles" ON public.vehicles 
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Hosts can insert their own vehicles" ON public.vehicles;
CREATE POLICY "Hosts can insert their own vehicles" ON public.vehicles 
  FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update their own vehicles" ON public.vehicles;
CREATE POLICY "Hosts can update their own vehicles" ON public.vehicles 
  FOR UPDATE USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can delete their own vehicles" ON public.vehicles;
CREATE POLICY "Hosts can delete their own vehicles" ON public.vehicles 
  FOR DELETE USING (auth.uid() = host_id);

-- Insert sample vehicles for testing
INSERT INTO public.vehicles (host_id, make, model, year, category, daily_rate, location_city, location_state, is_awd, has_ski_rack, instant_book, rating, trip_count, thumbnail, description, seats) 
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  make, model, year, category, daily_rate, location_city, location_state, is_awd, has_ski_rack, instant_book, rating, trip_count, thumbnail, description, seats
FROM (VALUES
  ('Tesla', 'Model 3', 2024, 'car', 89.00, 'Reno', 'NV', false, false, true, 4.9, 47, '/images/vehicles/tesla-model3.jpg', 'Electric luxury with autopilot. Perfect for road trips to Lake Tahoe.', 5),
  ('Jeep', 'Wrangler Rubicon', 2023, 'suv', 125.00, 'Reno', 'NV', true, true, true, 4.8, 62, '/images/vehicles/jeep-wrangler.jpg', 'Ultimate off-road capability. Ski rack included for winter adventures.', 4),
  ('Ford', 'F-150 Raptor', 2024, 'truck', 175.00, 'Reno', 'NV', true, true, true, 5.0, 23, '/images/vehicles/ford-raptor.jpg', 'Desert beast with tow package. Ready for any terrain.', 5),
  ('BMW', 'X5 M', 2023, 'suv', 145.00, 'Sparks', 'NV', true, true, true, 4.7, 35, '/images/vehicles/bmw-x5.jpg', 'Luxury meets performance. AWD with premium ski rack.', 5),
  ('Porsche', '911 Carrera', 2024, 'car', 299.00, 'Reno', 'NV', false, false, true, 5.0, 12, '/images/vehicles/porsche-911.jpg', 'Iconic sports car. Weekend special available.', 2),
  ('Toyota', '4Runner TRD Pro', 2024, 'suv', 115.00, 'Reno', 'NV', true, true, true, 4.9, 89, '/images/vehicles/4runner.jpg', 'Trail-ready with rooftop tent compatibility. Perfect for camping.', 5)
) AS sample(make, model, year, category, daily_rate, location_city, location_state, is_awd, has_ski_rack, instant_book, rating, trip_count, thumbnail, description, seats)
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
ON CONFLICT DO NOTHING;
