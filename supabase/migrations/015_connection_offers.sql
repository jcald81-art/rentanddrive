-- Connection Offers Table
-- Tracks when R&D agents offer to connect renters and hosts
CREATE TABLE IF NOT EXISTS connection_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  offered_by_agent TEXT NOT NULL DEFAULT 'SecureLink',
  connection_type TEXT NOT NULL CHECK (connection_type IN ('text', 'call')),
  initiator_role TEXT NOT NULL CHECK (initiator_role IN ('host', 'renter', 'system')),
  target_user_id UUID REFERENCES profiles(id),
  other_party_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connection Calls Table
-- Tracks call requests between parties
CREATE TABLE IF NOT EXISTS connection_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  caller_id UUID REFERENCES profiles(id),
  callee_id UUID REFERENCES profiles(id),
  initiated_by TEXT NOT NULL DEFAULT 'system',
  status TEXT NOT NULL DEFAULT 'connecting' CHECK (status IN ('connecting', 'connected', 'completed', 'missed', 'declined')),
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  connected_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_connection_offers_booking ON connection_offers(booking_id);
CREATE INDEX IF NOT EXISTS idx_connection_offers_target ON connection_offers(target_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_offers_status ON connection_offers(status);
CREATE INDEX IF NOT EXISTS idx_connection_calls_booking ON connection_calls(booking_id);

-- RLS
ALTER TABLE connection_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_calls ENABLE ROW LEVEL SECURITY;

-- Users can see their own connection offers
CREATE POLICY "Users see own connection offers"
  ON connection_offers FOR SELECT
  USING (target_user_id = auth.uid() OR other_party_id = auth.uid());

-- System can manage all offers
CREATE POLICY "System manages connection offers"
  ON connection_offers FOR ALL
  USING (true);

-- Users can see their own calls
CREATE POLICY "Users see own calls"
  ON connection_calls FOR SELECT
  USING (caller_id = auth.uid() OR callee_id = auth.uid());

-- System can manage all calls
CREATE POLICY "System manages connection calls"
  ON connection_calls FOR ALL
  USING (true);

-- Function to expire old connection offers
CREATE OR REPLACE FUNCTION expire_old_connection_offers()
RETURNS void AS $$
BEGIN
  UPDATE connection_offers
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
