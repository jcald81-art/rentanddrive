-- Bouncie GPS Tracking Integration Tables for R&D Agent
-- Migration: 005_create_bouncie_tracking_tables.sql

-- Store Bouncie device connections to vehicles
CREATE TABLE IF NOT EXISTS public.bouncie_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  bouncie_device_id TEXT NOT NULL UNIQUE,
  imei TEXT,
  nickname TEXT,
  vin TEXT,
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  battery_voltage DECIMAL(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store real-time vehicle locations
CREATE TABLE IF NOT EXISTS public.bouncie_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.bouncie_devices(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  speed_mph DECIMAL(5,1),
  heading INTEGER,
  altitude_ft DECIMAL(8,2),
  accuracy_meters DECIMAL(6,2),
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store trip history from Bouncie
CREATE TABLE IF NOT EXISTS public.bouncie_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.bouncie_devices(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  bouncie_trip_id TEXT UNIQUE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  start_location JSONB, -- {lat, lng, address}
  end_location JSONB,   -- {lat, lng, address}
  distance_miles DECIMAL(8,2),
  duration_minutes INTEGER,
  max_speed_mph DECIMAL(5,1),
  avg_speed_mph DECIMAL(5,1),
  hard_brakes INTEGER DEFAULT 0,
  hard_accelerations INTEGER DEFAULT 0,
  idle_time_minutes INTEGER DEFAULT 0,
  fuel_used_gallons DECIMAL(5,2),
  is_during_booking BOOLEAN DEFAULT false,
  booking_id UUID REFERENCES public.bookings(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store vehicle health/diagnostic alerts
CREATE TABLE IF NOT EXISTS public.bouncie_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.bouncie_devices(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'low_battery', 'mil_on', 'speeding', 'geofence_exit', 'harsh_driving', 'unauthorized_use'
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  data JSONB, -- Additional context
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  agent_response TEXT, -- What R&D agent did about it
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store geofences for vehicles
CREATE TABLE IF NOT EXISTS public.bouncie_geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE, -- Linked to booking for auto-management
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE, -- NULL means applies to all
  device_id UUID REFERENCES public.bouncie_devices(id) ON DELETE CASCADE,
  bouncie_geozone_id TEXT, -- ID from Bouncie API
  name TEXT NOT NULL,
  geofence_type TEXT NOT NULL DEFAULT 'allowed_area' CHECK (geofence_type IN ('allowed_area', 'restricted_area', 'pickup_location', 'dropoff_location', 'booking_boundary')),
  center_lat DECIMAL(10,7) NOT NULL,
  center_lng DECIMAL(10,7) NOT NULL,
  radius_miles DECIMAL(6,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notify_on_enter BOOLEAN DEFAULT true,
  notify_on_exit BOOLEAN DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default geofence: Reno/Tahoe area (100 mile radius from Reno)
INSERT INTO public.bouncie_geofences (name, geofence_type, center_lat, center_lng, radius_miles, is_active, notify_on_enter, notify_on_exit)
VALUES ('Reno-Tahoe Service Area', 'allowed_area', 39.5296, -119.8138, 100, true, false, true)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bouncie_locations_device_time ON public.bouncie_locations(device_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_bouncie_locations_vehicle ON public.bouncie_locations(vehicle_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_bouncie_trips_vehicle ON public.bouncie_trips(vehicle_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_bouncie_trips_booking ON public.bouncie_trips(booking_id);
CREATE INDEX IF NOT EXISTS idx_bouncie_alerts_vehicle ON public.bouncie_alerts(vehicle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bouncie_alerts_unacknowledged ON public.bouncie_alerts(is_acknowledged, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bouncie_devices_vehicle ON public.bouncie_devices(vehicle_id);

-- Enable RLS
ALTER TABLE public.bouncie_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bouncie_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bouncie_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bouncie_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bouncie_geofences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role has full access, hosts can view their vehicles
DROP POLICY IF EXISTS "Service role full access to bouncie_devices" ON public.bouncie_devices;
CREATE POLICY "Service role full access to bouncie_devices" ON public.bouncie_devices 
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Hosts can view their vehicle devices" ON public.bouncie_devices;
CREATE POLICY "Hosts can view their vehicle devices" ON public.bouncie_devices 
  FOR SELECT USING (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE host_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role full access to bouncie_locations" ON public.bouncie_locations;
CREATE POLICY "Service role full access to bouncie_locations" ON public.bouncie_locations 
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Hosts can view their vehicle locations" ON public.bouncie_locations;
CREATE POLICY "Hosts can view their vehicle locations" ON public.bouncie_locations 
  FOR SELECT USING (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE host_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role full access to bouncie_trips" ON public.bouncie_trips;
CREATE POLICY "Service role full access to bouncie_trips" ON public.bouncie_trips 
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Hosts can view their vehicle trips" ON public.bouncie_trips;
CREATE POLICY "Hosts can view their vehicle trips" ON public.bouncie_trips 
  FOR SELECT USING (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE host_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role full access to bouncie_alerts" ON public.bouncie_alerts;
CREATE POLICY "Service role full access to bouncie_alerts" ON public.bouncie_alerts 
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Hosts can view and acknowledge their alerts" ON public.bouncie_alerts;
CREATE POLICY "Hosts can view and acknowledge their alerts" ON public.bouncie_alerts 
  FOR ALL USING (
    vehicle_id IN (SELECT id FROM public.vehicles WHERE host_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role full access to bouncie_geofences" ON public.bouncie_geofences;
CREATE POLICY "Service role full access to bouncie_geofences" ON public.bouncie_geofences 
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can view active geofences" ON public.bouncie_geofences;
CREATE POLICY "Anyone can view active geofences" ON public.bouncie_geofences 
  FOR SELECT USING (is_active = true);
