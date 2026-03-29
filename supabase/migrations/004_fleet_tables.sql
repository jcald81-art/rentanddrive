-- Rent and Drive LLC - Fleet Management Tables Migration

-- Fleet Telemetry (GPS/OBD data from Bouncie)
CREATE TABLE IF NOT EXISTS fleet_telemetry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  device_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  speed_mph INTEGER,
  heading INTEGER,
  altitude_ft INTEGER,
  odometer_miles INTEGER,
  fuel_level_percent INTEGER,
  battery_voltage DECIMAL(4, 2),
  engine_rpm INTEGER,
  coolant_temp_f INTEGER,
  dtc_codes TEXT[],
  is_ignition_on BOOLEAN,
  is_moving BOOLEAN,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fleet Alerts
CREATE TABLE IF NOT EXISTS fleet_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'speed_violation', 'geofence_exit', 'geofence_enter', 'curfew_violation',
    'hard_brake', 'hard_acceleration', 'crash_detected', 'tow_detected',
    'low_battery', 'low_fuel', 'engine_light', 'device_offline',
    'unauthorized_use', 'maintenance_due', 'insurance_expiring',
    'registration_expiring', 'recall_found', 'critical_recall'
  )),
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')) DEFAULT 'warning',
  title TEXT NOT NULL,
  description TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  speed_recorded INTEGER,
  speed_limit INTEGER,
  threshold_value INTEGER,
  actual_value INTEGER,
  is_resolved BOOLEAN DEFAULT FALSE,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  notified_host BOOLEAN DEFAULT FALSE,
  notified_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip Records (Bouncie trips)
CREATE TABLE IF NOT EXISTS trip_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  bouncie_trip_id TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  start_lat DECIMAL(10, 8),
  start_lng DECIMAL(11, 8),
  start_address TEXT,
  end_lat DECIMAL(10, 8),
  end_lng DECIMAL(11, 8),
  end_address TEXT,
  distance_miles DECIMAL(8, 2),
  duration_minutes INTEGER,
  max_speed_mph INTEGER,
  avg_speed_mph INTEGER,
  hard_brakes INTEGER DEFAULT 0,
  hard_accelerations INTEGER DEFAULT 0,
  idle_time_minutes INTEGER DEFAULT 0,
  fuel_used_gallons DECIMAL(6, 2),
  driving_score INTEGER CHECK (driving_score >= 0 AND driving_score <= 100),
  route_polyline TEXT,
  waypoints JSONB,
  is_within_geofence BOOLEAN DEFAULT TRUE,
  curfew_violation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lockboxes (Igloo lockboxes)
CREATE TABLE IF NOT EXISTS lockboxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  igloo_device_id TEXT,
  serial_number TEXT,
  name TEXT,
  location_description TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT TRUE,
  battery_level INTEGER,
  last_accessed_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lockbox Access Codes
CREATE TABLE IF NOT EXISTS lockbox_access_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lockbox_id UUID NOT NULL REFERENCES lockboxes(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  code_type TEXT CHECK (code_type IN ('master', 'temporary', 'one_time')) DEFAULT 'temporary',
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  used_count INTEGER DEFAULT 0,
  max_uses INTEGER,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Geofences
CREATE TABLE IF NOT EXISTS geofences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  fence_type TEXT CHECK (fence_type IN ('circle', 'polygon')) DEFAULT 'circle',
  center_lat DECIMAL(10, 8),
  center_lng DECIMAL(11, 8),
  radius_miles DECIMAL(6, 2),
  polygon_coordinates JSONB,
  alert_on_exit BOOLEAN DEFAULT TRUE,
  alert_on_enter BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Curfews
CREATE TABLE IF NOT EXISTS curfews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days_of_week INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fleet tables
CREATE INDEX IF NOT EXISTS idx_fleet_telemetry_vehicle ON fleet_telemetry(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_telemetry_timestamp ON fleet_telemetry(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_fleet_telemetry_location ON fleet_telemetry USING gist (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

CREATE INDEX IF NOT EXISTS idx_fleet_alerts_vehicle ON fleet_alerts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_alerts_type ON fleet_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_fleet_alerts_unresolved ON fleet_alerts(vehicle_id) WHERE is_resolved = FALSE;

CREATE INDEX IF NOT EXISTS idx_trip_records_vehicle ON trip_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trip_records_booking ON trip_records(booking_id);
CREATE INDEX IF NOT EXISTS idx_trip_records_time ON trip_records(start_time DESC);

CREATE INDEX IF NOT EXISTS idx_lockboxes_vehicle ON lockboxes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_lockboxes_host ON lockboxes(host_id);
CREATE INDEX IF NOT EXISTS idx_lockbox_codes_lockbox ON lockbox_access_codes(lockbox_id);
CREATE INDEX IF NOT EXISTS idx_lockbox_codes_booking ON lockbox_access_codes(booking_id);
