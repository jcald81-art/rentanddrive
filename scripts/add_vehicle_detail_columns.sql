-- Add missing vehicle detail columns for search filtering
-- These columns store vehicle attributes needed for filtering and display

-- Vehicle specification columns
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS trim TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS body_class TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS drivetrain TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS engine_info TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'car';

-- Actual vehicle mileage (different from mileage_limit which is daily miles allowed)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS mileage INTEGER;

-- Features stored as JSONB array for flexible filtering
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

-- AI pricing flag
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS ai_pricing_enabled BOOLEAN DEFAULT false;

-- Additional useful columns for filtering
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transmission TEXT DEFAULT 'automatic';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS exterior_color TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS interior_color TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS seating_capacity INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS doors INTEGER;

-- Create indexes for common filter columns
CREATE INDEX IF NOT EXISTS idx_vehicles_body_class ON vehicles(body_class);
CREATE INDEX IF NOT EXISTS idx_vehicles_drivetrain ON vehicles(drivetrain);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type ON vehicles(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_transmission ON vehicles(transmission);
CREATE INDEX IF NOT EXISTS idx_vehicles_features ON vehicles USING GIN(features);

-- Add comments for documentation
COMMENT ON COLUMN vehicles.trim IS 'Vehicle trim level (e.g., LX, EX, Sport)';
COMMENT ON COLUMN vehicles.body_class IS 'Body style from VIN decode (e.g., SUV, Sedan, Truck)';
COMMENT ON COLUMN vehicles.drivetrain IS 'Drive type (e.g., FWD, RWD, AWD, 4WD)';
COMMENT ON COLUMN vehicles.engine_info IS 'Engine specification string';
COMMENT ON COLUMN vehicles.vehicle_type IS 'Category type (car, suv, truck, van, exotic)';
COMMENT ON COLUMN vehicles.mileage IS 'Current vehicle odometer reading';
COMMENT ON COLUMN vehicles.features IS 'JSON array of feature strings for filtering';
COMMENT ON COLUMN vehicles.ai_pricing_enabled IS 'Whether AI dynamic pricing is enabled';
