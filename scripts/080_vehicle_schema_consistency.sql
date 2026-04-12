-- ============================================================
-- 080_vehicle_schema_consistency.sql
-- Ensures location columns exist and are synced for vehicle queries
-- ============================================================

-- 1. Add location_city and location_state columns if they don't exist
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_state TEXT;

-- 2. Backfill location_city and location_state from city/state columns
UPDATE vehicles 
SET 
  location_city = COALESCE(location_city, city),
  location_state = COALESCE(location_state, state)
WHERE location_city IS NULL OR location_state IS NULL;

-- 3. Create a trigger function to keep location columns in sync
CREATE OR REPLACE FUNCTION sync_vehicle_location_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- If city/state are updated, sync to location_city/location_state
  IF NEW.city IS DISTINCT FROM OLD.city THEN
    NEW.location_city := NEW.city;
  END IF;
  
  IF NEW.state IS DISTINCT FROM OLD.state THEN
    NEW.location_state := NEW.state;
  END IF;
  
  -- If location_city/location_state are updated, sync to city/state
  IF NEW.location_city IS DISTINCT FROM OLD.location_city THEN
    NEW.city := NEW.location_city;
  END IF;
  
  IF NEW.location_state IS DISTINCT FROM OLD.location_state THEN
    NEW.state := NEW.location_state;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS vehicle_location_sync_trigger ON vehicles;

CREATE TRIGGER vehicle_location_sync_trigger
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION sync_vehicle_location_columns();

-- 5. Delete the ghost Kitt record (draft with no bookings)
DELETE FROM vehicles 
WHERE vin = '7SAYGDEE8NF38682' 
  AND listing_status = 'draft'
  AND id NOT IN (SELECT DISTINCT vehicle_id FROM bookings WHERE vehicle_id IS NOT NULL);

-- 6. Create index on location columns for faster queries
CREATE INDEX IF NOT EXISTS idx_vehicles_location_city ON vehicles(location_city);
CREATE INDEX IF NOT EXISTS idx_vehicles_location_state ON vehicles(location_state);

-- Done!
SELECT 'Migration 080_vehicle_schema_consistency completed successfully' AS status;
