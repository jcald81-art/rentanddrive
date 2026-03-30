-- Migration: Vehicle Shipping and Test Drive Concierge
-- Part of The Car Lot selling feature

-- Vehicle Shipments table
CREATE TABLE IF NOT EXISTS vehicle_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_listing_id UUID REFERENCES vehicle_listings(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  carrier_name TEXT NOT NULL,
  quote_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'quoted' CHECK (status IN ('quoted', 'booked', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  origin_address TEXT,
  destination_address TEXT,
  destination_zip TEXT,
  tracking_number TEXT,
  estimated_delivery DATE,
  actual_delivery DATE,
  eagle_monitoring_active BOOLEAN DEFAULT true,
  carrier_quote_data JSONB DEFAULT '{}',
  stripe_payment_intent_id TEXT,
  platform_margin_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test Drive Requests table
CREATE TABLE IF NOT EXISTS test_drive_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES vehicle_listings(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  concierge_ride_id UUID,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  preferred_datetime TIMESTAMPTZ NOT NULL,
  pickup_address TEXT,
  message_to_host TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'scheduled', 'completed', 'converted_to_purchase', 'cancelled')),
  lyft_pickup_time TIMESTAMPTZ,
  lyft_confirmation_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shipments_listing ON vehicle_shipments(vehicle_listing_id);
CREATE INDEX IF NOT EXISTS idx_shipments_buyer ON vehicle_shipments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_seller ON vehicle_shipments(seller_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON vehicle_shipments(status);
CREATE INDEX IF NOT EXISTS idx_test_drives_listing ON test_drive_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_test_drives_requester ON test_drive_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_test_drives_status ON test_drive_requests(status);

-- Enable RLS
ALTER TABLE vehicle_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_drive_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicle_shipments
CREATE POLICY "Users can view their shipments"
  ON vehicle_shipments FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create shipments for their purchases"
  ON vehicle_shipments FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update their shipments"
  ON vehicle_shipments FOR UPDATE
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "Admins can manage all shipments"
  ON vehicle_shipments FOR ALL
  USING (is_admin());

-- RLS Policies for test_drive_requests
CREATE POLICY "Users can view their test drive requests"
  ON test_drive_requests FOR SELECT
  USING (
    auth.uid() = requester_id OR 
    auth.uid() IN (
      SELECT vl.seller_id FROM vehicle_listings vl WHERE vl.id = listing_id
    )
  );

CREATE POLICY "Users can create test drive requests"
  ON test_drive_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their test drive requests"
  ON test_drive_requests FOR UPDATE
  USING (
    auth.uid() = requester_id OR 
    auth.uid() IN (
      SELECT vl.seller_id FROM vehicle_listings vl WHERE vl.id = listing_id
    )
  );

CREATE POLICY "Admins can manage all test drive requests"
  ON test_drive_requests FOR ALL
  USING (is_admin());

-- Function to update shipment status and trigger notifications
CREATE OR REPLACE FUNCTION update_shipment_status(
  p_shipment_id UUID,
  p_status TEXT,
  p_tracking_number TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_shipment vehicle_shipments;
BEGIN
  UPDATE vehicle_shipments
  SET 
    status = p_status,
    tracking_number = COALESCE(p_tracking_number, tracking_number),
    actual_delivery = CASE WHEN p_status = 'delivered' THEN NOW() ELSE actual_delivery END,
    updated_at = NOW()
  WHERE id = p_shipment_id
  RETURNING * INTO v_shipment;
  
  -- Log for SecureLink notification trigger
  INSERT INTO platform_events (event_type, event_data)
  VALUES ('shipment_status_update', jsonb_build_object(
    'shipment_id', p_shipment_id,
    'status', p_status,
    'buyer_id', v_shipment.buyer_id,
    'seller_id', v_shipment.seller_id
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
