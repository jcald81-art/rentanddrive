-- Migration: Car Lot / Vehicle Selling Ecosystem
-- Adds sell-while-renting, private listings, and instant offers

-- Add selling columns to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS for_sale BOOLEAN DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS asking_price DECIMAL(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS sale_notes TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS sell_while_renting BOOLEAN DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS sale_status TEXT DEFAULT 'not_listed' 
  CHECK (sale_status IN ('not_listed', 'active', 'pending_sale', 'sold'));
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS sold_price DECIMAL(10,2);

-- Vehicle listings table for Car Lot
CREATE TABLE IF NOT EXISTS vehicle_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  asking_price DECIMAL(10,2) NOT NULL,
  condition TEXT CHECK (condition IN ('excellent', 'good', 'fair')) DEFAULT 'good',
  seller_notes TEXT,
  rent_to_own_discount_cents INTEGER DEFAULT 0,
  sale_type TEXT CHECK (sale_type IN ('private', 'instant', 'both')) DEFAULT 'private',
  fast_lane_status TEXT CHECK (fast_lane_status IN ('pending', 'offers_received', 'accepted', 'declined')),
  carvana_offer_cents INTEGER,
  carmax_offer_cents INTEGER,
  dealer_offer_cents INTEGER,
  offer_expires_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('active', 'pending', 'sold', 'withdrawn')) DEFAULT 'active',
  views_count INTEGER DEFAULT 0,
  inquiries_count INTEGER DEFAULT 0,
  listed_at TIMESTAMPTZ DEFAULT now(),
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Car Lot inquiries table
CREATE TABLE IF NOT EXISTS car_lot_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES vehicle_listings(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  offer_amount DECIMAL(10,2),
  status TEXT CHECK (status IN ('pending', 'responded', 'accepted', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_listings_vehicle ON vehicle_listings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_listings_host ON vehicle_listings(host_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_listings_status ON vehicle_listings(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_listings_price ON vehicle_listings(asking_price);
CREATE INDEX IF NOT EXISTS idx_car_lot_inquiries_listing ON car_lot_inquiries(listing_id);
CREATE INDEX IF NOT EXISTS idx_car_lot_inquiries_buyer ON car_lot_inquiries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_for_sale ON vehicles(for_sale) WHERE for_sale = true;
CREATE INDEX IF NOT EXISTS idx_vehicles_sale_status ON vehicles(sale_status);

-- Enable RLS
ALTER TABLE vehicle_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_lot_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicle_listings
CREATE POLICY "Public can view active listings"
  ON vehicle_listings FOR SELECT
  USING (status = 'active');

CREATE POLICY "Hosts can manage own listings"
  ON vehicle_listings FOR ALL
  USING (auth.uid() = host_id);

CREATE POLICY "Admins can manage all listings"
  ON vehicle_listings FOR ALL
  USING (is_admin());

-- RLS Policies for car_lot_inquiries
CREATE POLICY "Buyers can view own inquiries"
  ON car_lot_inquiries FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Hosts can view inquiries on their listings"
  ON car_lot_inquiries FOR SELECT
  USING (
    listing_id IN (
      SELECT id FROM vehicle_listings WHERE host_id = auth.uid()
    )
  );

CREATE POLICY "Users can create inquiries"
  ON car_lot_inquiries FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Hosts can update inquiry status"
  ON car_lot_inquiries FOR UPDATE
  USING (
    listing_id IN (
      SELECT id FROM vehicle_listings WHERE host_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all inquiries"
  ON car_lot_inquiries FOR ALL
  USING (is_admin());

-- RPC function to increment listing views
CREATE OR REPLACE FUNCTION increment_listing_views(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE vehicle_listings
  SET views_count = views_count + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to increment listing inquiries count
CREATE OR REPLACE FUNCTION increment_listing_inquiries(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE vehicle_listings
  SET inquiries_count = inquiries_count + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
